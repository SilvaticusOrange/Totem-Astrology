<?php
/**
 * About page entry — PHP sends strict no-cache headers (GoDaddy-safe).
 */
declare(strict_types=1);

header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0, private');
header('Pragma: no-cache');
header('Expires: Thu, 01 Jan 1970 00:00:00 GMT');
header('Content-Type: text/html; charset=UTF-8');

readfile(__DIR__ . '/about.html');
