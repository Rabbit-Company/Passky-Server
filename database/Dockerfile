FROM mariadb:latest

# Copy database.sql file to /docker-entrypoint-initdb.d/ folder
COPY database.sql /docker-entrypoint-initdb.d/

# Install zip unzip openssh-client sshpass and cron for Backups
RUN apt-get update && apt-get install -y zip unzip cron sshpass openssh-client

# Copy starting script to etc folder
COPY passky-entrypoint.sh /etc/
# Make script executable
RUN chmod +x /etc/passky-entrypoint.sh

# Remove all daily cron tasks
RUN rm /etc/cron.daily/*

# Copy script to cron.daily folder that will be executed every day
COPY passky-daily-crontab /etc/cron.daily/
# Makes script executable
RUN chmod +x /etc/cron.daily/passky-daily-crontab

# Start MariaDB and Cron
ENTRYPOINT ["/etc/passky-entrypoint.sh"]