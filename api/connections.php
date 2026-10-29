<?php
/**
 * Totem Connections directory API (SQLite).
 * Public listings require admin approval before they appear in GET results.
 * API v10 requires a signed-in account (Bearer token) to join, update, or remove a listing.
 */
declare(strict_types=1);

require __DIR__ . '/connections-lib.php';

connectionsSendCorsHeaders();
connectionsHandleOptionsRequest();

header('Content-Type: application/json; charset=UTF-8');
header('X-Content-Type-Options: nosniff');

try {
    connectionsEnsureStorage();
    $pdo = connectionsOpenDatabase();
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    if ($method === 'GET') {
        $rows = connectionsFetchProfiles($pdo, CONNECTIONS_STATUS_APPROVED);

        $lat = isset($_GET['lat']) && $_GET['lat'] !== '' ? (float) $_GET['lat'] : null;
        $lon = isset($_GET['lon']) && $_GET['lon'] !== '' ? (float) $_GET['lon'] : null;
        $radiusKm = isset($_GET['radiusKm']) && $_GET['radiusKm'] !== '' ? (float) $_GET['radiusKm'] : null;

        if (($lat !== null && ($lat < -90 || $lat > 90)) || ($lon !== null && ($lon < -180 || $lon > 180))) {
            connectionsRespond(400, ['error' => 'Invalid latitude/longitude for nearby search.']);
        }
        if (($lat === null) xor ($lon === null)) {
            connectionsRespond(400, ['error' => 'Provide both lat and lon for nearby search.']);
        }

        [$rows, $nearby] = connectionsFilterProfilesByNearby($rows, $lat, $lon, $radiusKm);

        $profiles = [];
        foreach ($rows as $row) {
            $profile = connectionsPublicProfile($row);
            if (isset($row['_distanceKm'])) {
                $profile['distanceKm'] = $row['_distanceKm'];
            }
            $profiles[] = $profile;
        }

        $payload = [
            'profiles' => $profiles,
            'apiVersion' => CONNECTIONS_API_VERSION,
            'moderation' => true,
            'authRequired' => true,
        ];
        if ($nearby !== null) {
            $payload['nearby'] = $nearby;
        }
        connectionsRespond(200, $payload);
    }

    if ($method !== 'POST') {
        connectionsRespond(405, ['error' => 'Method not allowed']);
    }

    $body = connectionsReadJsonBody();
    $action = (string) ($body['action'] ?? 'create');
    $user = connectionsRequireUser($pdo);

    if ($action === 'remove-self') {
        $listing = connectionsFetchListingForUser($pdo, $user['id']);
        if ($listing === null) {
            connectionsRespond(404, [
                'error' => 'No directory listing is linked to your account.',
            ]);
        }

        connectionsDeleteProfile($pdo, $listing['id']);
        connectionsRespond(200, [
            'ok' => true,
            'removed' => true,
            'user' => connectionsUserPayload($pdo, $user),
        ]);
    }

    if ($action === 'update-self') {
        $listing = connectionsFetchListingForUser($pdo, $user['id']);
        if ($listing === null) {
            connectionsRespond(404, [
                'error' => 'No directory listing is linked to your account.',
            ]);
        }

        $displayName = trim((string) ($user['username'] ?? ''));
        if ($displayName === '') {
            connectionsRespond(400, ['error' => 'Account username is required for directory listings.']);
        }

        $intro = array_key_exists('intro', $body)
            ? connectionsSanitizeText((string) $body['intro'], CONNECTIONS_MAX_INTRO)
            : (string) ($listing['intro'] ?? '');

        $contactEmail = array_key_exists('contactEmail', $body)
            ? trim((string) $body['contactEmail'])
            : (string) ($listing['contact_email'] ?? '');
        if ($contactEmail !== '' && !filter_var($contactEmail, FILTER_VALIDATE_EMAIL)) {
            connectionsRespond(400, ['error' => 'Please enter a valid email address or leave it blank.']);
        }

        $animalsChanged = false;
        $profileAnimals = [
            'spirit' => (string) ($listing['spirit'] ?? ''),
            'mental' => (string) ($listing['mental'] ?? ''),
            'emotional' => (string) ($listing['emotional'] ?? ''),
            'physical' => (string) ($listing['physical'] ?? ''),
            'spiritElement' => (string) ($listing['spirit_element'] ?? ''),
            'mentalElement' => (string) ($listing['mental_element'] ?? ''),
            'emotionalElement' => (string) ($listing['emotional_element'] ?? ''),
            'physicalElement' => (string) ($listing['physical_element'] ?? ''),
        ];

        $hasAnimalPayload = isset($body['spirit'], $body['mental'], $body['emotional'], $body['physical']);
        if ($hasAnimalPayload) {
            $validated = connectionsValidateProfileAnimals($body);
            if ($validated === null) {
                connectionsRespond(400, ['error' => 'Invalid totem animal profile.']);
            }
            foreach (CONNECTIONS_PROFILE_PILLARS as $pillar) {
                if (
                    $validated[$pillar] !== $profileAnimals[$pillar]
                    || $validated[$pillar . 'Element'] !== $profileAnimals[$pillar . 'Element']
                ) {
                    $animalsChanged = true;
                }
            }
            $profileAnimals = $validated;
        }

        $locationCity = $listing['location_city'] ?? null;
        $locationRegion = $listing['location_region'] ?? null;
        $locationCountry = $listing['location_country'] ?? null;
        $locationLat = $listing['location_lat'] ?? null;
        $locationLon = $listing['location_lon'] ?? null;
        if (array_key_exists('location', $body)) {
            $location = connectionsValidateLocation($body);
            if ($location === null) {
                connectionsRespond(400, [
                    'error' => 'Location needs a city and valid coordinates (pick a city from search suggestions).',
                ]);
            }
            $locationCity = $location['city'] !== '' ? $location['city'] : null;
            $locationRegion = $location['region'] !== '' ? $location['region'] : null;
            $locationCountry = $location['country'] !== '' ? $location['country'] : null;
            $locationLat = $location['lat'];
            $locationLon = $location['lon'];
        }

        $currentStatus = (string) ($listing['status'] ?? CONNECTIONS_STATUS_PENDING);
        $nextStatus = $currentStatus;
        $shouldNotify = false;
        if ($animalsChanged || $currentStatus === CONNECTIONS_STATUS_REJECTED) {
            $nextStatus = CONNECTIONS_STATUS_PENDING;
            $shouldNotify = true;
        }

        $now = time();
        $pdo->prepare(
            'UPDATE profiles SET
                display_name = :display_name,
                spirit = :spirit,
                mental = :mental,
                emotional = :emotional,
                physical = :physical,
                spirit_element = :spirit_element,
                mental_element = :mental_element,
                emotional_element = :emotional_element,
                physical_element = :physical_element,
                intro = :intro,
                contact_email = :contact_email,
                location_city = :location_city,
                location_region = :location_region,
                location_country = :location_country,
                location_lat = :location_lat,
                location_lon = :location_lon,
                status = :status,
                updated_at = :updated_at,
                reviewed_at = CASE WHEN :clear_review = 1 THEN NULL ELSE reviewed_at END
             WHERE id = :id AND user_id = :user_id'
        )->execute([
            ':display_name' => $displayName,
            ':spirit' => $profileAnimals['spirit'],
            ':mental' => $profileAnimals['mental'],
            ':emotional' => $profileAnimals['emotional'],
            ':physical' => $profileAnimals['physical'],
            ':spirit_element' => $profileAnimals['spiritElement'],
            ':mental_element' => $profileAnimals['mentalElement'],
            ':emotional_element' => $profileAnimals['emotionalElement'],
            ':physical_element' => $profileAnimals['physicalElement'],
            ':intro' => $intro !== '' ? $intro : null,
            ':contact_email' => $contactEmail !== '' ? $contactEmail : null,
            ':location_city' => $locationCity,
            ':location_region' => $locationRegion,
            ':location_country' => $locationCountry,
            ':location_lat' => $locationLat,
            ':location_lon' => $locationLon,
            ':status' => $nextStatus,
            ':updated_at' => $now,
            ':clear_review' => ($nextStatus === CONNECTIONS_STATUS_PENDING && $currentStatus !== CONNECTIONS_STATUS_PENDING) ? 1 : 0,
            ':id' => $listing['id'],
            ':user_id' => $user['id'],
        ]);

        $pdo->prepare(
            'UPDATE users SET display_name = :display_name, updated_at = :updated_at WHERE id = :id'
        )->execute([
            ':display_name' => $displayName,
            ':updated_at' => $now,
            ':id' => $user['id'],
        ]);

        $freshListing = connectionsFetchListingForUser($pdo, $user['id']);
        $publicProfile = connectionsPublicProfile($freshListing ?? $listing, true);
        if ($contactEmail !== '') {
            $publicProfile['contactEmail'] = $contactEmail;
        }

        if ($shouldNotify) {
            connectionsNotifyAdminPending($publicProfile);
        }

        $freshUser = connectionsFetchUserById($pdo, $user['id']);
        connectionsRespond(200, [
            'ok' => true,
            'updated' => true,
            'status' => $nextStatus,
            'message' => $nextStatus === CONNECTIONS_STATUS_PENDING && $currentStatus !== CONNECTIONS_STATUS_PENDING
                ? 'Your listing was updated and sent back for review.'
                : 'Your directory listing was updated.',
            'profile' => $publicProfile,
            'user' => connectionsUserPayload($pdo, $freshUser),
        ]);
    }

    if ($action !== 'create') {
        connectionsRespond(400, ['error' => 'Unknown action.']);
    }

    if (empty($body['consent'])) {
        connectionsRespond(400, [
            'error' => 'Please confirm that you agree to be listed in the public directory.',
        ]);
    }

    $existing = connectionsFetchListingForUser($pdo, $user['id']);
    if ($existing !== null) {
        connectionsRespond(409, [
            'error' => 'Your account already has a directory listing. Remove it first if you want to submit a new one.',
            'listing' => connectionsPublicProfile($existing, true),
        ]);
    }

    $displayName = trim((string) ($user['username'] ?? ''));
    if ($displayName === '') {
        connectionsRespond(400, ['error' => 'Account username is required for directory listings.']);
    }

    $profile = connectionsValidateProfileAnimals($body);
    if ($profile === null) {
        connectionsRespond(400, ['error' => 'Invalid totem animal profile.']);
    }

    $location = connectionsValidateLocation($body);
    if ($location === null) {
        connectionsRespond(400, [
            'error' => 'Location needs a city and valid coordinates (pick a city from search suggestions).',
        ]);
    }

    $intro = connectionsSanitizeText((string) ($body['intro'] ?? ''), CONNECTIONS_MAX_INTRO);
    $contactEmail = trim((string) ($body['contactEmail'] ?? ''));
    if ($contactEmail !== '' && !filter_var($contactEmail, FILTER_VALIDATE_EMAIL)) {
        connectionsRespond(400, ['error' => 'Please enter a valid email address or leave it blank.']);
    }

    $id = bin2hex(random_bytes(16));
    $now = time();

    $insert = $pdo->prepare(
        'INSERT INTO profiles (
            id, user_id, display_name, spirit, mental, emotional, physical,
            spirit_element, mental_element, emotional_element, physical_element,
            intro, contact_email,
            location_city, location_region, location_country, location_lat, location_lon,
            manage_token_hash, status, created_at, updated_at, reviewed_at
        ) VALUES (
            :id, :user_id, :display_name, :spirit, :mental, :emotional, :physical,
            :spirit_element, :mental_element, :emotional_element, :physical_element,
            :intro, :contact_email,
            :location_city, :location_region, :location_country, :location_lat, :location_lon,
            :manage_token_hash, :status, :created_at, :updated_at, NULL
        )'
    );
    $insert->execute([
        ':id' => $id,
        ':user_id' => $user['id'],
        ':display_name' => $displayName,
        ':spirit' => $profile['spirit'],
        ':mental' => $profile['mental'],
        ':emotional' => $profile['emotional'],
        ':physical' => $profile['physical'],
        ':spirit_element' => $profile['spiritElement'],
        ':mental_element' => $profile['mentalElement'],
        ':emotional_element' => $profile['emotionalElement'],
        ':physical_element' => $profile['physicalElement'],
        ':intro' => $intro !== '' ? $intro : null,
        ':contact_email' => $contactEmail !== '' ? $contactEmail : null,
        ':location_city' => $location['city'] !== '' ? $location['city'] : null,
        ':location_region' => $location['region'] !== '' ? $location['region'] : null,
        ':location_country' => $location['country'] !== '' ? $location['country'] : null,
        ':location_lat' => $location['lat'],
        ':location_lon' => $location['lon'],
        ':manage_token_hash' => '',
        ':status' => CONNECTIONS_STATUS_PENDING,
        ':created_at' => $now,
        ':updated_at' => $now,
    ]);

    // Keep account display name aligned with the public listing name.
    $pdo->prepare(
        'UPDATE users SET display_name = :display_name, updated_at = :updated_at WHERE id = :id'
    )->execute([
        ':display_name' => $displayName,
        ':updated_at' => $now,
        ':id' => $user['id'],
    ]);

    $publicProfile = [
        'id' => $id,
        'displayName' => $displayName,
        'spirit' => $profile['spirit'],
        'mental' => $profile['mental'],
        'emotional' => $profile['emotional'],
        'physical' => $profile['physical'],
        'elements' => [
            'spirit' => $profile['spiritElement'],
            'mental' => $profile['mentalElement'],
            'emotional' => $profile['emotionalElement'],
            'physical' => $profile['physicalElement'],
        ],
        'intro' => $intro,
        'hasEmail' => $contactEmail !== '',
        'createdAt' => $now,
        'status' => CONNECTIONS_STATUS_PENDING,
    ];
    if ($contactEmail !== '') {
        $publicProfile['contactEmail'] = $contactEmail;
    }
    if ($location['city'] !== '' || $location['country'] !== '') {
        $publicProfile['location'] = [
            'city' => $location['city'],
            'region' => $location['region'],
            'country' => $location['country'],
            'label' => implode(', ', array_values(array_filter([
                $location['city'],
                $location['region'] !== $location['city'] ? $location['region'] : '',
                $location['country'],
            ]))),
            'lat' => $location['lat'],
            'lon' => $location['lon'],
        ];
    }

    connectionsNotifyAdminPending($publicProfile);

    $freshUser = connectionsFetchUserById($pdo, $user['id']);
    connectionsRespond(201, [
        'ok' => true,
        'id' => $id,
        'status' => CONNECTIONS_STATUS_PENDING,
        'message' => 'Your listing was submitted and is pending review. It will appear publicly once approved.',
        'profile' => $publicProfile,
        'user' => connectionsUserPayload($pdo, $freshUser),
    ]);
} catch (Throwable $error) {
    connectionsRespond(500, ['error' => 'Connections directory is temporarily unavailable.']);
}
