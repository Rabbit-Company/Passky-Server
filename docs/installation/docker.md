# Docker Installation

Docker installation requires VPS or a dedicated server.

> [Hetzner](https://hetzner.cloud/?ref=Oflj8ToDXPAI) is a great hosting provider with high performance, affordable prices, user-friendly control panel, 24/7 support, and a 20€ free credit when you sign up using our affiliate link: https://hetzner.cloud/?ref=Oflj8ToDXPAI. We are using Hetzner to host our Passky Servers.

## 1. Docker Installation

> ⚠️ Skip if Docker with the Compose plugin is already installed.

#### Debian, Ubuntu & Raspberry Pi OS (x64 & arm64)

```sh
# Install Docker and the Docker Compose plugin
curl -sSL https://get.docker.com/ | CHANNEL=stable bash
# Start Docker on boot
sudo systemctl enable --now docker
```

## 2. Passky Server Installation

Passky Server is written in TypeScript and runs on [Bun](https://bun.com/), which serves HTTP and schedules daily maintenance itself. It stores data in [SQLite](https://www.sqlite.org/), [MySQL](https://www.mysql.com/), [MariaDB](https://mariadb.org/), or [PostgreSQL](https://www.postgresql.org/).

The default [docker-compose.yml](https://github.com/Rabbit-Company/Passky-Server/blob/main/docker-compose.yml) uses SQLite for the easiest installation. You can also use an external SQL provider and, optionally, a Redis-compatible service.

#### Debian, Ubuntu & Raspberry Pi OS (x64 & arm64)

```sh
# Download required files
wget https://github.com/Rabbit-Company/Passky-Server/releases/latest/download/passky-server.tar.xz
tar -xf passky-server.tar.xz
cd passky-server
# Make installers executable
chmod +x installer.sh installerGUI.sh
# Start the GUI installer
./installerGUI.sh
# After completing the installer, create the container
sudo docker compose up -d
```

The installer only creates the `.env` file. You can also copy `.env.example` to `.env` and edit it by hand. The [configuration reference](https://github.com/Rabbit-Company/Passky-Server/blob/main/docs/configuration.md) describes every setting.

Passky Server listens on **port 8080** by default. You can change it by editing the `ports` section of `docker-compose.yml`.

## 3. Passky Website Installation (Optional)

> ℹ️ The Passky Website is a client-side only application and as such, it does not require any server-side code for its operation. As a result, it can be hosted for free on [Cloudflare Pages](https://pages.cloudflare.com/).

#### Debian, Ubuntu & Raspberry Pi OS (x64 & arm64)

```sh
# Download docker-compose.yml file from GitHub
wget https://raw.githubusercontent.com/Rabbit-Company/Passky-Website/main/docker-compose.yml
# Start the container
sudo docker compose up -d
```

The website for the Passky is designed to be deployed on **port 8081** by default. However, it is important to note that this can be modified to a different port as per your requirements, by editing the appropriate settings in the `docker-compose.yml` file.

## 4. Security

Passky Server does not terminate TLS itself. Before exposing it to the internet, place it behind a reverse proxy such as [BurrowGate](https://burrowgate.org/) that serves HTTPS, so all traffic between clients and the server is encrypted.

Sign-in tokens and rate limits are bound to the client's IP address, so the server must see the real visitor address through your proxy. Read [Reverse proxies and client IPs](https://github.com/Rabbit-Company/Passky-Server/blob/main/docs/configuration.md#reverse-proxies-and-client-ips) to configure `TRUSTED_PROXIES` or `BURROWGATE_ORIGIN_SECRET` for your setup.

Set a long, randomly generated `ADMIN_PASSWORD` to enable the administrator interface, or leave it empty to keep the interface disabled.
