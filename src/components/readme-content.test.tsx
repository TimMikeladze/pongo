import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { ReadmeContent } from "./readme-content";

describe("README rendering", () => {
  test("retains heading links, tables, code and local screenshot paths", async () => {
    const html = renderToStaticMarkup(
      await ReadmeContent({
        markdown:
          "[Quick Start](#quick-start)\n\n## Quick Start\n\n```sh\nbun dev\n```\n\n| Name | State |\n| --- | --- |\n| API | Up |\n\n![Overview](public/readme/overview-dark.png)",
      }),
    );
    expect(html).toContain('id="quick-start"');
    expect(html).toContain('href="#quick-start"');
    expect(html).toContain('src="/readme/overview-dark.png"');
    expect(html).toContain("<table>");
    expect(html.replace(/<[^>]*>/g, "")).toContain("bun dev");
    expect(html).toContain("--shiki-light");
    expect(html).toContain("--shiki-dark");
  });
  test("renders README HTML without executable scripts or handlers", async () => {
    const html = renderToStaticMarkup(
      await ReadmeContent({
        markdown:
          '<details><summary>Screenshot</summary><img src="/logo.png" onerror="alert(1)" /></details>\n\n<script>alert(2)</script>',
      }),
    );
    expect(html).toContain("<details>");
    expect(html).toContain("<summary>Screenshot</summary>");
    expect(html).not.toContain("<script");
    expect(html).not.toContain("onerror");
    expect(html).not.toContain("alert(");
  });

  test("resolves setup resources while retaining page anchors and external URLs", async () => {
    const html = renderToStaticMarkup(
      await ReadmeContent({
        markdown:
          "[Skill](public/skills/create-pongo/SKILL.md)\n\n[Setup guide](docs/agent-setup.md)\n\n[Quick Start](#quick-start)\n\n[Instructions](https://pongo.sh/llms.txt)",
      }),
    );
    expect(html).toContain('href="/skills/create-pongo/SKILL.md"');
    expect(html).toContain(
      'href="https://github.com/TimMikeladze/pongo/blob/main/docs/agent-setup.md"',
    );
    expect(html).toContain('href="#quick-start"');
    expect(html).toContain('href="https://pongo.sh/llms.txt"');
  });
});
