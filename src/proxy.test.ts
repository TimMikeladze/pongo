import { describe, expect, test } from "bun:test";

describe("agent documentation access", () => {
  test("serves setup instructions without unlocking admin routes", () => {
    // Isolate the import because auth configuration is captured at module load.
    const result = Bun.spawnSync(
      [
        "bun",
        "--eval",
        `
          import { NextRequest } from "next/server";
          import { proxy } from "./src/proxy";
          const paths = [
            "/llms.txt",
            "/skills/create-pongo/SKILL.md",
            "/monitors",
            "/settings",
            "/skills/create-pongo/private.md",
          ];
          const results = [];
          for (const path of paths) {
            const response = await proxy(new NextRequest("http://localhost:3000" + path));
            results.push({ path, status: response.status, location: response.headers.get("location") });
          }
          console.log(JSON.stringify(results));
        `,
      ],
      { env: { ...process.env, ACCESS_CODE: "agent-docs-test-code" } },
    );

    expect(result.exitCode).toBe(0);
    const responses = JSON.parse(result.stdout.toString());
    expect(responses.slice(0, 2)).toEqual([
      { path: "/llms.txt", status: 200, location: null },
      { path: "/skills/create-pongo/SKILL.md", status: 200, location: null },
    ]);
    for (const response of responses.slice(2)) {
      expect(response.status).toBe(307);
      expect(response.location).toBe("http://localhost:3000/login");
    }
  });
});
