import { monitor } from "../../src/lib/config-types";
import { runPythonMonitor } from "../../src/lib/python-runner";
import cloudflare from "./cloudflare";
import example from "./example";
import hackernews from "./hackernews";
import pongo from "./pongo";
import vercel from "./vercel";

// Python monitor wrappers using Vercel Python Runtime
// These call the Python serverless functions at /api/monitors/{endpoint}
const hackernewsPy = monitor({
  name: "Hacker News (Python)",
  interval: "15m",
  timeout: "30s",
  async handler() {
    // Calls /api/monitors/hackernews (api/monitors/hackernews.py)
    return await runPythonMonitor("hackernews", 30000);
  },
});

const vercelPy = monitor({
  name: "Vercel (Python)",
  interval: "15m",
  timeout: "30s",
  async handler() {
    // Calls /api/monitors/vercel_py (api/monitors/vercel_py.py)
    return await runPythonMonitor("vercel_py", 30000);
  },
});

export default {
  example,
  vercel,
  cloudflare,
  hackernews,
  pongo,
  "hackernews-py": hackernewsPy,
  "vercel-py": vercelPy,
};
