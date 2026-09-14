import { Check, Copy } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ChatMessage } from "../types";

interface ResponseDisplayProps {
  messages: ChatMessage[];
  streamingText: string;
}

function renderMarkdown(text: string) {
  const blocks = text.split(/(```[\s\S]*?```)/g).filter(Boolean);
  return blocks.map((block, index) => {
    if (block.startsWith("```")) {
      const lines = block.replace(/^```/, "").replace(/```$/, "").split("\n");
      const language = lines.shift()?.trim() || "text";
      const code = lines.join("\n");
      return <CodeBlock key={`${language}-${index}`} language={language} code={code} />;
    }
    return <p key={`p-${index}`}>{block}</p>;
  });
}

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="code-block">
      <div className="code-meta">
        <span>{language}</span>
        <button
          onClick={async () => {
            await navigator.clipboard.writeText(code);
            setCopied(true);
          }}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />} Copy
        </button>
      </div>
      <pre><code>{code}</code></pre>
    </div>
  );
}

export function ResponseDisplay({ messages, streamingText }: ResponseDisplayProps) {
  const visible = useMemo(() => messages.slice(-8), [messages]);
  useEffect(() => {
    const feed = document.querySelector(".response-feed");
    if (feed instanceof HTMLElement && typeof feed.scrollTo === "function") {
      feed.scrollTo({ top: 999999, behavior: "smooth" });
    }
  }, [messages, streamingText]);
  return (
    <section className="response-feed" aria-live="polite">
      <div className="response-header">
        <span>Conversation</span>
        <b>{streamingText ? "Streaming" : `${messages.length} messages`}</b>
      </div>
      {visible.length === 0 && !streamingText && (
        <article className="message assistant empty">
          <time>ready</time>
          <div><p>Ask, speak, inspect files, or open tools. JARVIS keeps local context and streams responses here.</p></div>
        </article>
      )}
      {visible.map((message) => (
        <article key={message.id} className={`message ${message.role}`}>
          <time>{message.role} - {new Date(message.createdAt).toLocaleTimeString()}</time>
          <div>{renderMarkdown(message.content)}</div>
        </article>
      ))}
      {streamingText && (
        <article className="message assistant streaming">
          <time>streaming</time>
          <div>{renderMarkdown(streamingText)}</div>
        </article>
      )}
    </section>
  );
}
