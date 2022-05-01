#!/bin/bash

# Write all ENV variables to a file
printenv | sed 's/^\(.*\)$/export \1/g' > /root/project_env.sh
# Makes script executable
chmod +x /root/project_env.sh
# Insert your database name to database.sql file
sed -i "s/MYSQL_DATABASE/$MYSQL_DATABASE/" /docker-entrypoint-initdb.d/database.sql
# Start Cron to execute backup script every day
service cron start
# Start SQL server
./usr/local/bin/docker-entrypoint.sh mariadbd