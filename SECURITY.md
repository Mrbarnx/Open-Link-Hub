# Security

## Included protections

- Admin secrets are runtime environment variables and are never embedded in client JavaScript.
- Password verification uses HMAC-SHA-256 with a separate random pepper.
- Session cookies are signed, expire after 12 hours and use `HttpOnly`, `Secure`, `SameSite=Strict` and the `__Host-` prefix.
- Login failures are throttled in D1 by a SHA-256 key derived from IP and attempted username. Raw IP addresses are not stored.
- Five failed attempts in the active window trigger a 30-minute lockout.
- Admin write routes require a valid signed session and a same-origin request.
- Request sizes, field lengths, URL protocols and uploaded file signatures are validated server-side.
- PDF, JPG, PNG and WebP uploads are restricted by type, magic bytes and size.
- Security headers include CSP, HSTS, frame denial, MIME sniffing protection, restrictive permissions and admin no-index directives.
- Analytics accepts only same-origin events, validates payloads and stores no names, emails or raw IP addresses.

## Owner responsibilities

Repository code cannot configure every account-level protection. After deployment:

1. Enable MFA on GitHub and Cloudflare.
2. Keep the repository's secret-scanning and dependency alerts enabled.
3. Add Cloudflare WAF/rate-limiting rules for `/admin*` and `/api/admin/*` if your plan supports them.
4. Rotate admin secrets after accidental exposure or collaborator changes.
5. Back up D1 and R2 before major upgrades.
6. Review dependency alerts and redeploy security updates.

The included CSP permits inline scripts and styles because the current Vinext/React output requires them. This is documented as a limitation; future versions can move to nonce-based CSP when the runtime supports it cleanly.

## Reporting a vulnerability

Do not publish credentials or exploit details in a public issue. Contact the repository owner privately through their GitHub profile and allow reasonable time for investigation.
