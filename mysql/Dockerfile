FROM mysql:8.0

COPY . /usr/src/app

WORKDIR /usr/src/app

CMD ["mysqld", "--init-file=database.sql"]