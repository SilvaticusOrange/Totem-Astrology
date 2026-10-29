<?php
/**
 * Contact page + form handler for GoDaddy cPanel hosting.
 * GET  — serves contact.html with strict no-cache headers
 * POST — sends the contact form email
 */
declare(strict_types=1);

// Reading bookings + contact form — personal inbox (comma-separated OK).
define('RECIPIENT_EMAIL', 'alucardsilvaticus@gmail.com, silvaticusorange@totemastrology.com');
define('CONTACT_PAGE', __DIR__ . '/contact.html');

function sendNoCacheHeaders(): void
{
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0, private');
    header('Pragma: no-cache');
    header('Expires: Thu, 01 Jan 1970 00:00:00 GMT');
}

function redirectToContact(string $query = ''): void
{
    sendNoCacheHeaders();
    header('Location: contact.php' . $query);
    exit;
}

function serveContactPage(): void
{
    if (!is_readable(CONTACT_PAGE)) {
        sendNoCacheHeaders();
        http_response_code(503);
        header('Content-Type: text/html; charset=UTF-8');
        echo '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Contact page unavailable</title></head><body>';
        echo '<h1>Contact page file missing</h1>';
        echo '<p>Upload <strong>contact.html</strong> to <code>public_html/</code> on GoDaddy, then reload.</p>';
        echo '</body></html>';
        exit;
    }

    sendNoCacheHeaders();
    header('Content-Type: text/html; charset=UTF-8');
    header('X-Page-Build: 20260815');
    readfile(CONTACT_PAGE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    serveContactPage();
}

// Honeypot — bots fill this hidden field
if (!empty($_POST['website'])) {
    redirectToContact('?sent=1');
}

$name = trim(strip_tags($_POST['name'] ?? ''));
$email = trim($_POST['email'] ?? '');
$service = trim(strip_tags($_POST['service'] ?? ''));
$message = trim(strip_tags($_POST['message'] ?? ''));

$errors = [];

if ($name === '') {
    $errors[] = 'name';
}
if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'email';
}
if ($message === '') {
    $errors[] = 'message';
}

if (!empty($errors)) {
    redirectToContact('?error=1');
}

$serviceLabels = [
    'personal-reading' => 'Personal Reading',
    'relationship-guide' => 'Relationship Guide',
    'family-dynamics' => 'Family Dynamics',
    'business-goals' => 'Business Goals',
    'new-connections' => 'New Connections',
    'other' => 'Other / Not Sure',
];

$serviceLabel = $serviceLabels[$service] ?? ($service !== '' ? $service : 'Not specified');

$subject = 'TotemAstrology.com — New contact from ' . $name;
$body = "Name: $name\n";
$body .= "Email: $email\n";
$body .= "Service: $serviceLabel\n\n";
$body .= "Message:\n$message\n";

$headers = "From: TotemAstrology <noreply@" . ($_SERVER['HTTP_HOST'] ?? 'totemastrology.com') . ">\r\n";
$headers .= "Reply-To: $name <$email>\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

$sent = @mail(RECIPIENT_EMAIL, $subject, $body, $headers);

if ($sent) {
    redirectToContact('?sent=1');
}

redirectToContact('?error=1');
