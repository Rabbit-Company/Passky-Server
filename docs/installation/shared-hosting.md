# Shared Hosting Installation
It is essential to ensure that your hosting provider meets all necessary requirements prior to proceeding with the installation. This will help to ensure a smooth and successful implementation.

## 1. Requirments

- [PHP 8.2+](https://php.net)
- Database ([SQLite](https://www.sqlite.org/index.html), [MySQL](https://www.mysql.com/) or [MariaDB](https://mariadb.org/))
- [Composer](https://getcomposer.org/)
- [Redis](https://redis.io/) (optional)
- Mail Server (optional)

## 2. Passky Server Installation

> ⚠️ It is important to note that when installing the Passky Server, only the data contained within the `server/src` folder should be made publicly accessible. Any other data should be kept secure and protected.

1. To begin the installation process for the Passky Server, navigate to the root directory of your hosting, download the [Passky Server](https://github.com/Rabbit-Company/Passky-Server) and save it in a folder named `Passky-Server`.

2. In order to prepare the server for the installation process, open a terminal and navigate to the `Passky-Server` folder by executing the command: `cd Passy-Server`. Then execute the following commands in sequence:
```yaml
./installer.sh # or just copy `.env.example` into `server/.env` and make the proper changes that suit you.
./shared-hosting-finalization.sh 
```

3. To ensure proper functionality, it is necessary to create a sub-domain, `passky.yourdomain.com`, that points to the `Passky-Server/server/src` directory.

4. Execute the `/cron.php` API endpoint at least once. This is crucial as it will create necessary tables if they do not already exist. To ensure ongoing maintenance, configure your hosting provider's cron job scheduler to run this endpoint at least once per day.

5. Upon completion of the installation process, the admin panel for the Passky Server can be accessed via the URL `passky.yourdomain.com`. Additionally, various clients such as the [Desktop Application](https://github.com/Rabbit-Company/Passky-Desktop), [Web Browser](https://github.com/Rabbit-Company/Passky-Website), [Browser Extension](https://github.com/Rabbit-Company/Passky-Browser-Extension), and [Android Application](https://github.com/Rabbit-Company/Passky-Android) can be connected to the Passky Server.

## 3. Passky Website Installation (Optional)

> ℹ️ The Passky Website is a client-side only application and as such, it does not require any server-side code for its operation. As a result, it can be hosted for free on [Cloudflare Pages](https://pages.cloudflare.com/).

1. Create a sub-domain specifically for the Passky Website, for example, `vault.yourdomain.com`.

2. Once the sub-domain is created, a new folder should appear in the root directory, named `vault` or `vault.yourdomain.com`.

3. [Download the latest version of the Passky Website from the official GitHub repository](https://github.com/Rabbit-Company/Passky-Website/releases/latest/download/passky-website.zip) and extract it to the previously created folder.

4. Access the URL `vault.yourdomain.com` to view the newly installed Passky Website. It is recommended to verify that the website is functional and that all required components are properly configured.

> ⚠️ When deploying the Passky Website, it is essential to ensure that appropriate security measures are in place. If not utilizing Cloudflare Pages, it is recommended that all relevant [security headers](https://github.com/Rabbit-Company/Passky-Website/blob/main/website/_headers) are properly implemented to protect against potential vulnerabilities.