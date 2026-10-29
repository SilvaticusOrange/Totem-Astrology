<?php
/**
 * Shared Totem Connections directory helpers (SQLite + moderation).
 */
declare(strict_types=1);

const CONNECTIONS_API_VERSION = 10;
const CONNECTIONS_MAX_DISPLAY_NAME = 80;
const CONNECTIONS_MAX_INTRO = 280;
const CONNECTIONS_MAX_USERNAME = 32;
const CONNECTIONS_MIN_USERNAME = 3;
const CONNECTIONS_MIN_PASSWORD = 6;
const CONNECTIONS_USER_TOKEN_DAYS = 90;
const CONNECTIONS_VERIFICATION_EMAIL = 'alucardsilvaticus@gmail.com';

const CONNECTIONS_BIRTH_NONE = 'none';
const CONNECTIONS_BIRTH_PENDING = 'pending';
const CONNECTIONS_BIRTH_VERIFIED = 'verified';
const CONNECTIONS_BIRTH_REJECTED = 'rejected';
const CONNECTIONS_MAX_BIRTH_ID_BYTES = 8000000;

const CONNECTIONS_VALID_ANIMALS = [
    'Squirrel', 'Buffalo', 'Tiger', 'Cat', 'Dragon', 'Snake',
    'Horse', 'Deer', 'Monkey', 'Phoenix', 'Wolf', 'Bear',
];

const CONNECTIONS_VALID_ELEMENTS = ['Wood', 'Fire', 'Earth', 'Metal', 'Water'];

const CONNECTIONS_PROFILE_PILLARS = ['spirit', 'mental', 'emotional', 'physical'];

const CONNECTIONS_STATUS_PENDING = 'pending';
const CONNECTIONS_STATUS_APPROVED = 'approved';
const CONNECTIONS_STATUS_REJECTED = 'rejected';

function connectionsDataDir(): string
{
    return dirname(__DIR__) . '/data';
}

function connectionsDbPath(): string
{
    return connectionsDataDir() . '/connections.db';
}

function connectionsRespond(int $status, array $payload): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function connectionsReadJsonBody(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') {
        return [];
    }
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

function connectionsLoadConfig(): array
{
    $path = connectionsDataDir() . '/connections-config.php';
    if (!is_readable($path)) {
        return [
            'adminPassword' => '',
            'adminPasswordHash' => '',
            'notifyEmail' => '',
            'notifyOnSubmit' => false,
            'siteUrl' => 'https://totemastrology.com',
        ];
    }

    $config = require $path;
    return is_array($config) ? $config : [];
}

function connectionsEnsureStorage(): void
{
    $dataDir = connectionsDataDir();
    if (!is_dir($dataDir)) {
        @mkdir($dataDir, 0755, true);
    }
    if (!is_writable($dataDir)) {
        connectionsRespond(500, [
            'error' => 'Server storage is not writable. Create a writable data/ folder on the host.',
        ]);
    }
}

function connectionsSqliteAvailable(): bool
{
    return extension_loaded('pdo')
        && in_array('sqlite', PDO::getAvailableDrivers(), true);
}

function connectionsOpenDatabase(): PDO
{
    if (!connectionsSqliteAvailable()) {
        connectionsRespond(503, [
            'error' => 'SQLite is not enabled on this server. In GoDaddy cPanel, open Select PHP Version → Extensions and turn on pdo_sqlite.',
        ]);
    }

    try {
        $pdo = new PDO('sqlite:' . connectionsDbPath(), null, null, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
    } catch (PDOException $error) {
        connectionsRespond(500, [
            'error' => 'Could not create the connections database. Ensure public_html/data/ exists and is writable (try folder permissions 755 or 775).',
        ]);
    }
    $pdo->exec('PRAGMA foreign_keys = ON');
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS profiles (
            id TEXT PRIMARY KEY,
            display_name TEXT NOT NULL,
            spirit TEXT NOT NULL,
            mental TEXT NOT NULL,
            emotional TEXT NOT NULL,
            physical TEXT NOT NULL,
            intro TEXT,
            contact_email TEXT,
            manage_token_hash TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT \'approved\',
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL,
            reviewed_at INTEGER
        )'
    );
    $pdo->exec('CREATE INDEX IF NOT EXISTS idx_profiles_created ON profiles(created_at DESC)');

    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT NOT NULL COLLATE NOCASE,
            password_hash TEXT NOT NULL,
            display_name TEXT,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL,
            UNIQUE(username)
        )'
    );
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS user_sessions (
            token_hash TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            created_at INTEGER NOT NULL,
            expires_at INTEGER NOT NULL,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        )'
    );
    $pdo->exec('CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id)');
    $pdo->exec('CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at)');
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS password_resets (
            token_hash TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            created_at INTEGER NOT NULL,
            expires_at INTEGER NOT NULL
        )'
    );
    $pdo->exec('CREATE INDEX IF NOT EXISTS idx_password_resets_user ON password_resets(user_id)');

    connectionsMigrateDatabase($pdo);

    $pdo->exec('CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status, created_at DESC)');
    $pdo->exec('CREATE INDEX IF NOT EXISTS idx_profiles_user ON profiles(user_id)');

    return $pdo;
}

