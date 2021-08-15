FROM php:8.0-cli

# Copy all files in php folder to docker container
COPY ./php /usr/src/app

# Switch workdir
WORKDIR /usr/src/app

# Install Mysql extension for PHP
RUN docker-php-ext-install pdo_mysql

# Install dependencies
RUN apt-get update && apt-get install -y zip unzip git cron

# Install composer
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

# Install dependiencies from composer
RUN composer update

# Expose port 8080 to other containers on the local network.
EXPOSE 8080

# Create json file for API Call Limiter and OTP in /usr/src folder which can't be accessed by public
RUN echo "{}" > ../api-limiter.json
RUN echo "{}" > ../otp.json

# Disable apt-compat in daily cron jobs
RUN mv /etc/cron.daily/apt-compat /etc/cron.daily/apt-compat.disabled

# Copy passky-daily-crontab script to cron.daily folder, so script will be executed every day
COPY passky-daily-crontab /etc/cron.daily/passky-daily-crontab
# Make script executable
RUN chmod +x /etc/cron.daily/passky-daily-crontab

# Start PHP server on port 8080
CMD ["php", "-S", "0.0.0.0:8080"]