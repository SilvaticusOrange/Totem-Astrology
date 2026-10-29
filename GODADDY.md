# GoDaddy cPanel Setup — TotemAstrology.com

Host your site entirely on GoDaddy using **Web Hosting (cPanel)**. No Netlify or third-party hosting required.

```mermaid
flowchart LR
  Local[Your Mac — edit files in Cursor]
  Zip[totem-astrology-upload.zip]
  CPanel[GoDaddy cPanel public_html]
  Domain[TotemAstrology.com]

  Local --> Zip
  Zip --> CPanel
  CPanel --> Domain
```

## What you need from GoDaddy

| Product | Use it? |
|---------|---------|
| **Domain registration** (you have this) | Yes — keeps TotemAstrology.com |
| **Web Hosting (cPanel)** | Yes — upload your site files here |
| **Website Builder** | No — cancel/unpublish once the new site is live |
| **Netlify / other hosts** | No — not needed |

---

## Step-by-step checklist

### 1. Prepare your files

In Terminal:

```bash
cd ~/Projects/totem-astrology
npm run package
```

This creates `totem-astrology-upload.zip` in the project folder.

### 2. Get Web Hosting (if you don't have it)

1. Log in at [godaddy.com](https://www.godaddy.com).
2. Buy **Web Hosting** (Economy or higher) — make sure it includes **cPanel**, not Website Builder alone.
3. In **My Products**, connect **TotemAstrology.com** to the hosting plan.

### 3. Upload to cPanel

1. **My Products → Web Hosting → Manage → cPanel**.
2. Open **File Manager**.
3. Navigate to `public_html/`.
   - If TotemAstrology.com is an addon domain, use that domain's folder instead (shown in **Domains** in cPanel).
4. Remove old files (e.g. `index.html` from Website Builder or default "Coming Soon" page).
5. Click **Upload** → select `totem-astrology-upload.zip`.
6. After upload, right-click the zip → **Extract**.
7. Delete the zip file from the server when done.

Your `public_html/` should look like:

```
public_html/
├── index.html
├── about.html
├── services.html
├── contact.html
├── contact.php
├── .htaccess
├── css/
├── js/
└── assets/
```

### 4. Connect the domain (DNS)

If GoDaddy already linked the domain when you bought hosting, skip to step 5.

Otherwise, in **Domains → TotemAstrology.com → DNS**:

| Type | Name | Value |
|------|------|-------|
| A | @ | Your hosting IP (from cPanel or hosting dashboard) |
| CNAME | www | @ |

Remove any DNS records that point to **Website Builder**.

### 5. Turn off Website Builder

1. **My Products → Websites**.
2. Find the TotemAstrology.com Website Builder entry.
3. **Unpublish**, **disconnect**, or **delete** it.

This removes the "Launching Soon" page.

### 6. Turn on SSL (HTTPS)

1. In cPanel, open **SSL/TLS Status**.
2. Run **Run AutoSSL** or install a free certificate for `totemastrology.com` and `www.totemastrology.com`.
3. Wait a few minutes, then visit `https://totemastrology.com`.

The included `.htaccess` redirects HTTP to HTTPS automatically once SSL is active.

### 7. Set up email (recommended)

For the contact form to work reliably:

1. cPanel → **Email Accounts**.
2. Create `hello@totemastrology.com`.
3. Confirm `contact.php` uses that address (it does by default).
4. Test the contact form on the live site.

### 8. Test everything

- [ ] Home page loads at `https://totemastrology.com`
- [ ] About, Services, Contact pages work
- [ ] Mobile menu opens and closes
- [ ] Contact form submits and you receive the email
- [ ] `www.totemastrology.com` redirects correctly

### 9. Cancel Website Builder billing

Once the new site is live, cancel the **Website Builder** subscription so you're not paying for two products.

---

## Updating the site later

1. Edit files locally in Cursor.
2. Run `npm run package` to create a fresh zip.
3. Upload changed files via File Manager or FTP (you can upload individual files instead of the full zip).

---

## Common issues

| Problem | Fix |
|---------|-----|
| Still shows "Launching Soon" | Website Builder still active — unpublish it in My Products → Websites |
| 403 or blank page | `index.html` not in `public_html/` root — check folder structure |
| CSS/JS not loading | Files not uploaded to correct paths — ensure `css/` and `js/` folders exist |
| Contact form error | PHP not enabled (rare on GoDaddy) or email not set up — create `hello@totemastrology.com` in cPanel |
| Form submits but no email | Check spam; verify `RECIPIENT_EMAIL` in `contact.php`; confirm GoDaddy email account exists |
| HTTPS not working | Run AutoSSL in cPanel and wait 15–30 minutes |

---

## Need help?

Share a screenshot of your cPanel File Manager or GoDaddy DNS page and we can walk through the exact steps together.
