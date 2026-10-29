# TotemAstrology.com

Static website for [TotemAstrology.com](https://totemastrology.com) — HTML, CSS, JavaScript, and a small PHP contact form for GoDaddy cPanel hosting.

**Ready to go live?** See **[GODADDY.md](GODADDY.md)** for the full upload checklist.

## Local development

```bash
cd ~/Projects/totem-astrology
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The contact form shows a test confirmation locally; real email delivery works only after upload to GoDaddy.

## Project structure

```
├── index.html          Home
├── about.html          About the practitioner
├── services.html       Readings & pricing
├── contact.html        Contact form
├── contact.php         Form handler (GoDaddy cPanel)
├── .htaccess           HTTPS + www redirects
├── css/styles.css      Shared styles
├── js/main.js          Mobile nav + form UX
├── assets/images/      Photos and logos
├── CONTENT.md          Placeholder content to replace
└── GODADDY.md          Upload & DNS checklist
```

## Customize content

See [CONTENT.md](CONTENT.md) for placeholder text, pricing, and images to replace.

## Deploy to GoDaddy cPanel (recommended)

### 1. Create an upload package

```bash
npm run package
```

This creates `totem-astrology-upload.zip` with only the files needed for hosting.

### 2. Buy the right GoDaddy product

You need **Web Hosting (cPanel)** — **not** Website Builder. Website Builder cannot accept custom HTML uploads.

If you already own hosting, connect **TotemAstrology.com** to it in GoDaddy → **My Products**.

### 3. Upload files

**Option A — File Manager (easiest)**

1. Log in at [godaddy.com](https://www.godaddy.com) → **My Products → Web Hosting → Manage**.
2. Open **cPanel** → **File Manager**.
3. Go to `public_html/` (or the folder for TotemAstrology.com if using an addon domain).
4. Delete any old Website Builder placeholder files.
5. Upload `totem-astrology-upload.zip`, then **Extract** it in place.
6. Confirm `index.html` sits directly inside `public_html/`.

**Option B — FTP**

Use FileZilla or Cyberduck with the FTP credentials from cPanel. Upload all site files to `public_html/`.

### 4. Point your domain

If the domain is already connected to your hosting plan, skip this. Otherwise:

1. GoDaddy → **Domains → TotemAstrology.com → DNS**.
2. Set the `@` **A record** to your hosting IP (shown in cPanel or hosting dashboard).
3. Set `www` as a **CNAME** to `@` or to your hosting hostname.

### 5. Disable Website Builder

GoDaddy → **My Products → Websites** → unpublish or disconnect the old Website Builder site so it no longer serves "Launching Soon."

### 6. Enable SSL

In cPanel → **SSL/TLS Status** → run **AutoSSL** or install a free Let's Encrypt certificate. The `.htaccess` file redirects HTTP to HTTPS once SSL is active.

### 7. Test

- [https://totemastrology.com](https://totemastrology.com) — home page loads
- All nav links work (About, Services, Contact)
- Submit the contact form — check `hello@totemastrology.com` inbox

## Contact form

Submissions go through `contact.php` using GoDaddy's built-in PHP mail. Update the recipient in `contact.php`:

```php
define('RECIPIENT_EMAIL', 'hello@totemastrology.com');
```

If mail doesn't arrive, check GoDaddy's spam folder and consider setting up a professional email address (`hello@totemastrology.com`) in cPanel → **Email Accounts**.

## License

Private — © TotemAstrology.com.
