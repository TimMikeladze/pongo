# Monitor Implementation Guide

This directory contains monitor definitions for Pongo. Each monitor is a TypeScript file that exports a monitor configuration using the `monitor()` helper.

## Table of Contents

- [Basic Structure](#basic-structure)
- [Monitor Patterns](#monitor-patterns)
  - [Simple HTTP Check](#1-simple-http-check)
  - [Status API Monitoring](#2-status-api-monitoring)
  - [Response Time Thresholds](#3-response-time-thresholds)
  - [Content Validation](#4-content-validation)
  - [Authentication](#5-authentication)
  - [POST Requests](#6-post-requests)
  - [Custom Headers](#7-custom-headers)
  - [GraphQL APIs](#8-graphql-apis)
- [Configuration Options](#configuration-options)
- [Return Values](#return-values)
- [Best Practices](#best-practices)

## Basic Structure

Every monitor follows this pattern:

```typescript
import { monitor } from "../../src/lib/config-types";

export default monitor({
  name: "Monitor Name",
  interval: "15m",  // How often to check
  timeout: "30s",   // Max execution time

  async handler() {
    const start = Date.now();

    try {
      // Your monitoring logic here

      return {
        status: "up",           // "up" | "down" | "degraded"
        responseTime: Date.now() - start,
        statusCode: 200,        // Optional HTTP status
        message: "Optional message",  // Optional status message
      };
    } catch (error) {
      return {
        status: "down",
        responseTime: Date.now() - start,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});
```

## Monitor Patterns

### 1. Simple HTTP Check

Basic availability monitoring - just check if a URL is reachable.

```typescript
// simple-http.ts
import { monitor } from "../../src/lib/config-types";

export default monitor({
  name: "My Website",
  interval: "5m",
  timeout: "30s",

  async handler() {
    const start = Date.now();

    try {
      const res = await fetch("https://example.com");
      const responseTime = Date.now() - start;

      if (!res.ok) {
        return {
          status: "down",
          responseTime,
          statusCode: res.status,
          message: `HTTP ${res.status}`,
        };
      }

      return {
        status: "up",
        responseTime,
        statusCode: res.status,
      };
    } catch (error) {
      return {
        status: "down",
        responseTime: Date.now() - start,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});
```

### 2. Status API Monitoring

Monitor third-party services using their status APIs (Atlassian Statuspage format).

```typescript
// status-api.ts
import { monitor } from "../../src/lib/config-types";

export default monitor({
  name: "Service Status",
  interval: "15m",
  timeout: "30s",

  async handler() {
    const start = Date.now();

    try {
      const res = await fetch("https://status.example.com/api/v2/status.json");
      const responseTime = Date.now() - start;

      if (!res.ok) {
        return {
          status: "down",
          responseTime,
          statusCode: res.status,
          message: `HTTP ${res.status}`,
        };
      }

      const data = await res.json() as {
        status: { indicator: string; description: string };
      };

      // Map status indicators to monitor status
      if (data.status.indicator === "critical" || data.status.indicator === "major") {
        return {
          status: "down",
          responseTime,
          statusCode: res.status,
          message: data.status.description,
        };
      }

      if (data.status.indicator === "minor") {
        return {
          status: "degraded",
          responseTime,
          statusCode: res.status,
          message: data.status.description,
        };
      }

      return {
        status: "up",
        responseTime,
        statusCode: res.status,
      };
    } catch (error) {
      return {
        status: "down",
        responseTime: Date.now() - start,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});
```

### 3. Response Time Thresholds

Mark service as degraded if response time exceeds a threshold.

```typescript
// response-time.ts
import { monitor } from "../../src/lib/config-types";

export default monitor({
  name: "Performance Sensitive API",
  interval: "1m",
  timeout: "10s",

  async handler() {
    const start = Date.now();

    try {
      const res = await fetch("https://api.example.com/health");
      const responseTime = Date.now() - start;

      if (!res.ok) {
        return {
          status: "down",
          responseTime,
          statusCode: res.status,
          message: `HTTP ${res.status}`,
        };
      }

      // Degraded if response time > 2 seconds
      if (responseTime > 2000) {
        return {
          status: "degraded",
          responseTime,
          statusCode: res.status,
          message: `Slow response: ${responseTime}ms`,
        };
      }

      return {
        status: "up",
        responseTime,
        statusCode: res.status,
      };
    } catch (error) {
      return {
        status: "down",
        responseTime: Date.now() - start,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});
```

### 4. Content Validation

Verify that the response contains expected content.

```typescript
// content-validation.ts
import { monitor } from "../../src/lib/config-types";

export default monitor({
  name: "API Content Check",
  interval: "5m",
  timeout: "30s",

  async handler() {
    const start = Date.now();

    try {
      const res = await fetch("https://api.example.com/status");
      const responseTime = Date.now() - start;

      if (!res.ok) {
        return {
          status: "down",
          responseTime,
          statusCode: res.status,
          message: `HTTP ${res.status}`,
        };
      }

      const data = await res.json();

      // Validate response structure
      if (!data.status || data.status !== "operational") {
        return {
          status: "degraded",
          responseTime,
          statusCode: res.status,
          message: `Unexpected status: ${data.status}`,
        };
      }

      return {
        status: "up",
        responseTime,
        statusCode: res.status,
      };
    } catch (error) {
      return {
        status: "down",
        responseTime: Date.now() - start,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});
```

### 5. Authentication

Monitor endpoints that require authentication.

```typescript
// authenticated.ts
import { monitor } from "../../src/lib/config-types";

export default monitor({
  name: "Authenticated API",
  interval: "10m",
  timeout: "30s",

  async handler() {
    const start = Date.now();

    try {
      const res = await fetch("https://api.example.com/protected", {
        headers: {
          "Authorization": `Bearer ${process.env.API_TOKEN}`,
        },
      });
      const responseTime = Date.now() - start;

      if (res.status === 401 || res.status === 403) {
        return {
          status: "down",
          responseTime,
          statusCode: res.status,
          message: "Authentication failed",
        };
      }

      if (!res.ok) {
        return {
          status: "down",
          responseTime,
          statusCode: res.status,
          message: `HTTP ${res.status}`,
        };
      }

      return {
        status: "up",
        responseTime,
        statusCode: res.status,
      };
    } catch (error) {
      return {
        status: "down",
        responseTime: Date.now() - start,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});
```

### 6. POST Requests

Monitor endpoints that require POST requests.

```typescript
// post-request.ts
import { monitor } from "../../src/lib/config-types";

export default monitor({
  name: "Form Submission API",
  interval: "15m",
  timeout: "30s",

  async handler() {
    const start = Date.now();

    try {
      const res = await fetch("https://api.example.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          test: true,
        }),
      });
      const responseTime = Date.now() - start;

      if (!res.ok) {
        return {
          status: "down",
          responseTime,
          statusCode: res.status,
          message: `HTTP ${res.status}`,
        };
      }

      return {
        status: "up",
        responseTime,
        statusCode: res.status,
      };
    } catch (error) {
      return {
        status: "down",
        responseTime: Date.now() - start,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});
```

### 7. Custom Headers

Add custom headers for monitoring specific scenarios.

```typescript
// custom-headers.ts
import { monitor } from "../../src/lib/config-types";

export default monitor({
  name: "CDN Cache Monitor",
  interval: "5m",
  timeout: "30s",

  async handler() {
    const start = Date.now();

    try {
      const res = await fetch("https://cdn.example.com/assets/app.js", {
        headers: {
          "Cache-Control": "no-cache",
          "User-Agent": "Pongo-Monitor/1.0",
          "Accept": "application/javascript",
        },
      });
      const responseTime = Date.now() - start;

      if (!res.ok) {
        return {
          status: "down",
          responseTime,
          statusCode: res.status,
          message: `HTTP ${res.status}`,
        };
      }

      // Check if served from cache
      const cacheStatus = res.headers.get("x-cache");
      const message = cacheStatus ? `Cache: ${cacheStatus}` : undefined;

      return {
        status: "up",
        responseTime,
        statusCode: res.status,
        message,
      };
    } catch (error) {
      return {
        status: "down",
        responseTime: Date.now() - start,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});
```

### 8. GraphQL APIs

Monitor GraphQL endpoints with custom queries.

```typescript
// graphql.ts
import { monitor } from "../../src/lib/config-types";

export default monitor({
  name: "GraphQL API",
  interval: "10m",
  timeout: "30s",

  async handler() {
    const start = Date.now();

    try {
      const res = await fetch("https://api.example.com/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `
            query Health {
              health {
                status
                version
              }
            }
          `,
        }),
      });
      const responseTime = Date.now() - start;

      if (!res.ok) {
        return {
          status: "down",
          responseTime,
          statusCode: res.status,
          message: `HTTP ${res.status}`,
        };
      }

      const data = await res.json();

      // Check for GraphQL errors
      if (data.errors && data.errors.length > 0) {
        return {
          status: "down",
          responseTime,
          statusCode: res.status,
          message: data.errors[0].message,
        };
      }

      // Validate response
      if (data.data?.health?.status !== "ok") {
        return {
          status: "degraded",
          responseTime,
          statusCode: res.status,
          message: "Health check failed",
        };
      }

      return {
        status: "up",
        responseTime,
        statusCode: res.status,
      };
    } catch (error) {
      return {
        status: "down",
        responseTime: Date.now() - start,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});
```

## Configuration Options

### `name` (required)
Display name for the monitor in the dashboard.

```typescript
name: "My API"
```

### `interval` (optional)
How often to run the check. Supports human-readable durations or cron expressions.

```typescript
interval: "30s"   // Every 30 seconds
interval: "5m"    // Every 5 minutes
interval: "1h"    // Every hour
interval: "*/5 * * * *"  // Cron: every 5 minutes
```

Default: `1m`

### `timeout` (optional)
Maximum time the handler can run before being terminated.

```typescript
timeout: "10s"   // 10 seconds
timeout: "30s"   // 30 seconds
timeout: "1m"    // 1 minute
```

Default: `30s`

### `active` (optional)
Enable or disable the monitor.

```typescript
active: false  // Disable this monitor
```

Default: `true`

### `alerts` (optional)
Configure alert conditions (see alerts documentation).

```typescript
alerts: [
  {
    channel: "slack",
    condition: { type: "down" },
  },
]
```

## Return Values

The handler must return an object with these fields:

### `status` (required)
Current status of the monitored service.

- `"up"` - Service is operational
- `"down"` - Service is unavailable
- `"degraded"` - Service is slow or partially functional

### `responseTime` (required)
Response time in milliseconds.

```typescript
const start = Date.now();
// ... make request
const responseTime = Date.now() - start;
```

### `statusCode` (optional)
HTTP status code from the response.

```typescript
statusCode: res.status
```

### `message` (optional)
Additional context about the check result.

```typescript
message: "Slow response: 3000ms"
message: "Authentication failed"
message: error.message
```

## Best Practices

### 1. Always Measure Response Time

```typescript
const start = Date.now();
try {
  const res = await fetch(url);
  const responseTime = Date.now() - start;
  // ... use responseTime in return
} catch (error) {
  return {
    status: "down",
    responseTime: Date.now() - start,  // Still include responseTime
    message: error.message,
  };
}
```

### 2. Use Environment Variables for Secrets

```typescript
// Don't hardcode credentials
headers: {
  "Authorization": `Bearer ${process.env.API_TOKEN}`,
}
```

### 3. Handle All Error Cases

```typescript
if (res.status === 401) {
  return { status: "down", message: "Authentication failed" };
}
if (res.status === 429) {
  return { status: "degraded", message: "Rate limited" };
}
if (!res.ok) {
  return { status: "down", message: `HTTP ${res.status}` };
}
```

### 4. Set Appropriate Intervals

- **Critical services**: `1m` - `5m`
- **Standard services**: `5m` - `15m`
- **Low priority**: `15m` - `1h`

### 5. Use Meaningful Status Messages

```typescript
// Good
message: `Slow response: ${responseTime}ms (threshold: 2000ms)`

// Not as helpful
message: "Slow"
```

### 6. Type Your Responses

```typescript
const data = await res.json() as {
  status: string;
  version: string;
};
```

### 7. Register Your Monitor

After creating a monitor file, add it to `index.ts`:

```typescript
import mymonitor from "./mymonitor";

export default {
  // ... other monitors
  mymonitor,
};
```

## Examples in This Directory

- **example.ts** - Simple HTTP check with response time threshold
- **vercel.ts** - Status API monitoring (Atlassian Statuspage format)
- **cloudflare.ts** - Status API monitoring with indicator mapping
- **hackernews.ts** - Basic availability check for a website

## Need Help?

- Check the main [README.md](../../README.md) for architecture overview
- See [config-types.ts](../../src/lib/config-types.ts) for type definitions
- Look at existing monitors in this directory for examples
