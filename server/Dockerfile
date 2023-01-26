FROM serversideup/php:8.2-fpm-nginx-v2.1.0

LABEL maintainer="Rabbit Company (info@rabbit-company.com)"

# Copy files to docker container
COPY src/ /var/www/html/public/
COPY composer.json /var/www/html/
COPY composer.lock /var/www/html/

# Install dependiencies from composer
RUN composer install -d /var/www/html/

# Create json file for Temp data
RUN echo '{}' > /var/www/html/data.json

# Create database folder for SQLite databases
RUN mkdir /var/www/html/databases

# Install redis and cron
RUN apt-get update && apt-get -y --no-install-recommends install \
redis-server \
cron

# Clean the cache and temp files
RUN apt-get clean \
&& rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* /usr/share/doc/*

# Configure Job Scheduler (Cron)
COPY passky-cron /etc/cron.d/passky
RUN chmod 0644 /etc/cron.d/passky
RUN crontab /etc/cron.d/passky

# Configure S6-Overlay
COPY docker/etc/s6-overlay /etc/s6-overlay/
RUN chmod 755 -R /etc/s6-overlay && chmod +x /etc/s6-overlay/scripts/*

COPY docker/etc/nginx /etc/nginx

# Configure PHP
COPY php.ini /etc/php/current_version/fpm/
RUN sed -i '/session.cookie_secure/d' /etc/php/current_version/fpm/pool.d/y-override-php-defaults.conf

# Remove scripts
RUN rm /etc/s6-overlay/scripts/laravel-automations \
&& rm -rf /etc/s6-overlay/s6-rc.d/laravel-automations \
&& rm -rf /etc/s6-overlay/s6-rc.d/user/contents.d/laravel-automations \
&& rm /etc/s6-overlay/scripts/msmtp \
&& rm -rf /etc/s6-overlay/s6-rc.d/msmtp \
&& rm -rf /etc/s6-overlay/s6-rc.d/user/contents.d/msmtp

# Remove default security headers
RUN rm /etc/nginx/server-opts.d/security.conf

# Set owner, group and permissions
RUN chown -R 1000:1000 /var/www/html \
&& chmod 755 -R /var/www/html