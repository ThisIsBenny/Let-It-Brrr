FROM denoland/deno:2.7.9

WORKDIR /app

RUN groupadd --system --gid 1000 appgroup && \
    useradd --system --uid 1000 --gid 1000 appuser

RUN mkdir -p /app/.deno && chown -R appuser:appgroup /app

COPY deno.json ./

COPY src/ ./src/
COPY config/ ./config/

RUN deno cache src/main.ts

USER appuser

EXPOSE 8080

ENV MAPPINGS_FILE=/app/config/mappings.yaml
ENV DENO_DIR=/app/.deno

CMD ["deno", "task", "start"]
