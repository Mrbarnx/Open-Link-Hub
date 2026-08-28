# Cloudflare setup guide

This guide keeps the application under your own Cloudflare account. GitHub stores the code; Cloudflare runs the Worker, D1 database and R2 file bucket.

## 1. Fork or deploy

Use the Deploy to Cloudflare button in the README, or fork the repository and clone it locally.

Install dependencies and authenticate Wrangler:

```bash
npm ci
npx wrangler login
```

## 2. Create storage

```bash
npm run db:create
npm run r2:create
```

The D1 command prints a `database_id`. Add it to the `DB` entry in `wrangler.jsonc`:

```jsonc
"database_id": "paste-the-generated-id-here"
```

Apply the schema:

```bash
npm run db:migrate:remote
```

## 3. Generate secrets

```bash
npm run secrets:generate
```

Save the printed username and password in a password manager. Add only these four runtime values to Cloudflare:

```bash
npx wrangler secret put ADMIN_USERNAME
npx wrangler secret put ADMIN_PASSWORD_DIGEST
npx wrangler secret put ADMIN_PASSWORD_PEPPER
npx wrangler secret put ADMIN_SESSION_SECRET
```

Paste the corresponding generated value after each command. Do not upload `ADMIN_PASSWORD`; it is only what you type at `/admin`.

## 4. Configure the site URL

Before the first production deployment, change `SITE_URL` in `wrangler.jsonc` from `https://example.com` to your final `https://yourdomain.com` origin. This controls canonical URLs, sitemap entries and structured SEO metadata.

## 5. Deploy

```bash
npm run deploy
```

Cloudflare prints a `workers.dev` address. Open `/admin`, sign in and replace the generic content.

## 6. Add a custom domain

In Cloudflare Dashboard:

1. Open **Workers & Pages** and choose the `open-link-hub` Worker.
2. Open **Settings → Domains & Routes → Add → Custom Domain**.
3. Enter the domain or subdomain, such as `links.example.com`.
4. If the domain was bought elsewhere, first add it to Cloudflare and use the nameservers Cloudflare provides.
5. Wait for DNS and the automatic TLS certificate to become active.
6. Update `SITE_URL` and deploy again.

## 7. GitHub automatic deployments

Connect the GitHub repository from Cloudflare Workers Builds. Use:

- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- Production branch: `main`

Create the four secrets in Cloudflare, not GitHub source files. If you use GitHub Actions instead, store the Cloudflare API token and account ID as GitHub Actions secrets.

## 8. Backups and updates

Before major changes:

```bash
npx wrangler d1 export open-link-hub-db --remote --output backup.sql
```

Download important R2 files from the Cloudflare dashboard. To update a fork, review upstream changes, back up data, apply new migrations, test, then deploy.

## Troubleshooting

- **Admin says temporarily unavailable:** one or more secrets or the D1 binding is missing.
- **Database table error:** run `npm run db:migrate:remote`.
- **Upload fails:** confirm the `BUCKET` R2 binding and bucket name.
- **SEO shows example.com:** update `SITE_URL` and redeploy.
- **Locked out:** wait 30 minutes or carefully remove your login-attempt row from D1.
