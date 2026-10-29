<?php
/**
 * Live site config — never cached. Homepage reads this on every load so
 * promo text and page version stay current without clearing browser data.
 */
declare(strict_types=1);

header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0, private');
header('Pragma: no-cache');
header('Expires: Thu, 01 Jan 1970 00:00:00 GMT');

const SITE_VERSION = '20260883';

echo json_encode([
    'version' => SITE_VERSION,
    'homePromo' => [
        [
            'id' => 'how-it-works',
            'title' => 'How It Works',
            'text' => 'Four totem guides, Five Elements, Yin & Yang, Values Triangles, Sacred Roles, and Nepal Time — one map for understanding your totem pole.',
            'href' => 'how-it-works.html',
            'button' => 'Explore the System',
            'primary' => false,
            'featured' => false,
        ],
        [
            'id' => 'calculator',
            'title' => 'Totem Animals Calculator',
            'text' => 'Enter your birth date, time, and city to reveal your four totem guides: Spirit, Mind, Heart, and Body.',
            'href' => 'calculator.html',
            'button' => 'Reveal Your Totems',
            'primary' => true,
            'featured' => true,
        ],
        [
            'id' => 'connections',
            'title' => 'Totem Connections',
            'text' => "Browse other people's totems and discover Rainbows, Shadows, Values Trines, Mirror Opposites, and Same As Me.",
            'href' => 'connections.html',
            'button' => 'Find Your People',
            'primary' => false,
            'featured' => false,
        ],
    ],
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
