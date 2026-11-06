import { Children, isValidElement, type ReactNode } from "react";
import { MarkdownAsync } from "react-markdown";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";

function textContent(children: ReactNode): string {
  return Children.toArray(children)
    .map((child) => {
      if (typeof child === "string" || typeof child === "number")
        return String(child);
      return isValidElement<{ children?: ReactNode }>(child)
        ? textContent(child.props.children)
        : "";
    })
    .join("");
}

function headingId(children: ReactNode): string {
  return textContent(children)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s/g, "-");
}

export async function ReadmeContent({ markdown }: { markdown: string }) {
  return (
    <article className="readme-content prose prose-sm dark:prose-invert max-w-none prose-headings:text-foreground prose-a:text-foreground prose-pre:bg-muted prose-pre:text-foreground">
      {
        await MarkdownAsync({
          children: markdown,
          remarkPlugins: [remarkGfm],
          rehypePlugins: [
            rehypeRaw,
            rehypeSanitize,
            [
              rehypePrettyCode,
              {
                theme: {
                  light: "github-light-high-contrast",
                  dark: "github-dark-high-contrast",
                },
                keepBackground: false,
              },
            ],
          ],
          components: {
            a: ({ href, title, children }) => (
              <a
                href={
                  href?.startsWith("public/")
                    ? `/${href.slice(7)}`
                    : href &&
                        !href.startsWith("#") &&
                        !href.startsWith("/") &&
                        !/^[a-z][a-z\d+.-]*:/i.test(href)
                      ? `https://github.com/TimMikeladze/pongo/blob/main/${href}`
                      : href
                }
                title={title}
              >
                {children}
              </a>
            ),
            h1: ({ children }) => <h2 id={headingId(children)}>{children}</h2>,
            h2: ({ children }) => <h2 id={headingId(children)}>{children}</h2>,
            h3: ({ children }) => <h3 id={headingId(children)}>{children}</h3>,
            h4: ({ children }) => <h4 id={headingId(children)}>{children}</h4>,
            img: ({ src, alt, width, height }) => (
              // biome-ignore lint/performance/noImgElement: Preserve Markdown image dimensions and external badge URLs.
              <img
                src={
                  typeof src === "string" && src.startsWith("public/")
                    ? `/${src.slice(7)}`
                    : src
                }
                alt={alt ?? ""}
                width={width}
                height={height}
                loading="lazy"
                decoding="async"
              />
            ),
            table: ({ children }) => (
              <div className="overflow-x-auto">
                <table>{children}</table>
              </div>
            ),
          },
        })
      }
    </article>
  );
}