function connectionsMigrateDatabase(PDO $pdo): void
{
    $columns = [];
    $stmt = $pdo->query('PRAGMA table_info(profiles)');
    foreach ($stmt->fetchAll() as $column) {
        $columns[$column['name']] = true;
    }

    if (!isset($columns['status'])) {
        $pdo->exec('ALTER TABLE profiles ADD COLUMN status TEXT NOT NULL DEFAULT \'approved\'');
    }
    if (!isset($columns['reviewed_at'])) {
        $pdo->exec('ALTER TABLE profiles ADD COLUMN reviewed_at INTEGER');
    }
    foreach (CONNECTIONS_PROFILE_PILLARS as $pillar) {
        $column = $pillar . '_element';
        if (!isset($columns[$column])) {
            $pdo->exec('ALTER TABLE profiles ADD COLUMN ' . $column . ' TEXT');
        }
    }

    $locationColumns = [
        'location_city' => 'TEXT',
        'location_region' => 'TEXT',
        'location_country' => 'TEXT',
        'location_lat' => 'REAL',
        'location_lon' => 'REAL',
    ];
    foreach ($locationColumns as $column => $type) {
        if (!isset($columns[$column])) {
            $pdo->exec('ALTER TABLE profiles ADD COLUMN ' . $column . ' ' . $type);
        }
    }

    if (!isset($columns['user_id'])) {
        $pdo->exec('ALTER TABLE profiles ADD COLUMN user_id TEXT');
    }

    $pdo->exec(
        'UPDATE profiles SET status = \'approved\'
         WHERE status IS NULL OR TRIM(status) = \'\''
    );

    connectionsMigrateUsersTable($pdo);
}

function connectionsMigrateUsersTable(PDO $pdo): void
{
    $columns = [];
    $stmt = $pdo->query('PRAGMA table_info(users)');
    foreach ($stmt->fetchAll() as $column) {
        $columns[$column['name']] = true;
    }
    if (!$columns) {
        return;
    }

    $add = [
        'email' => 'TEXT',
        'phone' => 'TEXT',
        'email_verified' => 'INTEGER NOT NULL DEFAULT 0',
        'phone_verified' => 'INTEGER NOT NULL DEFAULT 0',
        'birth_date' => 'TEXT',
        'birth_time' => 'TEXT',
        'birth_place' => 'TEXT',
        'birth_name' => 'TEXT',
        'birth_verification_status' => 'TEXT NOT NULL DEFAULT \'none\'',
        'birth_verification_note' => 'TEXT',
        'birth_id_path' => 'TEXT',
        'birth_id_original_name' => 'TEXT',
        'birth_verified_at' => 'INTEGER',
        'birth_reviewed_at' => 'INTEGER',
        'birth_time_verification_status' => 'TEXT NOT NULL DEFAULT \'none\'',
        'birth_time_verification_note' => 'TEXT',
        'birth_time_id_path' => 'TEXT',
        'birth_time_id_original_name' => 'TEXT',
        'birth_time_verified_at' => 'INTEGER',
        'birth_time_reviewed_at' => 'INTEGER',
    ];
    foreach ($add as $column => $type) {
        if (!isset($columns[$column])) {
            $pdo->exec('ALTER TABLE users ADD COLUMN ' . $column . ' ' . $type);
        }
    }

    $pdo->exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE email IS NOT NULL AND TRIM(email) != \'\'');
    $pdo->exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone ON users(phone) WHERE phone IS NOT NULL AND TRIM(phone) != \'\'');
    $pdo->exec('CREATE INDEX IF NOT EXISTS idx_users_birth_status ON users(birth_verification_status, updated_at DESC)');
    $pdo->exec('CREATE INDEX IF NOT EXISTS idx_users_birth_time_status ON users(birth_time_verification_status, updated_at DESC)');

    // Public name is always the account username across site, directory, and app.
    $pdo->exec(
        "UPDATE users
         SET display_name = username
         WHERE username IS NOT NULL
           AND TRIM(username) != ''
           AND (display_name IS NULL OR display_name != username)"
    );
    $pdo->exec(
        "UPDATE profiles
         SET display_name = (
             SELECT username FROM users WHERE users.id = profiles.user_id
         )
         WHERE user_id IS NOT NULL
           AND TRIM(user_id) != ''
           AND EXISTS (SELECT 1 FROM users WHERE users.id = profiles.user_id)
           AND display_name != (
             SELECT username FROM users WHERE users.id = profiles.user_id
           )"
    );
}

function connectionsUploadsDir(): string
{
    return connectionsDataDir() . '/uploads/birth-ids';
}

function connectionsEnsureUploadsDir(): void
{
    $dir = connectionsUploadsDir();
    if (!is_dir($dir)) {
        @mkdir($dir, 0755, true);
    }
    if (!is_writable($dir)) {
        connectionsRespond(500, [
            'error' => 'Upload storage is not writable. Ensure public_html/data/uploads/ is writable.',
        ]);
    }
}

function connectionsSanitizeText(string $value, int $maxLength): string
{
    $value = trim(strip_tags($value));
    if (function_exists('mb_substr')) {
        return mb_substr($value, 0, $maxLength);
    }
    return substr($value, 0, $maxLength);
}

function connectionsValidateAnimal(string $animal): ?string
{
    return in_array($animal, CONNECTIONS_VALID_ANIMALS, true) ? $animal : null;
}

function connectionsValidateElement(string $element): ?string
{
    return in_array($element, CONNECTIONS_VALID_ELEMENTS, true) ? $element : null;
}

function connectionsValidateProfileAnimals(array $body): ?array
{
    $elementsInput = is_array($body['elements'] ?? null) ? $body['elements'] : [];
    $profile = [];
    foreach (CONNECTIONS_PROFILE_PILLARS as $key) {
        $animal = connectionsValidateAnimal((string) ($body[$key] ?? ''));
        if ($animal === null) {
            return null;
        }
        $profile[$key] = $animal;
        $element = connectionsValidateElement((string) ($elementsInput[$key] ?? ''));
        $profile[$key . 'Element'] = $element ?? '';
    }
    return $profile;
}

