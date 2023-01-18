FROM mariadb:10.9

# Install zip unzip openssh-client sshpass and cron for Backups
RUN apt-get update && apt-get install -y zip unzip cron sshpass openssh-client

# Copy starting script to etc folder
COPY passky-entrypoint.sh /etc/
# Make script executable
RUN chmod +x /etc/passky-entrypoint.sh

# Remove all daily cron tasks
RUN rm /etc/cron.daily/*

# Start MariaDB and Cron
ENTRYPOINT ["/etc/passky-entrypoint.sh"]