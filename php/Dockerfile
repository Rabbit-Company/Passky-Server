FROM php:8.0-cli

COPY ./Database.php /usr/src/app/
COPY ./Display.php /usr/src/app/
COPY ./Errors.php /usr/src/app/
COPY ./index.php /usr/src/app/

WORKDIR /usr/src/app

RUN docker-php-ext-install pdo_mysql

EXPOSE 8080

CMD ["php", "-S", "0.0.0.0:8080"]