function connectionsProfileElementsFromRow(array $row): array
{
    $elements = [];
    foreach (CONNECTIONS_PROFILE_PILLARS as $pillar) {
        $elements[$pillar] = (string) ($row[$pillar . '_element'] ?? '');
    }
    return $elements;
}

function connectionsFormatElementAnimal(string $animal, string $element = ''): string
{
    return $element !== '' ? $element . ' ' . $animal : $animal;
}

function connectionsValidateLocation(array $body): ?array
{
    $location = is_array($body['location'] ?? null) ? $body['location'] : null;
    if ($location === null) {
        return [
            'city' => '',
            'region' => '',
            'country' => '',
            'lat' => null,
            'lon' => null,
        ];
    }

    $city = connectionsSanitizeText((string) ($location['city'] ?? $location['name'] ?? ''), 80);
    $region = connectionsSanitizeText((string) ($location['region'] ?? $location['admin1'] ?? ''), 80);
    $country = connectionsSanitizeText((string) ($location['country'] ?? ''), 80);
    $lat = isset($location['lat']) ? (float) $location['lat'] : null;
    $lon = isset($location['lon']) ? (float) $location['lon'] : null;

    if ($city === '' && $country === '') {
        return [
            'city' => '',
            'region' => '',
            'country' => '',
            'lat' => null,
            'lon' => null,
        ];
    }

    if ($lat !== null && ($lat < -90 || $lat > 90)) {
        return null;
    }
    if ($lon !== null && ($lon < -180 || $lon > 180)) {
        return null;
    }

    // Require coordinates when a location label is provided so nearby search works.
    if (($city !== '' || $country !== '') && ($lat === null || $lon === null)) {
        return null;
    }

    return [
        'city' => $city,
        'region' => $region,
        'country' => $country,
        'lat' => $lat,
        'lon' => $lon,
    ];
}

function connectionsHaversineKm(float $lat1, float $lon1, float $lat2, float $lon2): float
{
    $earthKm = 6371.0;
    $dLat = deg2rad($lat2 - $lat1);
    $dLon = deg2rad($lon2 - $lon1);
    $a = sin($dLat / 2) ** 2
        + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLon / 2) ** 2;
    return 2 * $earthKm * asin(min(1, sqrt($a)));
}

function connectionsProfileLocationFromRow(array $row): ?array
{
    $city = trim((string) ($row['location_city'] ?? ''));
    $region = trim((string) ($row['location_region'] ?? ''));
    $country = trim((string) ($row['location_country'] ?? ''));
    $lat = $row['location_lat'] ?? null;
    $lon = $row['location_lon'] ?? null;

    if ($city === '' && $country === '') {
        return null;
    }

    $labelParts = array_values(array_filter([$city, $region !== $city ? $region : '', $country]));
    $location = [
        'city' => $city,
        'region' => $region,
        'country' => $country,
        'label' => implode(', ', $labelParts),
    ];
    if ($lat !== null && $lon !== null && $lat !== '' && $lon !== '') {
        $location['lat'] = (float) $lat;
        $location['lon'] = (float) $lon;
    }
    return $location;
}

function connectionsPublicProfile(array $row, bool $includeStatus = false): array
{
    $username = trim((string) ($row['username'] ?? ''));
    $profile = [
        'id' => $row['id'],
        'displayName' => $username !== '' ? $username : (string) ($row['display_name'] ?? ''),
        'spirit' => $row['spirit'],
        'mental' => $row['mental'],
        'emotional' => $row['emotional'],
        'physical' => $row['physical'],
        'elements' => connectionsProfileElementsFromRow($row),
        'intro' => $row['intro'] ?? '',
        'hasEmail' => !empty($row['contact_email']),
        'createdAt' => (int) $row['created_at'],
        // Date-ID Verified = day/month/year confirmed (3 of 4 animals).
        // Time Verified = hour confirmed via birth certificate / sworn declaration (4th animal).
        'birthVerified' => ((string) ($row['birth_verification_status'] ?? '')) === CONNECTIONS_BIRTH_VERIFIED,
        'birthTimeVerified' => ((string) ($row['birth_time_verification_status'] ?? '')) === CONNECTIONS_BIRTH_VERIFIED,
    ];
    $location = connectionsProfileLocationFromRow($row);
    if ($location !== null) {
        $profile['location'] = $location;
    }
    if (!empty($row['contact_email'])) {
        $profile['contactEmail'] = $row['contact_email'];
    }
    if ($includeStatus) {
        $profile['status'] = (string) ($row['status'] ?? CONNECTIONS_STATUS_APPROVED);
        if (!empty($row['reviewed_at'])) {
            $profile['reviewedAt'] = (int) $row['reviewed_at'];
        }
    }
    return $profile;
}

function connectionsAdminProfile(array $row): array
{
    $profile = connectionsPublicProfile($row, true);
    if (!empty($row['contact_email'])) {
        $profile['contactEmail'] = $row['contact_email'];
    }
    return $profile;
}

function connectionsStartAdminSession(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    session_set_cookie_params([
        'lifetime' => 60 * 60 * 8,
        'path' => '/',
        'httponly' => true,
        'samesite' => 'Strict',
        'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
    ]);
    session_name('totem_connections_admin');
    session_start();
}

function connectionsIsAdminAuthenticated(): bool
{
    connectionsStartAdminSession();
    return !empty($_SESSION['connections_admin']);
}

