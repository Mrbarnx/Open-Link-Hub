# Open Link Hub

A free, self-hosted link-in-bio, portfolio, CV and product showcase with a secure admin dashboard, first-party click analytics and Cloudflare deployment.

<img width="1027" height="713" alt="image" src="https://github.com/user-attachments/assets/1e4ed8c0-1563-4688-ab62-4541214397db" />


[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Mrbarnx/Open-Link-Hub)

## Features

- Premium responsive public link page
- Admin-managed profile photo, favicon, social links and contact links
- Editable links and featured products
- Structured CV page and downloadable résumé upload
- Admin dashboard for content, appearance and analytics
- First-party views, clicks, click-through rate and top-link analytics
- Cloudflare D1 database and R2 file storage
- Signed secure admin sessions and persistent login throttling
- Same-origin checks, upload validation and security headers
- Canonical metadata, Open Graph, X metadata, robots.txt, sitemap and Person JSON-LD
- No external analytics tracker and no raw visitor IP storage

## Fast deployment

Click **Deploy to Cloudflare** above. Cloudflare will copy this repository into your account and prepare a Worker deployment. You must still create or confirm the D1 and R2 resources, apply the database migrations and add your private secrets before Admin can sign in.

For the exact beginner-friendly steps, read [Cloudflare setup](docs/CLOUDFLARE_SETUP.md).

## Local setup

Requirements: Node.js 22.13 or newer and a free Cloudflare account.

```bash
git clone https://github.com/Mrbarnx/Open-Link-Hub.git
cd Open-Link-Hub
npm ci
cp .dev.vars.example .dev.vars
npm run secrets:generate
```

Copy the generated values into `.dev.vars`, excluding `ADMIN_PASSWORD`. That password is only for you to save in a password manager and use on the login page.

Create local database tables and start the app:

```bash
npm run db:migrate:local
npm run dev
```

Open the local URL printed by Vite. Admin is available at `/admin`.

## Personalize it

1. Sign in at `/admin`.
2. Replace the introduction and social URLs.
3. Upload a profile photo, favicon and résumé PDF.
4. Edit the featured links, product and CV sections.
5. Choose the accent colour, card style and background.
6. Save and open the public page.

Changes saved from Admin are stored in D1. Uploaded files are stored in R2. The generic source defaults remain safe for public forks.

## Environment variables

| Name | Secret | Purpose |
| --- | --- | --- |
| `ADMIN_USERNAME` | Yes | Private admin username |
| `ADMIN_PASSWORD_DIGEST` | Yes | HMAC digest generated from the password |
| `ADMIN_PASSWORD_PEPPER` | Yes | Secret used to verify the password |
| `ADMIN_SESSION_SECRET` | Yes | Signs the 12-hour admin session cookie |
| `SITE_URL` | No | Production origin used for canonical SEO URLs |

Never add `ADMIN_PASSWORD` as a runtime variable. The application does not need the plain password. Never commit `.dev.vars`, `.env`, Wrangler state, database files or generated secrets.

## Commands

```bash
npm run dev                 # local development
npm run build               # production build
npm run check               # lint, type-check, build and tests
npm run db:create           # create the production D1 database
npm run r2:create           # create the production R2 bucket
npm run db:migrate:remote   # apply production database migrations
npm run deploy              # build and deploy the Worker
npm run secrets:generate    # generate private admin credentials
```

## Security model

The repository does not contain personal credentials. Admin authentication uses a private username, an HMAC password digest with a separate pepper, constant-time comparisons, a signed 12-hour `HttpOnly`, `Secure`, `SameSite=Strict` cookie and D1-backed lockout after five failed attempts. Write endpoints require the signed session and same-origin requests.

Read [SECURITY.md](SECURITY.md) for protections, deployment responsibilities and limitations. In particular, Cloudflare dashboard WAF rules, account MFA and backups cannot be enabled by repository code.

## Data and backups

- Content and analytics: Cloudflare D1
- Profile image and résumé: Cloudflare R2
- Source code: GitHub
- Secrets: Cloudflare encrypted secrets and your password manager

Export D1 and copy important R2 objects before destructive changes. See [Cloudflare setup](docs/CLOUDFLARE_SETUP.md).

## Open-source use

This is a self-hosted template, not a managed service. Every user deploys it to their own Cloudflare account and owns their data, domain, secrets, billing and maintenance. Issues and pull requests are welcome, but support and uptime are not guaranteed.

Licensed under the [MIT License](LICENSE).
