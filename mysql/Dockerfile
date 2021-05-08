FROM mariadb:latest

RUN mkdir -p /usr/src/app

COPY . /usr/src/app

WORKDIR /usr/src/app/mysql

RUN mysql -u passky -puDWjSd8wB2HRBHei489o passky < database.sql