function connectionsRequireAdmin(): void
{
    if (!connectionsIsAdminAuthenticated()) {
        connectionsRespond(401, ['error' => 'Admin login required.']);
    }
}

function connectionsVerifyAdminPassword(string $password): bool
{
    $config = connectionsLoadConfig();
    $plain = (string) ($config['adminPassword'] ?? '');
    if ($plain !== '') {
        return hash_equals($plain, $password);
    }

    $hash = (string) ($config['adminPasswordHash'] ?? '');
    if ($hash === '') {
        return false;
    }
    return password_verify($password, $hash);
}

function connectionsAdminConfigured(): bool
{
    $config = connectionsLoadConfig();
    return !empty($config['adminPassword']) || !empty($config['adminPasswordHash']);
}

/**
 * Parse one or more notification addresses (comma- or semicolon-separated).
 *
 * @return list<string>
 */
function connectionsParseNotifyEmails(string $raw): array
{
    $parts = preg_split('/[,;]+/', $raw) ?: [];
    $emails = [];
    foreach ($parts as $part) {
        $email = trim($part);
        if ($email !== '' && filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $emails[$email] = $email;
        }
    }
    return array_values($emails);
}

function connectionsMailAdmin(string $toList, string $subject, string $body): void
{
    $emails = connectionsParseNotifyEmails($toList);
    if ($emails === []) {
        return;
    }

    $host = $_SERVER['HTTP_HOST'] ?? 'totemastrology.com';
    $headers = 'From: TotemAstrology <noreply@' . $host . ">\r\n";
    $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

    @mail(implode(', ', $emails), $subject, $body, $headers);
}

function connectionsNotifyAdminPending(array $profile): void
{
    $config = connectionsLoadConfig();
    if (empty($config['notifyOnSubmit'])) {
        return;
    }

    $email = trim((string) ($config['notifyEmail'] ?? ''));
    if ($email === '') {
        return;
    }

    $siteUrl = rtrim((string) ($config['siteUrl'] ?? 'https://totemastrology.com'), '/');
    $adminUrl = $siteUrl . '/connections-admin.php';

    $subject = 'TotemAstrology.com — New directory listing pending review';
    $body = "A new Totem Connections listing is waiting for approval.\n\n";
    $body .= 'Display name: ' . ($profile['displayName'] ?? '') . "\n";
    $elements = is_array($profile['elements'] ?? null) ? $profile['elements'] : [];
    $body .= 'Spirit: ' . connectionsFormatElementAnimal(
        (string) ($profile['spirit'] ?? ''),
        (string) ($elements['spirit'] ?? '')
    ) . "\n";
    $body .= 'Mind: ' . connectionsFormatElementAnimal(
        (string) ($profile['mental'] ?? ''),
        (string) ($elements['mental'] ?? '')
    ) . "\n";
    $body .= 'Heart: ' . connectionsFormatElementAnimal(
        (string) ($profile['emotional'] ?? ''),
        (string) ($elements['emotional'] ?? '')
    ) . "\n";
    $body .= 'Body: ' . connectionsFormatElementAnimal(
        (string) ($profile['physical'] ?? ''),
        (string) ($elements['physical'] ?? '')
    ) . "\n";
    if (!empty($profile['intro'])) {
        $body .= 'Intro: ' . $profile['intro'] . "\n";
    }
    if (!empty($profile['location']['label'])) {
        $body .= 'Area: ' . $profile['location']['label'] . "\n";
    }
    if (!empty($profile['contactEmail'])) {
        $body .= 'Email: ' . $profile['contactEmail'] . "\n";
    }
    $body .= "\nReview it here:\n" . $adminUrl . "\n";

    connectionsMailAdmin($email, $subject, $body);
}

function connectionsNotifyAdminBirthVerification(array $user, string $kind): void
{
    $config = connectionsLoadConfig();
    $email = trim((string) (
        $config['verificationNotifyEmail']
            ?? $config['notifyEmail']
            ?? CONNECTIONS_VERIFICATION_EMAIL
    ));
    if ($email === '') {
        return;
    }

    $siteUrl = rtrim((string) ($config['siteUrl'] ?? 'https://totemastrology.com'), '/');
    $adminUrl = $siteUrl . '/connections-admin.php';
    $isTime = $kind === 'time';
    $subject = $isTime
        ? 'TotemAstrology.com — Time Verified request'
        : 'TotemAstrology.com — Birth-date Verified request';
    $body = $isTime
        ? "A new golden Time Verified request is waiting for review.\n\n"
        : "A new birth-date Verified request is waiting for review.\n\n";
    $body .= 'Username: ' . ($user['username'] ?? '') . "\n";
    $body .= 'Display name: ' . ($user['display_name'] ?? '') . "\n";
    $body .= 'Claimed birth date: ' . ($user['birth_date'] ?? '') . "\n";
    if ($isTime) {
        $body .= 'Claimed birth time: ' . ($user['birth_time'] ?? '') . "\n";
    }
    $body .= "\nFor privacy, the ID image is not attached to this email.";
    $body .= "\nSign in to the secure admin review page:\n" . $adminUrl . "\n";

    connectionsMailAdmin($email, $subject, $body);
}

