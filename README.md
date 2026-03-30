# Let-It-Brrr

[![CI](https://github.com/ThisIsBenny/Let-It-Brrr/actions/workflows/ci.yml/badge.svg)](https://github.com/ThisIsBenny/Let-It-Brrr/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/ThisIsBenny/Let-It-Brrr?include_prereleases&label=Latest)](https://github.com/ThisIsBenny/Let-It-Brrr/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A webhook middleware that transforms any payloads to work with the [Brrr](https://brrr.now) API.

## Overview

Let-It-Brrr receives webhooks from various sources, transforms their payloads using customizable mappings, and forwards them to the Brrr notification API. This allows you to integrate any webhook source with Brrr without modifying your existing systems.

## Features

- **Customizable Payload Mapping**: Define how incoming payloads should be transformed to match Brrr's expected format.
- **Default Values**: Set default values for fields that may not be present in the incoming payload.

## Quick Start

### 1. Pull the Docker image

```bash
docker pull ghcr.io/thisisbenny/let-it-brrr:latest
```

### 2. Configure your mappings

Create a `mappings.yaml` file:

```yaml
mappings:
  my-fluxcd-alerts:
    brrr_fields:
      - field_expression: "message"
        target_field: "message"
      - field_expression: "involvedObject.name"
        target_field: "subtitle"
    default_values:
      title: "FluxCD Alert"
```

### 3. Run the container

```bash
docker run -d \
  --name let-it-brrr \
  -p 8080:8080 \
  -e BRRR_SECRET=your_brrr_secret_here \
  -v ./mappings.yaml:/app/config/mappings.yaml \
  ghcr.io/thisisbenny/let-it-brrr:latest
```

Send a test webhook:

```bash
curl -X POST http://localhost:8080/webhook/my-fluxcd-alerts \
  -H "Content-Type: application/json" \
  -d '{"message": "Deployment successful", "involvedObject": {"name": "my-app"}}'
```

## Docker

### Image

```
ghcr.io/thisisbenny/let-it-brrr
```

### Tags

| Tag | Description |
|-----|-------------|
| `latest` | Most recent release |
| `v*.*.*` | Specific semantic version (e.g., `v0.1.0`) |

### Architectures

- `linux/amd64`
- `linux/arm64`

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `BRRR_SECRET` | Yes | - | Secret for Brrr API authentication |
| `MAPPINGS_FILE` | Yes | `/app/config/mappings.yaml` | Path to mappings configuration |
| `LOG_LEVEL` | No | `INFO` | Logging level (DEBUG, INFO, WARN, ERROR) |

### Mappings Configuration

The `mappings.yaml` file defines how webhook payloads are transformed:

```yaml
mappings:
  <mapping-id>:
    brrr_fields:
      - field_expression: "json.path.to.field"    # JSON path or template in incoming webhook
        target_field: "target_field_name"           # Field name for Brrr API
      - field_expression: "prefix - {{otherField}}"  # Template with {{}} embedding
        target_field: "target_field_name"           # Result field name for Brrr API
    default_values:
      <field_name>: <default_value>                 # Fallback if field_expression result is empty
```

**Template Syntax:** Use `{{jsonPath}}` within `target_field` to embed dynamic values from the webhook payload.

```yaml
target_field: "prefix - {{involvedObject.name}}"
# Result if involvedObject.name = "my-app": "prefix - my-app"
```

#### Example: FluxCD

```yaml
mappings:
  fluxcd-generic:
    brrr_fields:
      - field_expression: "message"
        target_field: "message"
      - field_expression: "FluxCD - {{involvedObject.kind}}"
        target_field: "title"
      - field_expression: "involvedObject.name"
        target_field: "subtitle"
```

## API

### Endpoints

#### `GET /health`

Health check endpoint.

**Response:**
```json
{ "status": "ok", "mappings_count": 2, "version": "1.0.0" }
```

**Fields:**
- `status` - Always "ok" when healthy
- `mappings_count` - Number of configured mappings
- `version` - Application version (from git tag or "0.0.0" if not available)

#### `POST /webhook/:mappingId`

Receive and transform webhooks.

**Path Parameters:**
- `mappingId` - The mapping configuration to use

**Request:**
- `Content-Type: application/json`
- Body: Webhook payload

**Response:**
```json
{ "status": "forwarded", "mapping_id": "my-mapping" }
```

**Error Responses:**
- `400` - Invalid JSON or missing Content-Type
- `404` - Mapping not found
- `502` - Brrr API error

## Security

### No Built-in Authentication

**Important**: Let-It-Brrr does not have built-in authentication. The service is designed to be deployed behind network protection layers and should never be exposed directly to the internet without additional security measures.

### Protection Recommendations

To safely deploy Let-It-Brrr, use one or more of the following protection mechanisms:

- **Network Restrictions**: Deploy behind a firewall or VPN to limit access to trusted networks only
- **Reverse Proxy with Authentication**: Place a reverse proxy (such as nginx, Traefik, or Cloudflare Tunnel) in front of Let-It-Brrr that handles authentication
- **IP Allowlisting**: Configure firewall rules to only allow incoming webhooks from known IP addresses

### Mapping ID Security

Mapping IDs (the `<mapping-id>` in webhook URLs) act as a minimal form of security through obscurity. **Use randomly generated, unpredictable mapping IDs** (e.g., UUIDs) rather than descriptive names like `my-fluxcd-alerts`.

**Example of a secure mapping ID:**

```yaml
mappings:
  a7f3b2c1-9e45-4d8f-b123-456789abcdef:
    brrr_fields:
      - field_expression: "message"
        target_field: "message"
    default_values:
      title: "Alert"
```

**Do NOT use predictable mapping IDs** that could be guessed by unauthorized parties.

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

### Development

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Running Tests

```bash
deno test
```

### Running Lint

```bash
deno lint
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
