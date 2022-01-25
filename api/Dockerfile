FROM php:8.1.2-cli

# Copy all files in php folder to docker container
COPY src/ /usr/src/app

# Switch workdir
WORKDIR /usr/src/app

# Install Mysql extension for PHP
RUN docker-php-ext-install pdo_mysql

# Install dependencies
RUN apt-get update && apt-get install -y zip unzip git cron

# Install composer
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

# Copy composer.json to docker container
COPY composer.json /usr/src

# Install dependiencies from composer
RUN composer update -d /usr/src

# Expose port 8080 to other containers on the local network.
EXPOSE 8080

# Create json file for API Call Limiter and Tokens in /usr/src folder which can't be accessed by public
RUN echo "{}" > ../api-limiter.json
RUN echo "{}" > ../tokens.json

# Remove all daily cron tasks
RUN rm /etc/cron.daily/*

# Copy passky-daily-crontab script to cron.daily folder, so script will be executed every day
COPY passky-daily-crontab /etc/cron.daily/passky-daily-crontab
# Make script executable
RUN chmod +x /etc/cron.daily/passky-daily-crontab

# Copy starting script to etc folder
COPY passky-entrypoint.sh /etc/passky-entrypoint.sh
# Make script executable
RUN chmod +x /etc/passky-entrypoint.sh

# Start PHP server on port 8080
ENTRYPOINT ["/etc/passky-entrypoint.sh"]