function connectionsFetchProfiles(PDO $pdo, ?string $status = null): array
{
    $select = 'SELECT p.id, p.display_name, p.spirit, p.mental, p.emotional, p.physical,
                    p.spirit_element, p.mental_element, p.emotional_element, p.physical_element,
                    p.intro, p.contact_email, p.status, p.created_at, p.reviewed_at,
                    p.location_city, p.location_region, p.location_country, p.location_lat, p.location_lon,
                    p.user_id,
                    u.username AS username,
                    u.birth_verification_status AS birth_verification_status,
                    u.birth_time_verification_status AS birth_time_verification_status
             FROM profiles p
             LEFT JOIN users u ON u.id = p.user_id';

    if ($status !== null) {
        $stmt = $pdo->prepare($select . ' WHERE p.status = :status ORDER BY p.created_at DESC');
        $stmt->execute([':status' => $status]);
        return $stmt->fetchAll();
    }

    $stmt = $pdo->query($select . ' ORDER BY p.created_at DESC');
    return $stmt->fetchAll();
}

/**
 * @return array{0: list<array>, 1: array{lat: float, lon: float, radiusKm: float}|null}
 */
function connectionsFilterProfilesByNearby(array $rows, ?float $lat, ?float $lon, ?float $radiusKm): array
{
    if ($lat === null || $lon === null) {
        return [$rows, null];
    }

    $radius = $radiusKm !== null && $radiusKm > 0 ? $radiusKm : 80.0;
    $filtered = [];
    foreach ($rows as $row) {
        if ($row['location_lat'] === null || $row['location_lon'] === null || $row['location_lat'] === '' || $row['location_lon'] === '') {
            continue;
        }
        $distance = connectionsHaversineKm(
            $lat,
            $lon,
            (float) $row['location_lat'],
            (float) $row['location_lon']
        );
        if ($distance <= $radius) {
            $row['_distanceKm'] = round($distance, 1);
            $filtered[] = $row;
        }
    }

    usort($filtered, static function (array $a, array $b): int {
        return ($a['_distanceKm'] ?? 0) <=> ($b['_distanceKm'] ?? 0);
    });

    return [$filtered, ['lat' => $lat, 'lon' => $lon, 'radiusKm' => $radius]];
}

function connectionsSetProfileStatus(PDO $pdo, string $id, string $status): bool
{
    $allowed = [
        CONNECTIONS_STATUS_PENDING,
        CONNECTIONS_STATUS_APPROVED,
        CONNECTIONS_STATUS_REJECTED,
    ];
    if (!in_array($status, $allowed, true)) {
        return false;
    }

    $now = time();
    $reviewedAt = $status === CONNECTIONS_STATUS_PENDING ? null : $now;

    $stmt = $pdo->prepare(
        'UPDATE profiles
         SET status = :status, updated_at = :updated_at, reviewed_at = :reviewed_at
         WHERE id = :id'
    );
    $stmt->execute([
        ':status' => $status,
        ':updated_at' => $now,
        ':reviewed_at' => $reviewedAt,
        ':id' => $id,
    ]);

    return $stmt->rowCount() > 0;
}

function connectionsDeleteProfile(PDO $pdo, string $id): bool
{
    $stmt = $pdo->prepare('DELETE FROM profiles WHERE id = :id');
    $stmt->execute([':id' => $id]);
    return $stmt->rowCount() > 0;
}

function connectionsSendCorsHeaders(): void
{
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Access-Control-Max-Age: 86400');
}

function connectionsHandleOptionsRequest(): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
        connectionsSendCorsHeaders();
        http_response_code(204);
        exit;
    }
}

function connectionsNormalizeUsername(string $username): string
{
    return strtolower(trim($username));
}

function connectionsValidateUsername(string $username): ?string
{
    $username = connectionsNormalizeUsername($username);
    $len = function_exists('mb_strlen') ? mb_strlen($username) : strlen($username);
    if ($len < CONNECTIONS_MIN_USERNAME || $len > CONNECTIONS_MAX_USERNAME) {
        return null;
    }
    if (!preg_match('/^[a-z0-9_]+$/', $username)) {
        return null;
    }
    return $username;
}

function connectionsNormalizeEmail(string $email): string
{
    return strtolower(trim($email));
}

function connectionsValidateEmail(string $email): ?string
{
    $email = connectionsNormalizeEmail($email);
    if ($email === '' || strlen($email) > 254) {
        return null;
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        return null;
    }
    return $email;
}

function connectionsNormalizePhone(string $phone): string
{
    $digits = preg_replace('/\D+/', '', trim($phone));
    return $digits === null ? '' : $digits;
}

function connectionsValidatePhone(string $phone): ?string
{
    $digits = connectionsNormalizePhone($phone);
    $len = strlen($digits);
    if ($len < 8 || $len > 15) {
        return null;
    }
    return $digits;
}

function connectionsValidateBirthDate(string $value): ?string
{
    $value = trim($value);
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $value)) {
        return null;
    }
    [$y, $m, $d] = array_map('intval', explode('-', $value));
    if (!checkdate($m, $d, $y)) {
        return null;
    }
    $year = (int) date('Y');
    if ($y < 1900 || $y > $year) {
        return null;
    }
    return sprintf('%04d-%02d-%02d', $y, $m, $d);
}

function connectionsValidateBirthTime(string $value): ?string
{
    $value = trim($value);
    if ($value === '') {
        return '';
    }
    if (!preg_match('/^([01]?\d|2[0-3]):([0-5]\d)$/', $value, $matches)) {
        return null;
    }
    return sprintf('%02d:%02d', (int) $matches[1], (int) $matches[2]);
}

function connectionsUserSelectColumns(): string
{
    return 'id, username, password_hash, display_name, email, phone,
            email_verified, phone_verified, birth_date, birth_time, birth_place, birth_name,
            birth_verification_status, birth_verification_note,
            birth_id_path, birth_id_original_name, birth_verified_at, birth_reviewed_at,
            birth_time_verification_status, birth_time_verification_note,
            birth_time_id_path, birth_time_id_original_name,
            birth_time_verified_at, birth_time_reviewed_at,
            created_at, updated_at';
}

