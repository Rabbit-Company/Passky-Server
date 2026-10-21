FROM oven/bun:1.4.3-alpine

LABEL maintainer="Rabbit Company (info@rabbit-company.com)"

USER root

WORKDIR /app

RUN apk add --no-cache ca-certificates

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

COPY src/ ./src/

RUN mkdir -p /app/databases

EXPOSE 80

VOLUME ["/app/databases"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD bun -e 'const response = await fetch(`http://127.0.0.1:${process.env.SERVER_PORT || 80}/health`); process.exit(response.ok ? 0 : 1)'

CMD ["bun", "src/index.ts"]
