import fs from "node:fs";
import path from "node:path";
import rehypePrettyCode, { type Options } from "rehype-pretty-code";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { DeployButtons } from "@/components/deploy-buttons";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = {
  title: "Documentation | Pongo",
  description: "Pongo documentation and setup guide",
};

const prettyCodeOptions: Options = {
  theme: {
    dark: "github-dark",
    light: "github-light",
  },
  keepBackground: false,
};

// Extended schema to allow code highlighting classes from shiki
const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    code: [...(defaultSchema.attributes?.code || []), "className", "style"],
    span: [...(defaultSchema.attributes?.span || []), "className", "style"],
    pre: [
      ...(defaultSchema.attributes?.pre || []),
      "className",
      "style",
      "data-language",
      "data-theme",
    ],
    figure: [
      ...(defaultSchema.attributes?.figure || []),
      "className",
      "data-rehype-pretty-code-figure",
    ],
  },
};

async function processMarkdown(content: string): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypePrettyCode, prettyCodeOptions)
    .use(rehypeSanitize, sanitizeSchema)
    .use(rehypeStringify)
    .process(content);

  return String(result);
}

export default async function DocsPage() {
  const readmePath = path.join(process.cwd(), "README.md");
  const content = fs.readFileSync(readmePath, "utf-8");
  const html = await processMarkdown(content);

  return (
    <div className="space-y-6">
      <DeployButtons />
      <Card className="bg-background">
        <CardContent className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-mono prose-headings:font-normal prose-h1:text-xl prose-h2:text-lg prose-h3:text-base prose-p:text-muted-foreground prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-code:text-xs prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:rounded-lg prose-pre:p-4 prose-table:text-xs prose-th:font-mono prose-th:font-normal prose-td:text-muted-foreground prose-strong:text-foreground prose-li:text-muted-foreground">
          <div dangerouslySetInnerHTML={{ __html: html }} />
        </CardContent>
      </Card>
    </div>
  );
}
