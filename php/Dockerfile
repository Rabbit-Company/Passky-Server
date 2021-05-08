FROM php:8.0-cli

COPY . /usr/src/app

WORKDIR /usr/src/app

RUN docker-php-ext-install pdo_mysql

EXPOSE 8080

CMD ["php", "-S", "0.0.0.0:8080"]