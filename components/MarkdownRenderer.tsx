import React from "react";
import CodeBlock from "./CodeBlock";

interface MarkdownRendererProps {
  content: string;
}

// AI javoblarini markdown ko'rinishida render qilish (kod bloklari, bold, sarlavhalar, ro'yxatlar)
const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const parts = React.useMemo(() => {
    const result: Array<{
      type: "text" | "code";
      text?: string;
      code?: string;
      lang?: string;
    }> = [];
    const regex = /```(\w*)\n?([\s\S]*?)(?:```|$)/g;
    let lastIndex = 0;
    let match;
    while ((match = regex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        result.push({
          type: "text",
          text: content.slice(lastIndex, match.index),
        });
      }
      result.push({
        type: "code",
        lang: match[1] || "code",
        code: match[2].replace(/\n$/, ""),
      });
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < content.length) {
      result.push({ type: "text", text: content.slice(lastIndex) });
    }
    return result;
  }, [content]);

  return (
    <div className="markdown-body text-sm md:text-[15px] leading-relaxed font-medium space-y-2">
      {parts.map((part, i) =>
        part.type === "code" ? (
          <CodeBlock key={i} code={part.code} lang={part.lang} />
        ) : (
          <InlineMarkdown key={i} text={part.text} />
        ),
      )}
    </div>
  );
};

const InlineMarkdown: React.FC<{ text: string }> = ({ text }) => {
  const html = React.useMemo(() => {
    const esc = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    return esc
      .split("\n")
      .map((line) => {
        const h = line.match(/^(#{1,4})\s+(.*)/);
        if (h) {
          const size = ["text-xl", "text-lg", "text-base", "text-sm"][
            h[1].length - 1
          ];
          return `<span class="block ${size} font-black text-white mt-3 mb-1">${h[2]}</span>`;
        }
        let l = line
          .replace(
            /`([^`]+)`/g,
            '<code class="px-1.5 py-0.5 rounded-md bg-blue-500/20 text-blue-200 font-mono text-[13px]">$1</code>',
          )
          .replace(
            /\*\*([^*]+)\*\*/g,
            '<strong class="font-black text-white">$1</strong>',
          )
          .replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>');
        if (/^\s*[-*•]\s+/.test(l)) {
          l = `<span class="flex gap-2"><span class="text-blue-400">•</span><span>${l.replace(/^\s*[-*•]\s+/, "")}</span></span>`;
        } else if (/^\s*\d+\.\s+/.test(l)) {
          const num = l.match(/^\s*(\d+)\./)?.[1];
          l = `<span class="flex gap-2"><span class="text-blue-400 font-bold">${num}.</span><span>${l.replace(/^\s*\d+\.\s+/, "")}</span></span>`;
        }
        return `<span class="block">${l || "&nbsp;"}</span>`;
      })
      .join("");
  }, [text]);

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
};

export default MarkdownRenderer;
