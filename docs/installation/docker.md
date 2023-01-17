# Docker Installation
Docker installation requires VPS or a dedicated server.

> [Hetzner](https://hetzner.cloud/?ref=Oflj8ToDXPAI) is a great hosting provider with high performance, affordable prices, user-friendly control panel, 24/7 support, and a 20€ free credit when you sign up using our affiliate link: https://hetzner.cloud/?ref=Oflj8ToDXPAI. We are using Hetzner to host our Passky Servers.

## 1. Docker Installation
> ⚠️ Skip if docker and docker-compose is already installed.

#### Debian & Ubuntu (x64)
```yaml
# Install docker
curl -sSL https://get.docker.com/ | CHANNEL=stable bash
# Start docker on boot
sudo systemctl enable --now docker
# Install docker compose
sudo apt install docker-compose -y
```
#### Raspberry Pi OS (arm64)
```yaml
# Install docker
curl -sSL https://get.docker.com/ | CHANNEL=stable bash
# Start docker on boot
sudo systemctl enable --now docker
# Install docker compose
sudo apt-get install libffi-dev libssl-dev
sudo apt install python3-dev
sudo apt-get install -y python3 python3-pip
sudo pip3 install docker-compose
```

## 2. Passky Server Installation
Passky Server uses [PHP](https://www.php.net/) for backend code execution, [Cron](https://en.wikipedia.org/wiki/Cron) to schedule jobs, [Redis](https://redis.io/) for temporary data storage (cache) and [MySQL](https://www.mysql.com/), [MariaDB](https://mariadb.org/) or [SQLite](https://www.sqlite.org/) for permanent data storage.

Default [docker-compose.yml](https://github.com/Rabbit-Company/Passky-Server/blob/main/docker-compose.yml) file includes [PHP](https://www.php.net/), [Cron](https://en.wikipedia.org/wiki/Cron), [Redis](https://redis.io/) and [SQLite](https://www.sqlite.org/) for the easiest installation.

You can also use external services like [PlanetScale](https://planetscale.com/) as database provider, [UpStash](https://upstash.com/) as [Redis](https://redis.io/) provider or even [EasyCron](https://www.easycron.com/) to execute daily cron jobs.

#### Debian & Ubuntu & Raspberry Pi OS (x64 & arm64)
```yaml
# Download required files
wget https://github.com/Rabbit-Company/Passky-Server/releases/latest/download/passky-server.tar.xz
tar -xf passky-server.tar.xz
cd passky-server
# Makes installers executable
chmod +x installer.sh installerGUI.sh
# Start the GUI installer
./installerGUI.sh
# After you complete with installer you can create containers with below command
sudo docker-compose up -d
```

The admin panel for the Passky is designed to be deployed on port 8080 by default. However, it is important to note that this can be modified to a different port as per your requirements, by editing the appropriate settings in the `docker-compose.yml` file.

## 3. Passky Website Installation (Optional)

> ℹ️ The Passky Website is a client-side only application and as such, it does not require any server-side code for its operation. As a result, it can be hosted for free on [Cloudflare Pages](https://pages.cloudflare.com/).

#### Debian & Ubuntu & Raspberry Pi OS (x64 & arm64)
```yaml
# Download docker-compose.yml file from GitHub
wget https://raw.githubusercontent.com/Rabbit-Company/Passky-Website/main/docker-compose.yml
# Start the container
docker-compose up -d
```

The website for the Passky is designed to be deployed on port 8080 by default. However, it is important to note that this can be modified to a different port as per your requirements, by editing the appropriate settings in the `docker-compose.yml` file.

## 4. Security

When deploying the Passky Server and Passky Website, it is crucial to prioritize security and implement robust measures to protect against potential vulnerabilities. While utilizing Docker for installation does include certain security enhancements, it is important to note that client-server communication may not be fully encrypted by default. To address this, it is recommended to implement a proxy manager such as [Nginx Proxy Manager](https://nginxproxymanager.com/) to properly configure and manage SSL certificates, ensuring that all data transmitted between the client and server is properly encrypted.