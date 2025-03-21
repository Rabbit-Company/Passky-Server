FROM oven/bun:1-alpine

USER bun
WORKDIR /usr/src/app

COPY --chown=bun:bun package.json .npmrc ./
COPY --chown=bun:bun server/ ./server/

RUN bun i

EXPOSE 8080/tcp
ENTRYPOINT [ "bun", "run", "start" ]