<?php
/**
 * Totem Connections user accounts API.
 * Free accounts via email or phone + password (Astro.com-style).
 * Optional birth-data verification tier via ID upload + admin review.
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
        $user = connectionsRequireUser($pdo);
        connectionsRespond(200, [
            'ok' => true,
            'user' => connectionsUserPayload($pdo, $user),
            'apiVersion' => CONNECTIONS_API_VERSION,
        ]);
    }

    if ($method !== 'POST') {
        connectionsRespond(405, ['error' => 'Method not allowed']);
    }

    $contentType = (string) ($_SERVER['CONTENT_TYPE'] ?? $_SERVER['HTTP_CONTENT_TYPE'] ?? '');
    $isMultipart = stripos($contentType, 'multipart/form-data') !== false;

    if ($isMultipart) {
        $action = (string) ($_POST['action'] ?? '');
        $body = $_POST;
    } else {
        $body = connectionsReadJsonBody();
        $action = (string) ($body['action'] ?? '');
    }

    if ($action === 'register') {
        $emailRaw = (string) ($body['email'] ?? '');
        $phoneRaw = (string) ($body['phone'] ?? '');
        $email = $emailRaw !== '' ? connectionsValidateEmail($emailRaw) : null;
        $phone = $phoneRaw !== '' ? connectionsValidatePhone($phoneRaw) : null;

        if ($email === null && $phone === null) {
            connectionsRespond(400, [
                'error' => 'Enter a valid email address or phone number to create a free account.',
            ]);
        }
        if ($emailRaw !== '' && $email === null) {
            connectionsRespond(400, ['error' => 'That email address does not look valid.']);
        }
        if ($phoneRaw !== '' && $phone === null) {
            connectionsRespond(400, ['error' => 'Enter a valid phone number (with country code selected).']);
        }

        $password = (string) ($body['password'] ?? '');
        if (strlen($password) < CONNECTIONS_MIN_PASSWORD) {
            connectionsRespond(400, [
                'error' => 'Password must be at least ' . CONNECTIONS_MIN_PASSWORD . ' characters.',
            ]);
        }

        if ($email !== null && connectionsFetchUserByEmail($pdo, $email) !== null) {
            connectionsRespond(409, ['error' => 'An account with that email already exists. Sign in instead.']);
        }
        if ($phone !== null && connectionsFetchUserByPhone($pdo, $phone) !== null) {
            connectionsRespond(409, ['error' => 'An account with that phone number already exists. Sign in instead.']);
        }

        $usernameInput = trim((string) ($body['username'] ?? ''));
        $username = connectionsValidateUsername($usernameInput);
        if ($username === null) {
            connectionsRespond(400, [
                'error' => 'Usernames can use capital letters, lowercase letters, numbers, and underscores (3–32 characters). Spaces and other symbols are not part of a username. Your password is separate and can use capitals and numbers freely.',
            ]);
        }
        if (connectionsFetchUserByUsername($pdo, $username) !== null) {
            connectionsRespond(409, ['error' => 'That username is already taken.']);
        }

        // Username is the public display name everywhere.
        $displayName = $username;
        $birthName = connectionsSanitizeText((string) ($body['birthName'] ?? ''), CONNECTIONS_MAX_DISPLAY_NAME);

        $birthDateRaw = trim((string) ($body['birthDate'] ?? ''));
        $birthTimeRaw = trim((string) ($body['birthTime'] ?? ''));
        $birthPlace = connectionsSanitizeText((string) ($body['birthPlace'] ?? ''), 200);

        $birthDate = null;
        if ($birthDateRaw !== '') {
            $birthDate = connectionsValidateBirthDate($birthDateRaw);
            if ($birthDate === null) {
                connectionsRespond(400, ['error' => 'Enter birth date as YYYY-MM-DD, or leave it blank.']);
            }
        }

        $birthTime = null;
        if ($birthTimeRaw !== '') {
            $birthTime = connectionsValidateBirthTime($birthTimeRaw);
            if ($birthTime === null || $birthTime === '') {
                connectionsRespond(400, ['error' => 'Enter birth time as HH:MM (24-hour), or leave it blank.']);
            }
        }

        $id = bin2hex(random_bytes(16));
        $now = time();
        $insert = $pdo->prepare(
            'INSERT INTO users (
                id, username, password_hash, display_name, email, phone,
                email_verified, phone_verified, birth_date, birth_time, birth_place, birth_name,
                birth_verification_status, created_at, updated_at
             ) VALUES (
                :id, :username, :password_hash, :display_name, :email, :phone,
                0, 0, :birth_date, :birth_time, :birth_place, :birth_name,
                :birth_status, :created_at, :updated_at
             )'
        );
        $insert->execute([
            ':id' => $id,
            ':username' => $username,
            ':password_hash' => password_hash($password, PASSWORD_DEFAULT),
            ':display_name' => $displayName,
            ':email' => $email,
            ':phone' => $phone,
            ':birth_date' => $birthDate,
            ':birth_time' => $birthTime,
            ':birth_place' => $birthPlace !== '' ? $birthPlace : null,
            ':birth_name' => $birthName !== '' ? $birthName : null,
            ':birth_status' => CONNECTIONS_BIRTH_NONE,
            ':created_at' => $now,
            ':updated_at' => $now,
        ]);

        $user = connectionsFetchUserById($pdo, $id);
        $token = connectionsCreateSession($pdo, $id, connectionsStaySignedIn($body) ? 365 : 1);
        connectionsRespond(201, [
            'ok' => true,
            'token' => $token,
            'user' => connectionsUserPayload($pdo, $user),
            'apiVersion' => CONNECTIONS_API_VERSION,
        ]);
    }

    if ($action === 'login') {
        $identifier = trim((string) ($body['identifier'] ?? $body['username'] ?? $body['email'] ?? $body['phone'] ?? ''));
        $password = (string) ($body['password'] ?? '');
        $user = $identifier !== '' ? connectionsFetchUserByIdentifier($pdo, $identifier) : null;
        if ($user === null || !password_verify($password, (string) $user['password_hash'])) {
            connectionsRespond(401, ['error' => 'Incorrect email, phone, or password.']);
        }

        $token = connectionsCreateSession($pdo, $user['id'], connectionsStaySignedIn($body) ? 365 : 1);
        connectionsRespond(200, [
            'ok' => true,
            'token' => $token,
            'user' => connectionsUserPayload($pdo, $user),
            'apiVersion' => CONNECTIONS_API_VERSION,
        ]);
    }

    if ($action === 'forgot-password') {
        $identifier = trim((string) ($body['identifier'] ?? ''));
        $user = $identifier !== '' ? connectionsFetchUserByIdentifier($pdo, $identifier) : null;
        if ($user !== null) {
            connectionsIssuePasswordReset($pdo, $user);
        }
        connectionsRespond(200, [
            'ok' => true,
            'message' => 'If that account has an email, we sent a link to reset the password. It expires in 24 hours.',
        ]);
    }

    if ($action === 'reset-password') {
        $token = trim((string) ($body['token'] ?? ''));
        $password = (string) ($body['password'] ?? '');
        if (strlen($password) < CONNECTIONS_MIN_PASSWORD) {
            connectionsRespond(400, [
                'error' => 'Password must be at least ' . CONNECTIONS_MIN_PASSWORD . ' characters. Capital letters, lowercase letters, and numbers are all allowed.',
            ]);
        }
        if ($token === '' || !preg_match('/^[a-f0-9]{64}$/', $token)) {
            connectionsRespond(400, ['error' => 'That reset link is not valid. Request a new one.']);
        }
        $hash = hash('sha256', $token);
        $lookup = $pdo->prepare(
            'SELECT user_id, expires_at FROM password_resets WHERE token_hash = :token_hash LIMIT 1'
        );
        $lookup->execute([':token_hash' => $hash]);
        $reset = $lookup->fetch();
        if (!$reset || (int) $reset['expires_at'] < time()) {
            connectionsRespond(400, ['error' => 'That reset link has expired. Request a new one.']);
        }
        $pdo->prepare(
            'UPDATE users SET password_hash = :password_hash, updated_at = :updated_at WHERE id = :id'
        )->execute([
            ':password_hash' => password_hash($password, PASSWORD_DEFAULT),
            ':updated_at' => time(),
            ':id' => $reset['user_id'],
        ]);
        $pdo->prepare('DELETE FROM password_resets WHERE user_id = :user_id')->execute([
            ':user_id' => $reset['user_id'],
        ]);
        $pdo->prepare('DELETE FROM user_sessions WHERE user_id = :user_id')->execute([
            ':user_id' => $reset['user_id'],
        ]);
        connectionsRespond(200, [
            'ok' => true,
            'message' => 'Password updated. You can sign in with the new password.',
        ]);
    }

    if ($action === 'logout') {
        $token = connectionsReadBearerToken();
        if ($token !== null) {
            connectionsDeleteSessionByToken($pdo, $token);
        }
        connectionsRespond(200, ['ok' => true]);
    }

    if ($action === 'update') {
        $user = connectionsRequireUser($pdo);
        $displayName = (string) ($user['username'] ?? '');
        if ($displayName === '') {
            connectionsRespond(400, ['error' => 'Account username is missing.']);
        }

        $emailRaw = array_key_exists('email', $body) ? (string) $body['email'] : null;
        $phoneRaw = array_key_exists('phone', $body) ? (string) $body['phone'] : null;
        $email = $user['email'] ?? null;
        $phone = $user['phone'] ?? null;

        if ($emailRaw !== null) {
            $emailRaw = trim($emailRaw);
            if ($emailRaw === '') {
                $email = null;
            } else {
                $email = connectionsValidateEmail($emailRaw);
                if ($email === null) {
                    connectionsRespond(400, ['error' => 'That email address does not look valid.']);
                }
                $existing = connectionsFetchUserByEmail($pdo, $email);
                if ($existing && $existing['id'] !== $user['id']) {
                    connectionsRespond(409, ['error' => 'That email is already used by another account.']);
                }
            }
        }
        if ($phoneRaw !== null) {
            $phoneRaw = trim($phoneRaw);
            if ($phoneRaw === '') {
                $phone = null;
            } else {
                $phone = connectionsValidatePhone($phoneRaw);
                if ($phone === null) {
                    connectionsRespond(400, ['error' => 'Enter a phone number with 8–15 digits.']);
                }
                $existing = connectionsFetchUserByPhone($pdo, $phone);
                if ($existing && $existing['id'] !== $user['id']) {
                    connectionsRespond(409, ['error' => 'That phone number is already used by another account.']);
                }
            }
        }

        if (($email === null || $email === '') && ($phone === null || $phone === '')) {
            connectionsRespond(400, ['error' => 'Keep at least an email or phone number on your account.']);
        }

        $stmt = $pdo->prepare(
            'UPDATE users SET display_name = :display_name, email = :email, phone = :phone,
             updated_at = :updated_at WHERE id = :id'
        );
        $stmt->execute([
            ':display_name' => $displayName,
            ':email' => $email !== '' ? $email : null,
            ':phone' => $phone !== '' ? $phone : null,
            ':updated_at' => time(),
            ':id' => $user['id'],
        ]);

        $listing = connectionsFetchListingForUser($pdo, $user['id']);
        if ($listing !== null) {
            $pdo->prepare(
                'UPDATE profiles SET display_name = :display_name, updated_at = :updated_at WHERE user_id = :user_id'
            )->execute([
                ':display_name' => $displayName,
                ':updated_at' => time(),
                ':user_id' => $user['id'],
            ]);
        }

        $fresh = connectionsFetchUserById($pdo, $user['id']);
        connectionsRespond(200, [
            'ok' => true,
            'user' => connectionsUserPayload($pdo, $fresh),
        ]);
    }

    if ($action === 'save-birth-details') {
        $user = connectionsRequireUser($pdo);
        $dateStatus = connectionsNormalizeBirthStatus($user['birth_verification_status'] ?? null);
        $timeStatus = connectionsNormalizeBirthStatus($user['birth_time_verification_status'] ?? null);

        if ($dateStatus === CONNECTIONS_BIRTH_PENDING || $dateStatus === CONNECTIONS_BIRTH_VERIFIED) {
            connectionsRespond(400, [
                'error' => 'Your birth date is locked while Verified review is pending or approved. Contact support if it needs a correction.',
            ]);
        }
        if ($timeStatus === CONNECTIONS_BIRTH_PENDING || $timeStatus === CONNECTIONS_BIRTH_VERIFIED) {
            connectionsRespond(400, [
                'error' => 'Your birth time is locked while Time Verified review is pending or approved.',
            ]);
        }

        $birthDateRaw = array_key_exists('birthDate', $body)
            ? trim((string) $body['birthDate'])
            : (string) ($user['birth_date'] ?? '');
        $birthTimeRaw = array_key_exists('birthTime', $body)
            ? trim((string) $body['birthTime'])
            : (string) ($user['birth_time'] ?? '');
        $birthPlace = array_key_exists('birthPlace', $body)
            ? connectionsSanitizeText((string) $body['birthPlace'], 200)
            : (string) ($user['birth_place'] ?? '');
        $birthName = array_key_exists('birthName', $body)
            ? connectionsSanitizeText((string) $body['birthName'], CONNECTIONS_MAX_DISPLAY_NAME)
            : (string) ($user['birth_name'] ?? '');

        $birthDate = null;
        if ($birthDateRaw !== '') {
            $birthDate = connectionsValidateBirthDate($birthDateRaw);
            if ($birthDate === null) {
                connectionsRespond(400, ['error' => 'Enter birth date as YYYY-MM-DD.']);
            }
        }

        $birthTime = null;
        if ($birthTimeRaw !== '') {
            $birthTime = connectionsValidateBirthTime($birthTimeRaw);
            if ($birthTime === null || $birthTime === '') {
                connectionsRespond(400, ['error' => 'Enter birth time as HH:MM (24-hour) or leave it blank.']);
            }
        }

        $stmt = $pdo->prepare(
            'UPDATE users SET
                birth_date = :birth_date,
                birth_time = :birth_time,
                birth_place = :birth_place,
                birth_name = :birth_name,
                updated_at = :updated_at
             WHERE id = :id'
        );
        $stmt->execute([
            ':birth_date' => $birthDate,
            ':birth_time' => $birthTime,
            ':birth_place' => $birthPlace !== '' ? $birthPlace : null,
            ':birth_name' => $birthName !== '' ? $birthName : null,
            ':updated_at' => time(),
            ':id' => $user['id'],
        ]);

        $fresh = connectionsFetchUserById($pdo, $user['id']);
        connectionsRespond(200, [
            'ok' => true,
            'user' => connectionsUserPayload($pdo, $fresh),
            'message' => 'Birth details saved.',
        ]);
    }

    if ($action === 'submit-birth-verification') {
        $user = connectionsRequireUser($pdo);
        $dateStatus = connectionsNormalizeBirthStatus($user['birth_verification_status'] ?? null);
        if ($dateStatus === CONNECTIONS_BIRTH_VERIFIED) {
            connectionsRespond(400, ['error' => 'Your birth date is already verified.']);
        }
        if ($dateStatus === CONNECTIONS_BIRTH_PENDING) {
            connectionsRespond(400, [
                'error' => 'Your date verification is already pending review.',
            ]);
        }

        $birthDate = connectionsValidateBirthDate((string) ($body['birthDate'] ?? ''));
        if ($birthDate === null) {
            connectionsRespond(400, ['error' => 'Enter your birth date as YYYY-MM-DD (as shown on your ID).']);
        }

        if (!$isMultipart) {
            connectionsRespond(400, [
                'error' => 'Upload a photo of a driver’s license, passport, or other ID with your birth date (field idDocument).',
            ]);
        }

        $upload = connectionsStoreBirthIdUpload(
            $user['id'],
            'idDocument',
            'driver’s license, passport, or other ID showing your birth date'
        );
        connectionsDeleteStoredBirthFile($user['birth_id_path'] ?? null);

        $note = connectionsSanitizeText((string) ($body['note'] ?? ''), 400);
        $stmt = $pdo->prepare(
            'UPDATE users SET
                birth_date = :birth_date,
                birth_verification_status = :status,
                birth_verification_note = :note,
                birth_id_path = :path,
                birth_id_original_name = :original,
                birth_verified_at = NULL,
                birth_reviewed_at = NULL,
                updated_at = :updated_at
             WHERE id = :id'
        );
        $stmt->execute([
            ':birth_date' => $birthDate,
            ':status' => CONNECTIONS_BIRTH_PENDING,
            ':note' => $note !== '' ? $note : null,
            ':path' => $upload['path'],
            ':original' => $upload['originalName'],
            ':updated_at' => time(),
            ':id' => $user['id'],
        ]);

        $fresh = connectionsFetchUserById($pdo, $user['id']);
        connectionsNotifyAdminBirthVerification($fresh, 'date');
        connectionsRespond(200, [
            'ok' => true,
            'user' => connectionsUserPayload($pdo, $fresh),
            'message' => 'Thanks — your Verified badge request is pending review. Date confirmation covers 3 of 4 totem animals (year, month, and day).',
        ]);
    }

    if ($action === 'submit-birth-time-verification') {
        $user = connectionsRequireUser($pdo);
        $dateStatus = connectionsNormalizeBirthStatus($user['birth_verification_status'] ?? null);
        $timeStatus = connectionsNormalizeBirthStatus($user['birth_time_verification_status'] ?? null);

        if ($dateStatus !== CONNECTIONS_BIRTH_VERIFIED) {
            connectionsRespond(400, [
                'error' => 'Get the standard Verified badge first (ID with birth date), then submit time-of-birth proof for the golden badge.',
            ]);
        }
        if ($timeStatus === CONNECTIONS_BIRTH_VERIFIED) {
            connectionsRespond(400, ['error' => 'Your birth time is already verified.']);
        }
        if ($timeStatus === CONNECTIONS_BIRTH_PENDING) {
            connectionsRespond(400, ['error' => 'Your birth-time verification is already pending review.']);
        }

        $birthTime = connectionsValidateBirthTime((string) ($body['birthTime'] ?? ''));
        if ($birthTime === null || $birthTime === '') {
            connectionsRespond(400, [
                'error' => 'Enter the birth time (HH:MM) shown on your birth certificate or sworn declaration.',
            ]);
        }

        if (!$isMultipart) {
            connectionsRespond(400, [
                'error' => 'Upload a birth certificate or sworn declaration of birth time (field timeDocument).',
            ]);
        }

        $upload = connectionsStoreBirthIdUpload(
            $user['id'],
            'timeDocument',
            'birth certificate or sworn declaration of birth time'
        );
        connectionsDeleteStoredBirthFile($user['birth_time_id_path'] ?? null);

        $note = connectionsSanitizeText((string) ($body['note'] ?? ''), 400);
        $stmt = $pdo->prepare(
            'UPDATE users SET
                birth_time = :birth_time,
                birth_time_verification_status = :status,
                birth_time_verification_note = :note,
                birth_time_id_path = :path,
                birth_time_id_original_name = :original,
                birth_time_verified_at = NULL,
                birth_time_reviewed_at = NULL,
                updated_at = :updated_at
             WHERE id = :id'
        );
        $stmt->execute([
            ':birth_time' => $birthTime,
            ':status' => CONNECTIONS_BIRTH_PENDING,
            ':note' => $note !== '' ? $note : null,
            ':path' => $upload['path'],
            ':original' => $upload['originalName'],
            ':updated_at' => time(),
            ':id' => $user['id'],
        ]);

        $fresh = connectionsFetchUserById($pdo, $user['id']);
        connectionsNotifyAdminBirthVerification($fresh, 'time');
        connectionsRespond(200, [
            'ok' => true,
            'user' => connectionsUserPayload($pdo, $fresh),
            'message' => 'Thanks — your golden Time Verified request is pending review. This confirms the hour animal (4th of 4).',
        ]);
    }

    connectionsRespond(400, [
        'error' => 'Unknown action. Use register, login, logout, forgot-password, reset-password, update, submit-birth-verification, or submit-birth-time-verification.',
    ]);
} catch (Throwable $error) {
    connectionsRespond(500, ['error' => 'Account service is temporarily unavailable.']);
}
