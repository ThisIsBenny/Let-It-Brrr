FROM denoland/deno:2.0.0

WORKDIR /app

COPY deno.json ./

COPY src/ ./src/
COPY config/ ./config/

EXPOSE 8080

ENV PORT=8080
ENV MAPPINGS_FILE=/app/config/mappings.yaml

CMD ["deno", "task", "start"]