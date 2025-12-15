import fs from "node:fs";
import path from "node:path";
import Markdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = {
  title: "Documentation | Pongo",
  description: "Pongo documentation and setup guide",
};

export default async function DocsPage() {
  const readmePath = path.join(process.cwd(), "README.md");
  const content = fs.readFileSync(readmePath, "utf-8");

  return (
    <Card className="bg-background">
      <CardContent className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-mono prose-headings:font-normal prose-h1:text-xl prose-h2:text-lg prose-h3:text-base prose-p:text-muted-foreground prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-code:text-xs prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-table:text-xs prose-th:font-mono prose-th:font-normal prose-td:text-muted-foreground prose-strong:text-foreground prose-li:text-muted-foreground">
        <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
          {content}
        </Markdown>
      </CardContent>
    </Card>
  );
}
