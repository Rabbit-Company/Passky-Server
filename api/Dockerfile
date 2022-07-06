FROM php:8.1-apache

# Copy all files in php folder to docker container
COPY src/ /var/www/html/

# Switch workdir
WORKDIR /var/www/html/

# Install Mysql extension for PHP
RUN docker-php-ext-install pdo_mysql

# Install dependencies
RUN apt-get update && apt-get install -y zip unzip git cron

# Install composer
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

# Copy composer.json to docker container
COPY composer.json /var/www

# Install dependiencies from composer
RUN composer update -d /var/www

# Copy php.ini to the docker container
COPY php.ini $PHP_INI_DIR

# Create json file for API Call Limiter and Tokens in /var/www folder which can't be accessed by public
RUN echo "{}" > ../api-limiter.json
RUN echo "{}" > ../tokens.json

# Give files permissions
RUN chmod -R 777 /var/www

# Copy passky-daily-crontab script to cron.daily folder, so script will be executed every day
COPY passky-daily-crontab /etc/cron.daily/passky-daily-crontab
# Make script executable
RUN chmod +x /etc/cron.daily/passky-daily-crontab

# Remove daily cron jobs, that are not needed
RUN rm /etc/cron.daily/apt-compat /etc/cron.daily/dpkg /etc/cron.daily/exim4-base

# Start cron
RUN sed -i 's/^exec /service cron start\n\nexec /' /usr/local/bin/apache2-foreground