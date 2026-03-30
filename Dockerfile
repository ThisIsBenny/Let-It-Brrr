FROM denoland/deno:2.7.9

ARG VERSION=0.0.0

WORKDIR /app

RUN echo $VERSION > /app/VERSION

RUN groupadd --system --gid 1000 appgroup && \
    useradd --system --uid 1000 --gid 1000 appuser

RUN mkdir -p /app/.deno && chown -R appuser:appgroup /app

COPY deno.json ./

COPY src/ ./src/
COPY config/ ./config/

ENV DENO_DIR=/app/.deno
ENV MAPPINGS_FILE=/app/config/mappings.yaml

RUN deno cache src/main.ts

USER appuser

EXPOSE 8080

CMD ["deno", "task", "start"]
