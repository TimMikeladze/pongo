import path from "node:path";
import { monitor } from "../../src/lib/config-types";
import { runPythonMonitor } from "../../src/lib/python-runner";
import cloudflare from "./cloudflare";
import example from "./example";
import hackernews from "./hackernews";
import vercel from "./vercel";

// Python monitor wrappers
const hackernewsPy = monitor({
  name: "Hacker News (Python)",
  interval: "15m",
  timeout: "30s",
  async handler() {
    const pythonFile = path.join(__dirname, "hackernews.py");
    return await runPythonMonitor(pythonFile, 30000);
  },
});

const vercelPy = monitor({
  name: "Vercel (Python)",
  interval: "15m",
  timeout: "30s",
  async handler() {
    const pythonFile = path.join(__dirname, "vercel_py.py");
    return await runPythonMonitor(pythonFile, 30000);
  },
});

export default {
  example,
  vercel,
  cloudflare,
  hackernews,
  "hackernews-py": hackernewsPy,
  "vercel-py": vercelPy,
};
