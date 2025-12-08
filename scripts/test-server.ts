/**
 * Test server for simulating monitor targets
 *
 * Provides controllable endpoints for testing alerts, health checks, and failure scenarios.
 * Control endpoint behavior via the admin API.
 *
 * Usage:
 *   bun run scripts/test-server.ts
 *   TEST_SERVER_PORT=4001 bun run scripts/test-server.ts
 */

const PORT = parseInt(process.env.TEST_SERVER_PORT || "4000", 10);

type EndpointState = {
  status: number;
  latency: number;
  body: string;
  contentType: string;
  failRate: number;
  timeout: boolean;
};

const defaultState: EndpointState = {
  status: 200,
  latency: 0,
  body: "OK",
  contentType: "text/plain",
  failRate: 0,
  timeout: false,
};

const endpoints = new Map<string, EndpointState>();

function resetEndpoints() {
  endpoints.clear();
  // Default endpoints matching the test monitors
  endpoints.set("/health", { ...defaultState });
  endpoints.set("/api/health", {
    ...defaultState,
    body: '{"status":"healthy"}',
    contentType: "application/json",
  });
  endpoints.set("/db/health", {
    ...defaultState,
    body: '{"status":"connected"}',
    contentType: "application/json",
  });
  endpoints.set("/auth/health", {
    ...defaultState,
    body: '{"status":"ready"}',
    contentType: "application/json",
  });
  endpoints.set("/payments/health", {
    ...defaultState,
    body: '{"status":"operational"}',
    contentType: "application/json",
  });
  endpoints.set("/cdn/health", {
    ...defaultState,
    body: '{"status":"serving"}',
    contentType: "application/json",
  });
}

resetEndpoints();

function parseBody(req: Request): Promise<Record<string, unknown>> {
  return req.json().catch(() => ({}));
}

function getEndpointPath(url: URL): string {
  const prefix = "/admin/endpoints";
  const path = url.pathname.slice(prefix.length);
  return path || "/";
}

async function handleAdmin(req: Request, url: URL): Promise<Response> {
  const path = url.pathname;

  // GET /admin/endpoints - list all
  if (path === "/admin/endpoints" && req.method === "GET") {
    const result: Record<string, EndpointState> = {};
    for (const [k, v] of endpoints) {
      result[k] = v;
    }
    return Response.json(result);
  }

  // POST /admin/reset - clear and reset
  if (path === "/admin/reset" && req.method === "POST") {
    resetEndpoints();
    return Response.json({ ok: true, message: "Reset complete" });
  }

  // POST /admin/bulk - bulk create/update
  if (path === "/admin/bulk" && req.method === "POST") {
    const body = await parseBody(req);
    for (const [endpointPath, config] of Object.entries(body)) {
      const existing = endpoints.get(endpointPath) || { ...defaultState };
      endpoints.set(endpointPath, {
        ...existing,
        ...(config as Partial<EndpointState>),
      });
    }
    return Response.json({ ok: true, endpoints: Object.keys(body) });
  }

  // PUT /admin/endpoints/* - create/update endpoint
  if (path.startsWith("/admin/endpoints/") && req.method === "PUT") {
    const endpointPath = getEndpointPath(url);
    const body = await parseBody(req);
    const existing = endpoints.get(endpointPath) || { ...defaultState };
    endpoints.set(endpointPath, {
      ...existing,
      ...(body as Partial<EndpointState>),
    });
    return Response.json({
      ok: true,
      path: endpointPath,
      state: endpoints.get(endpointPath),
    });
  }

  // DELETE /admin/endpoints/* - delete endpoint
  if (path.startsWith("/admin/endpoints/") && req.method === "DELETE") {
    const endpointPath = getEndpointPath(url);
    if (!endpoints.has(endpointPath)) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }
    endpoints.delete(endpointPath);
    return Response.json({ ok: true, deleted: endpointPath });
  }

  return Response.json({ error: "Unknown admin route" }, { status: 404 });
}

async function handleEndpoint(path: string): Promise<Response> {
  const state = endpoints.get(path);

  if (!state) {
    return new Response("Endpoint not configured", { status: 404 });
  }

  // Timeout simulation - never respond
  if (state.timeout) {
    return new Promise(() => {}); // Never resolves
  }

  // Random failure simulation
  if (state.failRate > 0 && Math.random() < state.failRate) {
    if (state.latency > 0) {
      await Bun.sleep(state.latency);
    }
    return new Response("Simulated random failure", {
      status: 500,
      headers: { "Content-Type": "text/plain" },
    });
  }

  // Latency simulation
  if (state.latency > 0) {
    await Bun.sleep(state.latency);
  }

  return new Response(state.body, {
    status: state.status,
    headers: { "Content-Type": state.contentType },
  });
}

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);

    // Admin routes
    if (url.pathname.startsWith("/admin/")) {
      return handleAdmin(req, url);
    }

    // Simulated endpoints
    return handleEndpoint(url.pathname);
  },
});

console.log(`Test server running on http://localhost:${server.port}`);
console.log(`Admin API: http://localhost:${server.port}/admin/endpoints`);
console.log(`\nDefault endpoints:`);
for (const [path] of endpoints) {
  console.log(`  ${path}`);
}
