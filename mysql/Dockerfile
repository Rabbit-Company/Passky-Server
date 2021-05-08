FROM mysql:8.0

ENV MYSQL_DATABASE=passky
ENV MYSQL_USER=passky
ENV MYSQL_PASSWORD=uDWjSd8wB2HRBHei489o
ENV MYSQL_RANDOM_ROOT_PASSWORD=yes

COPY ./database.sql /database.sql

CMD ["mysqld", "--init-file=/database.sql"]