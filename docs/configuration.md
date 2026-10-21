# Configuration

Passky Server is configured with environment variables. Copy [.env.example](../.env.example) to `.env`, or run `installer.sh` / `installerGUI.sh` to generate it. The Docker Compose files pass every supported variable from `.env` into the container.

## Database

`DATABASE_URL` takes precedence when it is set and accepts any Bun SQL connection string:

```dotenv
DATABASE_URL=sqlite:///app/databases/passky.db
DATABASE_URL=mysql://passky:secret@database:3306/passky
DATABASE_URL=postgresql://passky:secret@database:5432/passky
```

MariaDB uses a `mysql://` URL. When `DATABASE_URL` is empty, `DATABASE_ENGINE` (`sqlite` or `mysql`), `DATABASE_FILE`, and the `MYSQL_*` variables are used. Set `MYSQL_SSL=true` for providers that require TLS. `MYSQL_SSL_CA` points to the CA bundle used to verify the server.

SQLite databases are stored in `databases/` inside the working directory (`/app/databases` in Docker), which is created when missing. Containers started with a `docker-compose.yml` from Passky 8 mount the volume at `/var/www/html/databases`. Passky detects that location and keeps using it.

On startup Passky runs only additive `CREATE TABLE IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS` statements. It never rewrites or deletes existing tables. If the database rejects these statements (for example PlanetScale with safe migrations enabled), startup continues as long as the tables already exist.

`MYSQL_CACHE_MODE` controls how long `getInfo` caches the user and password counts. Values `0` and `1` cache them for one minute, and `2` or higher for twelve hours. Use `2` for databases billed by rows read.

## Reverse proxies and client IPs

Sign-in tokens and rate limits are bound to the client IP, so Passky must see the real visitor address.

If clients connect to Passky directly, set `TRUSTED_PROXIES=none`. If a reverse proxy runs in Docker or on the same LAN, leave `TRUSTED_PROXIES` empty, because loopback and private networks are trusted by default. For any other proxy, set `TRUSTED_PROXIES` to a comma-separated list of proxy IP addresses or CIDR ranges.

From trusted proxies Passky reads the `CF-Connecting-IP` header first, then `X-Real-IP`, then `X-Forwarded-For`.

### BurrowGate

With [BurrowGate](https://burrowgate.org/), set `BURROWGATE_ORIGIN_SECRET` to the site's origin signing secret from BurrowGate's site editor. Passky then rejects every request that BurrowGate did not sign with legacy error `999`. The client IP is taken from the signed `X-BurrowGate-Client-IP` header, and all forwarded IP headers are ignored. `/health` and `/metrics` stay reachable without a signature, so local health checks and metric scrapers keep working.

If Cloudflare sits in front of BurrowGate, configure BurrowGate to trust Cloudflare so the signed IP is the visitor's address rather than a Cloudflare edge address.

## Administrator interface

The administrator interface is served at `/`. Set `ADMIN_USERNAME` and `ADMIN_PASSWORD` to enable it. While `ADMIN_PASSWORD` is empty, the interface stays disabled. Sign-in attempts are limited to five per IP address every fifteen minutes, and a session lasts `ADMIN_SESSION_TTL` seconds after sign-in (one hour by default).

Set `CF_TURNSTILE_SITE_KEY` and `CF_TURNSTILE_SECRET_KEY` to protect the sign-in form with [Cloudflare Turnstile](https://www.cloudflare.com/products/turnstile/). Serve the interface over HTTPS. The session cookie is marked `Secure` when the request or the `X-Forwarded-Proto` header uses HTTPS.

## Password hashing

Passky clients send a hash of the master password, never the password itself. The server hashes it again with Argon2id before storing it. `ARGON2_MEMORY_COST` (KiB) and `ARGON2_TIME_COST` can be raised at any time. The parameters are stored in each hash, and accounts are rehashed with the new values at their next successful sign-in.

Accounts created by Passky 8 have bcrypt hashes. They keep working and are replaced with Argon2id at the account's next successful sign-in.

## Redis

Redis is optional. Without it, sign-in tokens are kept in memory and clients sign in again after a restart. To keep tokens across restarts, set `REDIS_URL` (`redis://` or `rediss://`), or `REDIS_HOST`, `REDIS_PORT`, and `REDIS_PASSWORD`. A `REDIS_HOST` starting with `tls://` connects over TLS.

## Email

Set `MAIL_ENABLED=true` and the `MAIL_*` variables to let users recover forgotten usernames by email. `MAIL_USE_TLS=true` connects with implicit TLS, usually on port 465.

## Rate limiting

With `LIMITER_ENABLED=true`, each API action can be called once per configured number of seconds from the same IP address. The `LIMITER_*` variables set the window for each action, and `-1` disables the limit for that action.

## Maintenance

Maintenance runs inside the server at startup and then daily. It expires premium accounts whose subscription has ended and refreshes the report shown in the administrator interface. No external cron job is needed.

## Reports

`/?action=getReport` returns daily registration counts and the number of active users. It is disabled by default and returns error `32`. Set `REPORTS_ENABLED=true` to expose it publicly. Administrators always see the report in the administrator interface.

## Observability

Set `METRICS_ENABLED=true` to expose OpenMetrics at `/metrics`, and set `METRICS_TOKEN` to require `Authorization: Bearer <token>`.

HTTP requests are logged without bodies or credentials. `LOG_PRESET` can be `minimal`, `standard`, `detailed`, or `debug`. To send logs to Grafana Loki, set `LOKI_URL`, and `LOKI_USERNAME` and `LOKI_PASSWORD` if your Loki instance requires them.

`/health` returns `{"status":"success"}` and is used by the Docker health check.
