'use client';

import { UIMessage, useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function Chat({
  id,
  initialMessages = [],
}: {
  id?: string;
  initialMessages?: UIMessage[];
}) {
  const [input, setInput] = useState('');

  const { messages, sendMessage } = useChat({
    id,
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: '/api/chat',
    }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage({ text: input });
    setInput('');
  };

  return (
    <div className="flex flex-col h-screen bg-neutral-950 text-neutral-100">
      <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${
              m.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-3xl rounded-2xl px-5 py-3 ${
                m.role === 'user'
                  ? 'bg-neutral-800 text-neutral-50'
                  : 'bg-neutral-900 border border-neutral-800 text-neutral-100 prose prose-invert prose-sm max-w-none'
              }`}
            >
              {m.role === 'user' ? (
                <p className="whitespace-pre-wrap">
                  {m.parts
                    .map((p) => (p.type === 'text' ? p.text : ''))
                    .join('')}
                </p>
              ) : (
                m.parts.map((part, i) => {
                  if (part.type !== 'text') return null;
                  return (
                    <ReactMarkdown
                      key={i}
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code({ node, className, children, ...props }) {
                          const match =
                            /language-(\w+)/.exec(className || '');
                          return match ? (
                            <SyntaxHighlighter
                              {...(props as any)}
                              style={vscDarkPlus}
                              language={match[1]}
                              PreTag="div"
                              className="rounded-lg overflow-x-auto text-sm my-3"
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          ) : (
                            <code
                              className="bg-neutral-800 px-1.5 py-0.5 rounded text-sm font-mono"
                              {...props}
                            >
                              {children}
                            </code>
                          );
                        },
                      }}
                    >
                      {part.text}
                    </ReactMarkdown>
                  );
                })
              )}
            </div>
          </div>
        ))}
      </div>

      <form
        onSubmit={handleSubmit}
        className="fixed bottom-0 left-0 right-0 bg-neutral-900/95 border-t border-neutral-800 p-4 backdrop-blur"
      >
        <div className="max-w-4xl mx-auto flex gap-3">
          <input
            className="flex-1 px-5 py-3 bg-neutral-900 border border-neutral-700 rounded-xl text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:border-transparent"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything..."
            autoFocus
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="px-7 py-3 bg-neutral-800 text-neutral-100 font-medium rounded-xl hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
