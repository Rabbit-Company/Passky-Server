# PHP to Bun upgrade

Passky Server 9 replaces the PHP implementation with a Bun server. The new image preserves the legacy API, the environment variables, and the database layout. Existing Passky Clients keep working without changes.

## Before the first upgrade

Back up the database even though the startup migration is additive:

```sh
cp -a databases "databases.backup.$(date +%Y%m%d-%H%M%S)"
```

For MySQL or MariaDB, create a consistent dump with your database provider's normal backup tooling.

## Upgrade

```sh
docker compose pull
docker compose down
docker compose up -d
```

Existing `.env` and `docker-compose.yml` files continue to work. `DATABASE_URL` is optional and takes precedence only when it is non-empty.

The PHP image stored SQLite databases in `/var/www/html/databases`, while the Bun image uses `/app/databases`. If your `docker-compose.yml` still mounts `./databases:/var/www/html/databases`, Passky detects it, keeps using that database, and prints a reminder at startup. Updating the volume to `./databases:/app/databases` is recommended but not required.

## What happens to stored data

- The `users`, `passwords`, and `licenses` tables keep their existing names and columns.
- End-to-end encrypted password fields are never decrypted or rewritten by the server.
- Existing bcrypt account hashes are left unchanged until a successful login proves the password.
- That successful login replaces only the verified bcrypt hash with Argon2id in the same `users.password` column.
- Argon2id parameters are embedded in the PHC string, so no destructive table migration is required.

## Behavior changes

- Sessions are not carried over. Clients sign in again after the upgrade.
- Daily maintenance runs inside the server. The `/cron.php` endpoint and external cron jobs are no longer needed.
- `/?action=getReport` is disabled by default and returns error `32`. Set `REPORTS_ENABLED=true` to expose it publicly again. Administrators always see the report in the admin interface.
- `/?action=getStats` is disabled by default and returns error `33`. Set `STATS_ENABLED=true` to expose server CPU, memory, and disk usage publicly again.
- Forwarded client-IP headers are only read from trusted proxies. Loopback and private networks are trusted by default. See [Reverse proxies and client IPs](../configuration.md#reverse-proxies-and-client-ips) for details.
- A wrong password now returns error `2` even when two-factor authentication is enabled, so the API no longer reveals whether an account uses 2FA.
- The bundled Redis, Nginx, PHP-FPM, and cron processes are gone. Redis is optional and only used when `REDIS_URL` or `REDIS_HOST` points to a reachable server. `REDIS_HOST` values in phpredis format such as `tlsv1.2://host` keep working.
- `REDIS_LOCAL_HOST`, `REDIS_LOCAL_PORT`, and `REDIS_LOCAL_PASSWORD` are no longer used and can be removed from `.env`.

## Shared hosting

The Bun server needs a process that stays running, which typical PHP shared hosting does not provide. Shared-hosting installations should move to Docker or a VPS before upgrading.

## Staying on Passky Server 8

`docker-compose.yml` uses the `latest` tag. To postpone the upgrade, set the image to `rabbitcompany/passky-server:8.1.8` until you are ready.

## Rollback

Do not roll back to PHP after users have logged into the Bun version: PHP's `password_verify` may not support the newly stored Argon2id settings on every old deployment. Restore the pre-upgrade database backup before starting `rabbitcompany/passky-server:8.1.8` again.
