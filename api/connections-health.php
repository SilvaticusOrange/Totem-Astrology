<?php
/**
 * One-time diagnostic for Totem Connections on GoDaddy.
 * Upload to public_html/api/, visit in a browser, then delete this file.
 */
declare(strict_types=1);

header('Content-Type: application/json; charset=UTF-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0, private');

$dataDir = dirname(__DIR__) . '/data';
$dbPath = $dataDir . '/connections.db';
$configPath = $dataDir . '/connections-config.php';

$report = [
    'ok' => false,
    'phpVersion' => PHP_VERSION,
    'pdoLoaded' => extension_loaded('pdo'),
    'pdoSqliteLoaded' => extension_loaded('pdo_sqlite'),
    'dataDir' => $dataDir,
    'dataDirExists' => is_dir($dataDir),
    'dataDirWritable' => is_writable($dataDir),
    'configExists' => is_readable($configPath),
    'dbExists' => is_file($dbPath),
    'dbWritable' => is_file($dbPath) ? is_writable($dbPath) : is_writable($dataDir),
    'libExists' => is_readable(__DIR__ . '/connections-lib.php'),
];

if (!$report['libExists']) {
    $report['error'] = 'Upload api/connections-lib.php to GoDaddy.';
    echo json_encode($report, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    exit;
}

require __DIR__ . '/connections-lib.php';

$report['sqliteAvailable'] = connectionsSqliteAvailable();

if (!$report['dataDirExists']) {
    @mkdir($dataDir, 0755, true);
    $report['dataDirExists'] = is_dir($dataDir);
    $report['dataDirWritable'] = is_writable($dataDir);
}

if (!$report['dataDirExists'] || !$report['dataDirWritable']) {
    $report['error'] = 'Create public_html/data/ in cPanel and set permissions to 755 or 775.';
    $report['nextStep'] = 'Upload data/.htaccess and data/connections-config.php, then reload this page.';
    echo json_encode($report, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    exit;
}

if (!$report['sqliteAvailable']) {
    $report['error'] = 'Enable the pdo_sqlite PHP extension in cPanel (Select PHP Version → Extensions).';
    echo json_encode($report, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    exit;
}

try {
    $pdo = connectionsOpenDatabase();
    $stmt = $pdo->query('SELECT COUNT(*) AS total FROM profiles');
    $row = $stmt->fetch();
    $report['ok'] = true;
    $report['profileCount'] = (int) ($row['total'] ?? 0);
    $report['apiVersion'] = CONNECTIONS_API_VERSION;
    $report['nextStep'] = 'Delete this file (api/connections-health.php), then reload connections.html.';
} catch (Throwable $error) {
    $report['error'] = $error->getMessage();
    $report['nextStep'] = 'Fix the issue above, re-upload api/connections-lib.php if needed, then delete this file.';
}

echo json_encode($report, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