function connectionsNormalizeBirthStatus(?string $status): string
{
    $status = (string) ($status ?? CONNECTIONS_BIRTH_NONE);
    $allowed = [
        CONNECTIONS_BIRTH_NONE => true,
        CONNECTIONS_BIRTH_PENDING => true,
        CONNECTIONS_BIRTH_VERIFIED => true,
        CONNECTIONS_BIRTH_REJECTED => true,
    ];
    return isset($allowed[$status]) ? $status : CONNECTIONS_BIRTH_NONE;
}

function connectionsPublicUser(array $row, ?array $listing = null): array
{
    $dateStatus = connectionsNormalizeBirthStatus($row['birth_verification_status'] ?? null);
    $timeStatus = connectionsNormalizeBirthStatus($row['birth_time_verification_status'] ?? null);
    $username = (string) ($row['username'] ?? '');
    $user = [
        'id' => $row['id'],
        'username' => $username,
        'displayName' => $username !== '' ? $username : (string) ($row['display_name'] ?? ''),
        'email' => (string) ($row['email'] ?? ''),
        'phone' => (string) ($row['phone'] ?? ''),
        'emailVerified' => !empty($row['email_verified']),
        'phoneVerified' => !empty($row['phone_verified']),
        'birthDate' => (string) ($row['birth_date'] ?? ''),
        'birthTime' => (string) ($row['birth_time'] ?? ''),
        'birthPlace' => (string) ($row['birth_place'] ?? ''),
        'birthName' => (string) ($row['birth_name'] ?? ''),
        'birthVerificationStatus' => $dateStatus,
        'birthVerificationNote' => (string) ($row['birth_verification_note'] ?? ''),
        'birthIdUploaded' => trim((string) ($row['birth_id_path'] ?? '')) !== '',
        'birthVerifiedAt' => isset($row['birth_verified_at']) && $row['birth_verified_at'] !== null
            ? (int) $row['birth_verified_at']
            : null,
        'birthTimeVerificationStatus' => $timeStatus,
        'birthTimeVerificationNote' => (string) ($row['birth_time_verification_note'] ?? ''),
        'birthTimeIdUploaded' => trim((string) ($row['birth_time_id_path'] ?? '')) !== '',
        'birthTimeVerifiedAt' => isset($row['birth_time_verified_at']) && $row['birth_time_verified_at'] !== null
            ? (int) $row['birth_time_verified_at']
            : null,
        'createdAt' => (int) $row['created_at'],
    ];
    if ($listing !== null) {
        $listing['birthVerified'] = $dateStatus === CONNECTIONS_BIRTH_VERIFIED;
        $listing['birthTimeVerified'] = $timeStatus === CONNECTIONS_BIRTH_VERIFIED;
        $user['listing'] = $listing;
        $user['directoryListed'] = true;
    } else {
        $user['directoryListed'] = false;
        $user['listing'] = null;
    }
    return $user;
}

