# Ubuntu 22.04 Installation
This method allows you to install the server in a virtual machine, LXC container or bare hardware manually.

## Prerequisites

The following prerequisites are to be met:

  - The host is running an up-to-date Ubuntu 22.04
  - The host is connected to the internet
  - Either the host has a EDITOR variable set to the preferred text editor
  - The host have at least one free port that can be used to listen for http connections

To update Ubuntu 22.04 just run:

```sh
sudo apt update && sudo apt -y upgrade -y
[ -f /var/run/reboot-required ] && sudo reboot -f # optionally check if a reboot is necessary
```

After that initial reboot install some required tools:

```sh
sudo apt install curl
```

## Installing PHP 8.2

Ubuntu 22.04 repository contains a version of PHP too old, we will use a PPA:

The following is to be used only if no PPA have been added before:

```sh
sudo apt install -y lsb-release gnupg2 ca-certificates apt-transport-https software-properties-common
```

The add the proper PPA (remember to press enter):
```sh
sudo add-apt-repository ppa:ondrej/php
sudo apt update
```

The install php8.2 from the new PPA and the required+common extensions:
```sh
sudo apt install php8.2 php8.2-{bcmath,fpm,xml,mysql,zip,intl,ldap,gd,cli,bz2,curl,mbstring,pgsql,opcache,soap,cgi,redis}
```

## Installing the webserver
Install the nginx webserver:

```sh
sudo apt install nginx
```

and proceed to configure it:

```
$EDITOR /etc/nginx/sites-available/default
```

Remove everything from this file and put:

```
server {
        listen 80 default_server;
        listen [::]:80 default_server;

        server_name _; # <= this one can be set to your domain like: example.org

        root /var/www/html;
        
        charset utf-8;

        # Set max upload to 2048M
        client_max_body_size 2048M;

        # Healthchecks: Set /ping to be the healhcheck URL
        location /ping {
	          access_log off;

	          # set max 5 seconds for healthcheck
	          fastcgi_read_timeout 5s;

	          include        fastcgi_params;
	          fastcgi_param  SCRIPT_NAME     /ping;
	          fastcgi_param  SCRIPT_FILENAME /ping;
	          fastcgi_pass   127.0.0.1:9000;
        }

        # Have NGINX try searching for PHP files as well
        location / {
	        try_files $uri /index.php?$query_string;
        }

        location ~ \.php$ {
               include snippets/fastcgi-php.conf;
        
               # With php-fpm (or other unix sockets):
               fastcgi_pass unix:/run/php/php8.2-fpm.sock;
        }

        # additional config
        include /etc/nginx/server-opts.d/*.conf;
}
```

This was taken from docker/etc/nginx/site-opts.d/http.conf, ues that as a reference, but be warned that paths won't match!

After that just restart nginx and set it to auto-start at boot:

```sh
sudo systemctl restart nginx
sudo systemctl enable nginx
```

## Installing redis

To install redis run:
```sh
sudo apt install redis-server
```

## Installing MySQL
This can be skipped if you want to use a sqlite file as a database,
but make sure to make the necesary adjustments later on in the configuration step.

Install the server
```sh
sudo apt install mysql-server
```

And set it to auto-start at boot:
```sh
sudo systemctl enable --now mysql.service
```

After that configure MySQL:
```sh
sudo mysql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'password';
exit
sudo mysql_secure_installation # this will initially ask for a password... it's "password" remember to change it when prompted
```

In the configuration you can (and should) disable remote login for root and remove the anonymous user!

Next create a passky database and the relative user:
```sh
sudo mysql -u root -p -h localhost # use the password set before as the new root password
CREATE DATABASE passky; # this one will be set later on
exit
```

## Install cron

To install cron:

```sh
sudo apt install cron
sudo systemctl enable --now cron
contab -e
```

Insert in the text editor the following line at the end of file:

```
* * * * * curl http://localhost/cron.php
```

And remember that if you changed the HTTP server port you will need to set it here like so:

```
* * * * * curl http://localhost:8080/cron.php
```

After that save and close. Then restart the cron service:

```sh
sudo systemctl restart cron
```

## Installing composer

You will need composer later on to download passky dependencies.

Download the official up-to-date version of it:

```sh
cd /var/www
php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');" # download the installer
php composer-setup.php # run the installer
php -r "unlink('composer-setup.php');" # remove the installer
sudo mv composer.phar /usr/local/bin/composer # install globally
```

## Installing passky

To install passky you will need to download it first, and to do so you will need git. Install it:

```sh
sudo apt install git -y
```

Then download the application:

```sh
cd /var/www/
git clone https://github.com/Rabbit-Company/Passky-Server.git
cd Passky-Server
git branch my-setup # move to another branch
cp .env.example server/.env # grab the configuration file
$EDITOR server/.env # configure the service as you like it, just remember to change the ADMIN_USERNAME and change the ADMIN_PASSWORD
cd server
echo '{}' > data.json
sudo chown www-data:www-data data.json

# ------------------------------------------------------------------
# the following is only needed if you want to use sqlite database
mkdir databases
sudo chown www-data:www-data -R databases
#-------------------------------------------------------------------

composer update # update all dependencies

git add .env
git add data.json
git commit -m "my installation"
```

After that edit again the file /etc/nginx/sites-available/default and change the root to:

```
root /var/www/Passky-Server/server/src;
```

then restart nginx:

```sh
sudo systemctl restart nginx
```

## Test
