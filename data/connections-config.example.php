<?php
/**
 * Totem Connections moderation config — copy to connections-config.php and customize.
 *
 * Upload the finished connections-config.php to public_html/data/ on GoDaddy.
 * That folder is blocked from web access by data/.htaccess.
 */
return [
    // Sign in at /connections-admin.php with this plain-text password.
    'adminPassword' => 'pick-a-strong-password-here',

    // Optional email when a new listing arrives (pending review).
    // Comma-separated addresses are supported.
    'notifyEmail' => 'alucardsilvaticus@gmail.com, silvaticusorange@totemastrology.com',
    'notifyOnSubmit' => true,

    // Email notification for new ID / birth-time verification requests.
    // Sensitive images stay private on the server and are not attached.
    'verificationNotifyEmail' => 'alucardsilvaticus@gmail.com, silvaticusorange@totemastrology.com',

    // Used in moderation emails
    'siteUrl' => 'https://totemastrology.com',
];