function connectionsFetchUserById(PDO $pdo, string $id): ?array
{
    $stmt = $pdo->prepare('SELECT ' . connectionsUserSelectColumns() . ' FROM users WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch();
    return $row ?: null;
}

function connectionsFetchUserByUsername(PDO $pdo, string $username): ?array
{
    $stmt = $pdo->prepare(
        'SELECT ' . connectionsUserSelectColumns() . ' FROM users WHERE username = :username LIMIT 1'
    );
    $stmt->execute([':username' => connectionsNormalizeUsername($username)]);
    $row = $stmt->fetch();
    return $row ?: null;
}

function connectionsFetchUserByEmail(PDO $pdo, string $email): ?array
{
    $stmt = $pdo->prepare(
        'SELECT ' . connectionsUserSelectColumns() . ' FROM users WHERE email = :email LIMIT 1'
    );
    $stmt->execute([':email' => connectionsNormalizeEmail($email)]);
    $row = $stmt->fetch();
    return $row ?: null;
}

function connectionsFetchUserByPhone(PDO $pdo, string $phone): ?array
{
    $stmt = $pdo->prepare(
        'SELECT ' . connectionsUserSelectColumns() . ' FROM users WHERE phone = :phone LIMIT 1'
    );
    $stmt->execute([':phone' => connectionsNormalizePhone($phone)]);
    $row = $stmt->fetch();
    return $row ?: null;
}

function connectionsFetchUserByIdentifier(PDO $pdo, string $identifier): ?array
{
    $identifier = trim($identifier);
    if ($identifier === '') {
        return null;
    }
    if (strpos($identifier, '@') !== false) {
        $email = connectionsValidateEmail($identifier);
        return $email ? connectionsFetchUserByEmail($pdo, $email) : null;
    }
    $digits = connectionsNormalizePhone($identifier);
    if ($digits !== '' && preg_match('/^\d{8,15}$/', $digits)) {
        $byPhone = connectionsFetchUserByPhone($pdo, $digits);
        if ($byPhone) {
            return $byPhone;
        }
    }
    return connectionsFetchUserByUsername($pdo, $identifier);
}

function connectionsGenerateUsername(PDO $pdo, string $email, string $phone): string
{
    $base = '';
    if ($email !== '') {
        $local = explode('@', $email)[0];
        $base = preg_replace('/[^a-z0-9_]+/', '', strtolower($local)) ?? '';
    }
    if ($base === '' && $phone !== '') {
        $base = 'u' . substr($phone, -8);
    }
    if ($base === '') {
        $base = 'member';
    }
    if (strlen($base) < CONNECTIONS_MIN_USERNAME) {
        $base = str_pad($base, CONNECTIONS_MIN_USERNAME, '0');
    }
    if (strlen($base) > CONNECTIONS_MAX_USERNAME - 4) {
        $base = substr($base, 0, CONNECTIONS_MAX_USERNAME - 4);
    }
    $candidate = $base;
    $n = 0;
    while (connectionsFetchUserByUsername($pdo, $candidate)) {
        $n += 1;
        $suffix = (string) $n;
        $candidate = substr($base, 0, CONNECTIONS_MAX_USERNAME - strlen($suffix)) . $suffix;
        if ($n > 9999) {
            $candidate = 'u' . substr(bin2hex(random_bytes(6)), 0, 10);
            break;
        }
    }
    return $candidate;
}

function connectionsFetchListingForUser(PDO $pdo, string $userId): ?array
{
    $stmt = $pdo->prepare(
        'SELECT p.id, p.display_name, p.spirit, p.mental, p.emotional, p.physical,
                p.spirit_element, p.mental_element, p.emotional_element, p.physical_element,
                p.intro, p.contact_email, p.status, p.created_at, p.reviewed_at,
                p.location_city, p.location_region, p.location_country, p.location_lat, p.location_lon,
                p.user_id, u.username AS username
         FROM profiles p
         LEFT JOIN users u ON u.id = p.user_id
         WHERE p.user_id = :user_id LIMIT 1'
    );
    $stmt->execute([':user_id' => $userId]);
    $row = $stmt->fetch();
    return $row ?: null;
}

function connectionsCreateSession(PDO $pdo, string $userId, ?int $days = null): string
{
    $token = bin2hex(random_bytes(32));
    $hash = hash('sha256', $token);
    $now = time();
    $span = $days ?? CONNECTIONS_USER_TOKEN_DAYS;
    if ($span < 1) {
        $span = 1;
    }
    $expires = $now + ($span * 24 * 60 * 60);
    $stmt = $pdo->prepare(
        'INSERT INTO user_sessions (token_hash, user_id, created_at, expires_at)
         VALUES (:token_hash, :user_id, :created_at, :expires_at)'
    );
    $stmt->execute([
        ':token_hash' => $hash,
        ':user_id' => $userId,
        ':created_at' => $now,
        ':expires_at' => $expires,
    ]);
    return $token;
}

function connectionsStaySignedIn(array $body): bool
{
    if (!array_key_exists('staySignedIn', $body)) {
        return true;
    }
    $value = $body['staySignedIn'];
    if (is_bool($value)) {
        return $value;
    }
    $text = strtolower(trim((string) $value));
    return !in_array($text, ['0', 'false', 'no', 'off'], true);
}

function connectionsMailUser(string $email, string $subject, string $body): void
{
    if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        return;
    }
    $headers = "From: Totem Astrology <noreply@totemastrology.com>\r\n";
    $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
    @mail($email, $subject, $body, $headers);
}

function connectionsIssuePasswordReset(PDO $pdo, array $user): void
{
    $email = trim((string) ($user['email'] ?? ''));
    if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        return;
    }

    $token = bin2hex(random_bytes(32));
    $hash = hash('sha256', $token);
    $now = time();
    $pdo->prepare('DELETE FROM password_resets WHERE user_id = :user_id')->execute([
        ':user_id' => $user['id'],
    ]);
    $pdo->prepare(
        'INSERT INTO password_resets (token_hash, user_id, created_at, expires_at)
         VALUES (:token_hash, :user_id, :created_at, :expires_at)'
    )->execute([
        ':token_hash' => $hash,
        ':user_id' => $user['id'],
        ':created_at' => $now,
        ':expires_at' => $now + 86400,
    ]);

    $link = 'https://totemastrology.com/account.html#reset=' . $token;
    $body = "Reset your Totem Astrology password by opening this link:\n\n";
    $body .= $link . "\n\n";
    $body .= "The link expires in 24 hours. If you did not ask for this, you can ignore this email.\n";
    connectionsMailUser($email, 'Reset your Totem Astrology password', $body);
}

function connectionsDeleteSessionByToken(PDO $pdo, string $token): void
{
    $hash = hash('sha256', $token);
    $stmt = $pdo->prepare('DELETE FROM user_sessions WHERE token_hash = :token_hash');
    $stmt->execute([':token_hash' => $hash]);
}

function connectionsPurgeExpiredSessions(PDO $pdo): void
{
    $stmt = $pdo->prepare('DELETE FROM user_sessions WHERE expires_at < :now');
    $stmt->execute([':now' => time()]);
}

