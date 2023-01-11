FROM serversideup/php:8.2-fpm-nginx-v2.1.0

LABEL maintainer="Rabbit Company (info@rabbit-company.com)"

# Copy files to docker container
COPY src/ /var/www/html/public/
COPY composer.json /var/www/html/
COPY .tmp/database.mysql.sql /var/www/html/
COPY .tmp/database.sqlite.sql /var/www/html/

# Install dependiencies from composer
RUN composer update -d /var/www/html/

# Create json file for Temp data
RUN echo '{}' > /var/www/html/data.json

# Install redis and cron
RUN apt-get update && apt-get -y --no-install-recommends install \
redis-server \
cron

# Clean the cache and temp files
RUN apt-get clean \
&& rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* /usr/share/doc/*

# Configure Job Scheduler (Cron)
COPY passky-daily-crontab /etc/cron.hourly/passky-daily-crontab
RUN chmod +x /etc/cron.hourly/passky-daily-crontab

# Configure S6-Overlay
COPY docker/etc/s6-overlay /etc/s6-overlay/
RUN chmod 755 -R /etc/s6-overlay && chmod +x /etc/s6-overlay/scripts/*

COPY docker/etc/nginx /etc/nginx

# Configure PHP
COPY php.ini /etc/php/current_version/fpm/

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
RUN chown -R 9999:9999 /var/www/html \
&& chmod 755 -R /var/www/html