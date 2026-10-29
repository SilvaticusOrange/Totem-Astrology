<?php
/**
 * Homepage entry — PHP sends strict no-cache headers (GoDaddy-safe).
 */
declare(strict_types=1);

header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0, private');
header('Pragma: no-cache');
header('Expires: Thu, 01 Jan 1970 00:00:00 GMT');
header('Content-Type: text/html; charset=UTF-8');

$indexPath = __DIR__ . '/index.html';

if (!is_readable($indexPath) || filesize($indexPath) === 0) {
    http_response_code(503);
    echo '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Site maintenance</title></head><body style="font-family:system-ui,sans-serif;max-width:36rem;margin:3rem auto;padding:0 1rem;line-height:1.6">';
    echo '<h1>Homepage file missing</h1>';
    echo '<p><code>index.html</code> is not on the server (or uploaded empty). Other pages may still work.</p>';
    echo '<p>Re-upload <code>index.html</code> to the same folder as <code>index.php</code>, then reload.</p>';
    echo '<p><a href="calculator.html">Totem Calculator</a> · <a href="faq.html">FAQ</a> · <a href="contact.php">Contact</a></p>';
    echo '</body></html>';
    exit;
}

readfile($indexPath);
