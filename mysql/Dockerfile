FROM mariadb:10.7.1

# Copy database.sql file to /docker-entrypoint-initdb.d/ folder
COPY ./mysql/database.sql /docker-entrypoint-initdb.d/

# Install zip unzip openssh-client sshpass and cron for Backups
RUN apt-get update && apt-get install -y zip unzip cron sshpass openssh-client

# Copy starting script to etc folder
COPY ./scripts/passky-entrypoint-backup.sh /etc/passky-entrypoint-backup.sh
# Make script executable
RUN chmod +x /etc/passky-entrypoint-backup.sh

# Remove all daily cron tasks
RUN rm /etc/cron.daily/*

# Copy script to cron.daily folder that will be executed every day
COPY ./scripts/passky-daily-crontab-backup /etc/cron.daily/passky-daily-crontab-backup
# Makes script executable
RUN chmod +x /etc/cron.daily/passky-daily-crontab-backup

# Start MariaDB and Cron
ENTRYPOINT ["/etc/passky-entrypoint-backup.sh"]