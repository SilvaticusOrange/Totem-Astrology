<?php
/**
 * Totem Connections moderation API (admin session required).
 * Moderates directory listings and birth-ID verification requests.
 */
declare(strict_types=1);

require __DIR__ . '/connections-lib.php';

header('Content-Type: application/json; charset=UTF-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0, private');

try {
    connectionsEnsureStorage();
    connectionsStartAdminSession();

    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    if ($method === 'POST') {
        $body = connectionsReadJsonBody();
        $action = (string) ($body['action'] ?? '');

        if ($action === 'login') {
            if (!connectionsAdminConfigured()) {
                connectionsRespond(503, [
                    'error' => 'Admin is not configured yet. Upload data/connections-config.php on the server.',
                ]);
            }

            $password = (string) ($body['password'] ?? '');
            if ($password === '' || !connectionsVerifyAdminPassword($password)) {
                connectionsRespond(401, ['error' => 'Incorrect password.']);
            }

            $_SESSION['connections_admin'] = true;
            connectionsRespond(200, ['ok' => true, 'authenticated' => true]);
        }

        if ($action === 'logout') {
            $_SESSION = [];
            if (session_status() === PHP_SESSION_ACTIVE) {
                session_destroy();
            }
            connectionsRespond(200, ['ok' => true, 'authenticated' => false]);
        }

        connectionsRequireAdmin();
        $pdo = connectionsOpenDatabase();

        if ($action === 'approve-birth' || $action === 'reject-birth') {
            $userId = trim((string) ($body['userId'] ?? $body['id'] ?? ''));
            if ($userId === '') {
                connectionsRespond(400, ['error' => 'User id is required.']);
            }
            $user = connectionsFetchUserById($pdo, $userId);
            if ($user === null) {
                connectionsRespond(404, ['error' => 'User not found.']);
            }
            $status = $action === 'approve-birth'
                ? CONNECTIONS_BIRTH_VERIFIED
                : CONNECTIONS_BIRTH_REJECTED;
            $note = connectionsSanitizeText((string) ($body['note'] ?? ''), 400);
            $now = time();
            $stmt = $pdo->prepare(
                'UPDATE users SET
                    birth_verification_status = :status,
                    birth_verification_note = :note,
                    birth_verified_at = :verified_at,
                    birth_reviewed_at = :reviewed_at,
                    updated_at = :updated_at
                 WHERE id = :id'
            );
            $stmt->execute([
                ':status' => $status,
                ':note' => $note !== '' ? $note : ($user['birth_verification_note'] ?? null),
                ':verified_at' => $status === CONNECTIONS_BIRTH_VERIFIED ? $now : null,
                ':reviewed_at' => $now,
                ':updated_at' => $now,
                ':id' => $userId,
            ]);
            connectionsRespond(200, ['ok' => true, 'birthVerificationStatus' => $status]);
        }

        if ($action === 'approve-birth-time' || $action === 'reject-birth-time') {
            $userId = trim((string) ($body['userId'] ?? $body['id'] ?? ''));
            if ($userId === '') {
                connectionsRespond(400, ['error' => 'User id is required.']);
            }
            $user = connectionsFetchUserById($pdo, $userId);
            if ($user === null) {
                connectionsRespond(404, ['error' => 'User not found.']);
            }
            $status = $action === 'approve-birth-time'
                ? CONNECTIONS_BIRTH_VERIFIED
                : CONNECTIONS_BIRTH_REJECTED;
            $note = connectionsSanitizeText((string) ($body['note'] ?? ''), 400);
            $now = time();
            $stmt = $pdo->prepare(
                'UPDATE users SET
                    birth_time_verification_status = :status,
                    birth_time_verification_note = :note,
                    birth_time_verified_at = :verified_at,
                    birth_time_reviewed_at = :reviewed_at,
                    updated_at = :updated_at
                 WHERE id = :id'
            );
            $stmt->execute([
                ':status' => $status,
                ':note' => $note !== '' ? $note : ($user['birth_time_verification_note'] ?? null),
                ':verified_at' => $status === CONNECTIONS_BIRTH_VERIFIED ? $now : null,
                ':reviewed_at' => $now,
                ':updated_at' => $now,
                ':id' => $userId,
            ]);
            connectionsRespond(200, ['ok' => true, 'birthTimeVerificationStatus' => $status]);
        }

        $id = trim((string) ($body['id'] ?? ''));
        if ($id === '') {
            connectionsRespond(400, ['error' => 'Listing id is required.']);
        }

        if ($action === 'approve') {
            if (!connectionsSetProfileStatus($pdo, $id, CONNECTIONS_STATUS_APPROVED)) {
                connectionsRespond(404, ['error' => 'Listing not found.']);
            }
            connectionsRespond(200, ['ok' => true, 'status' => CONNECTIONS_STATUS_APPROVED]);
        }

        if ($action === 'reject') {
            if (!connectionsSetProfileStatus($pdo, $id, CONNECTIONS_STATUS_REJECTED)) {
                connectionsRespond(404, ['error' => 'Listing not found.']);
            }
            connectionsRespond(200, ['ok' => true, 'status' => CONNECTIONS_STATUS_REJECTED]);
        }

        if ($action === 'delete') {
            if (!connectionsDeleteProfile($pdo, $id)) {
                connectionsRespond(404, ['error' => 'Listing not found.']);
            }
            connectionsRespond(200, ['ok' => true, 'deleted' => true]);
        }

        connectionsRespond(400, ['error' => 'Unknown action.']);
    }

    if ($method === 'GET') {
        connectionsRequireAdmin();
        $pdo = connectionsOpenDatabase();

        if (isset($_GET['birthId']) && trim((string) $_GET['birthId']) !== '') {
            $userId = trim((string) $_GET['birthId']);
            $kind = trim((string) ($_GET['kind'] ?? 'date'));
            $user = connectionsFetchUserById($pdo, $userId);
            if ($user === null) {
                connectionsRespond(404, ['error' => 'Document not found.']);
            }
            $relative = $kind === 'time'
                ? (string) ($user['birth_time_id_path'] ?? '')
                : (string) ($user['birth_id_path'] ?? '');
            $downloadName = $kind === 'time'
                ? (string) ($user['birth_time_id_original_name'] ?? 'birth-time-doc')
                : (string) ($user['birth_id_original_name'] ?? 'birth-id');
            if (trim($relative) === '') {
                connectionsRespond(404, ['error' => 'Document not found.']);
            }
            $path = connectionsBirthIdAbsolutePath($relative);
            if (!is_file($path)) {
                connectionsRespond(404, ['error' => 'Document file missing on server.']);
            }
            $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
            $mimes = [
                'jpg' => 'image/jpeg',
                'jpeg' => 'image/jpeg',
                'png' => 'image/png',
                'webp' => 'image/webp',
                'pdf' => 'application/pdf',
            ];
            $mime = $mimes[$ext] ?? 'application/octet-stream';
            if ($downloadName === '' || strpos($downloadName, '.') === false) {
                $downloadName .= '.' . $ext;
            }
            header_remove('Content-Type');
            header('Content-Type: ' . $mime);
            header('Content-Length: ' . (string) filesize($path));
            header('Content-Disposition: inline; filename="' . str_replace('"', '', $downloadName) . '"');
            header('X-Content-Type-Options: nosniff');
            readfile($path);
            exit;
        }

        $rows = connectionsFetchProfiles($pdo);

        $grouped = [
            CONNECTIONS_STATUS_PENDING => [],
            CONNECTIONS_STATUS_APPROVED => [],
            CONNECTIONS_STATUS_REJECTED => [],
        ];

        foreach ($rows as $row) {
            $status = (string) ($row['status'] ?? CONNECTIONS_STATUS_APPROVED);
            if (!isset($grouped[$status])) {
                $status = CONNECTIONS_STATUS_APPROVED;
            }
            $grouped[$status][] = connectionsAdminProfile($row);
        }

        $birthPending = connectionsFetchPendingBirthVerifications($pdo);

        connectionsRespond(200, [
            'ok' => true,
            'apiVersion' => CONNECTIONS_API_VERSION,
            'counts' => [
                'pending' => count($grouped[CONNECTIONS_STATUS_PENDING]),
                'approved' => count($grouped[CONNECTIONS_STATUS_APPROVED]),
                'rejected' => count($grouped[CONNECTIONS_STATUS_REJECTED]),
                'birthPending' => count($birthPending),
            ],
            'profiles' => $grouped,
            'birthVerifications' => $birthPending,
        ]);
    }

    connectionsRespond(405, ['error' => 'Method not allowed']);
} catch (Throwable $error) {
    connectionsRespond(500, ['error' => 'Moderation API is temporarily unavailable.']);
}
