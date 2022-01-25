#!/bin/bash

# Write all ENV variables to a file
printenv | sed 's/^\(.*\)$/export \1/g' > /root/project_env.sh
# Makes script executable
chmod +x /root/project_env.sh
# Start Cron to execute backup script every day
service cron start
# Start SQL server
./usr/local/bin/docker-entrypoint.sh mariadbd