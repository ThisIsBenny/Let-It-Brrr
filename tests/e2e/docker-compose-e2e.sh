#!/bin/bash
set -e

echo "=== Docker Compose E2E Test ==="
echo ""

COMPOSE_FILE="docker-compose.yml"
START_TIMEOUT=30
HEALTH_TIMEOUT=5
WEBHOOK_TIMEOUT=2
DOWN_TIMEOUT=10

cleanup() {
    echo ""
    echo "=== Cleanup ==="
    docker compose -f "$COMPOSE_FILE" down -v --remove-orphans 2>/dev/null || true
}

trap cleanup EXIT

cleanup

echo "=== SC-001: docker compose up -d ==="
START_TIME=$(date +%s)
docker compose -f "$COMPOSE_FILE" up -d --build
END_TIME=$(date +%s)
ELAPSED=$((END_TIME - START_TIME))

if [ $ELAPSED -le $START_TIMEOUT ]; then
    echo "✓ Service started in ${ELAPSED}s (limit: ${START_TIMEOUT}s)"
else
    echo "✗ Service failed to start within ${START_TIMEOUT}s"
    exit 1
fi

echo ""
echo "=== SC-002: Health check ==="
HEALTH_START=$(date +%s)
while true; do
    HEALTH_END=$(date +%s)
    HEALTH_ELAPSED=$((HEALTH_END - HEALTH_START))

    if [ $HEALTH_ELAPSED -gt $HEALTH_TIMEOUT ]; then
        echo "✗ Health check timeout after ${HEALTH_TIMEOUT}s"
        exit 1
    fi

    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health 2>/dev/null || echo "000")

    if [ "$HTTP_CODE" = "200" ]; then
        echo "✓ Health endpoint returned 200 after ${HEALTH_ELAPSED}s"
        break
    fi

    echo "  Waiting for health... (${HEALTH_ELAPSED}s)"
    sleep 1
done

echo ""
echo "=== SC-003: Webhook delivery ==="
WEBHOOK_START=$(date +%s)
RESPONSE=$(curl -s -X POST http://localhost:8000/webhook/fluxcd-generic \
    -H "Content-Type: application/json" \
    -d '{"type":"Alert","metadata":{"name":"flux-system"},"level":"error","reason":"Test","message":"E2E test from compose"}')
WEBHOOK_END=$(date +%s)
WEBHOOK_ELAPSED=$((WEBHOOK_END - WEBHOOK_START))

echo "Response: $RESPONSE"
echo "Duration: ${WEBHOOK_ELAPSED}s"

if echo "$RESPONSE" | grep -q "forwarded"; then
    echo "✓ Webhook forwarded successfully in ${WEBHOOK_ELAPSED}s (limit: ${WEBHOOK_TIMEOUT}s)"
else
    echo "✗ Webhook delivery failed"
    exit 1
fi

echo ""
echo "=== SC-004: docker compose down ==="
DOWN_START=$(date +%s)
docker compose -f "$COMPOSE_FILE" down
DOWN_END=$(date +%s)
DOWN_ELAPSED=$((DOWN_END - DOWN_START))

if [ $DOWN_ELAPSED -le $DOWN_TIMEOUT ]; then
    echo "✓ Service stopped in ${DOWN_ELAPSED}s (limit: ${DOWN_TIMEOUT}s)"
else
    echo "✗ Service stop timeout after ${DOWN_TIMEOUT}s"
    exit 1
fi

echo ""
echo "=== All E2E tests passed ==="