function connectionsReadBearerToken(): ?string
{
    $header = '';
    if (!empty($_SERVER['HTTP_AUTHORIZATION'])) {
        $header = (string) $_SERVER['HTTP_AUTHORIZATION'];
    } elseif (!empty($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
        $header = (string) $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
    } elseif (function_exists('apache_request_headers')) {
        $headers = apache_request_headers();
        foreach ($headers as $key => $value) {
            if (strtolower((string) $key) === 'authorization') {
                $header = (string) $value;
                break;
            }
        }
    }

    if (preg_match('/^\s*Bearer\s+(\S+)\s*$/i', $header, $matches)) {
        return $matches[1];
    }
    return null;
}

function connectionsUserFromToken(PDO $pdo, string $token): ?array
{
    if ($token === '') {
        return null;
    }
    connectionsPurgeExpiredSessions($pdo);
    $hash = hash('sha256', $token);
    $stmt = $pdo->prepare(
        'SELECT ' . connectionsUserSelectColumns() . '
         FROM users
         WHERE id = (
            SELECT user_id FROM user_sessions
            WHERE token_hash = :token_hash AND expires_at >= :now
            LIMIT 1
         )
         LIMIT 1'
    );
    $stmt->execute([
        ':token_hash' => $hash,
        ':now' => time(),
    ]);
    $row = $stmt->fetch();
    return $row ?: null;
}

function connectionsRequireUser(PDO $pdo): array
{
    $token = connectionsReadBearerToken();
    if ($token === null) {
        connectionsRespond(401, ['error' => 'Please sign in to continue.']);
    }
    $user = connectionsUserFromToken($pdo, $token);
    if ($user === null) {
        connectionsRespond(401, ['error' => 'Your session expired. Please sign in again.']);
    }
    return $user;
}

function connectionsUserPayload(PDO $pdo, array $user): array
{
    $listingRow = connectionsFetchListingForUser($pdo, $user['id']);
    $listing = $listingRow ? connectionsPublicProfile($listingRow, true) : null;
    return connectionsPublicUser($user, $listing);
}

function connectionsStoreBirthIdUpload(string $userId, string $field = 'idDocument', string $label = 'government ID'): array
{
    connectionsEnsureUploadsDir();
    if (!isset($_FILES[$field]) || !is_array($_FILES[$field])) {
        connectionsRespond(400, [
            'error' => 'Upload a clear photo of your ' . $label . ' (JPG, PNG, WEBP, or PDF).',
        ]);
    }
    $file = $_FILES[$field];
    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
        connectionsRespond(400, ['error' => 'Upload failed. Try a smaller file (under 8 MB).']);
    }
    $size = (int) ($file['size'] ?? 0);
    if ($size <= 0 || $size > CONNECTIONS_MAX_BIRTH_ID_BYTES) {
        connectionsRespond(400, ['error' => 'File must be under 8 MB.']);
    }
    $original = (string) ($file['name'] ?? 'document');
    $ext = strtolower(pathinfo($original, PATHINFO_EXTENSION));
    $allowed = ['jpg' => true, 'jpeg' => true, 'png' => true, 'pdf' => true, 'webp' => true];
    if (!isset($allowed[$ext])) {
        connectionsRespond(400, ['error' => 'Use JPG, PNG, WEBP, or PDF.']);
    }
    $tmp = (string) ($file['tmp_name'] ?? '');
    if ($tmp === '' || !is_uploaded_file($tmp)) {
        connectionsRespond(400, ['error' => 'Invalid upload.']);
    }
    if (function_exists('finfo_open')) {
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mime = $finfo ? (string) finfo_file($finfo, $tmp) : '';
        if ($finfo) {
            finfo_close($finfo);
        }
        $okMimes = [
            'image/jpeg' => true,
            'image/png' => true,
            'image/webp' => true,
            'application/pdf' => true,
        ];
        if ($mime !== '' && !isset($okMimes[$mime])) {
            connectionsRespond(400, ['error' => 'File type not allowed.']);
        }
    }
    $safeExt = $ext === 'jpeg' ? 'jpg' : $ext;
    $safeName = $userId . '_' . bin2hex(random_bytes(8)) . '.' . $safeExt;
    $dest = connectionsUploadsDir() . '/' . $safeName;
    if (!move_uploaded_file($tmp, $dest)) {
        connectionsRespond(500, ['error' => 'Could not store upload.']);
    }
    @chmod($dest, 0640);
    return [
        'path' => $safeName,
        'originalName' => connectionsSanitizeText($original, 120),
    ];
}

function connectionsBirthIdAbsolutePath(string $relative): string
{
    return connectionsUploadsDir() . '/' . basename($relative);
}

function connectionsDeleteStoredBirthFile(?string $relative): void
{
    $relative = trim((string) $relative);
    if ($relative === '') {
        return;
    }
    $abs = connectionsBirthIdAbsolutePath($relative);
    if (is_file($abs)) {
        @unlink($abs);
    }
}

function connectionsFetchPendingBirthVerifications(PDO $pdo): array
{
    $stmt = $pdo->query(
        'SELECT ' . connectionsUserSelectColumns() . '
         FROM users
         WHERE birth_verification_status = \'pending\'
            OR birth_time_verification_status = \'pending\'
         ORDER BY updated_at ASC'
    );
    $out = [];
    foreach ($stmt->fetchAll() as $row) {
        $out[] = [
            'id' => $row['id'],
            'username' => $row['username'],
            'displayName' => (string) ($row['display_name'] ?? ''),
            'email' => (string) ($row['email'] ?? ''),
            'phone' => (string) ($row['phone'] ?? ''),
            'birthDate' => (string) ($row['birth_date'] ?? ''),
            'birthTime' => (string) ($row['birth_time'] ?? ''),
            'birthVerificationStatus' => connectionsNormalizeBirthStatus($row['birth_verification_status'] ?? null),
            'birthTimeVerificationStatus' => connectionsNormalizeBirthStatus($row['birth_time_verification_status'] ?? null),
            'birthIdOriginalName' => (string) ($row['birth_id_original_name'] ?? ''),
            'birthIdPath' => (string) ($row['birth_id_path'] ?? ''),
            'birthTimeIdOriginalName' => (string) ($row['birth_time_id_original_name'] ?? ''),
            'birthTimeIdPath' => (string) ($row['birth_time_id_path'] ?? ''),
            'updatedAt' => (int) $row['updated_at'],
            'createdAt' => (int) $row['created_at'],
        ];
    }
    return $out;
}

