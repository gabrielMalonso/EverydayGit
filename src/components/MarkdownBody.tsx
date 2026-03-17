import React, { useMemo } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

interface MarkdownBodyProps {
  content: string;
  className?: string;
}

const components: Components = {
  h1: ({ children }) => <h1 className="mb-3 mt-4 text-xl font-semibold text-text1">{children}</h1>,
  h2: ({ children }) => <h2 className="mb-2 mt-4 text-lg font-semibold text-text1">{children}</h2>,
  h3: ({ children }) => <h3 className="mb-2 mt-3 text-base font-semibold text-text1">{children}</h3>,
  h4: ({ children }) => <h4 className="mb-1 mt-3 text-sm font-semibold text-text1">{children}</h4>,
  h5: ({ children }) => <h5 className="mb-1 mt-2 text-sm font-medium text-text1">{children}</h5>,
  h6: ({ children }) => <h6 className="mb-1 mt-2 text-xs font-medium text-text2">{children}</h6>,
  p: ({ children }) => <p className="mb-2 text-sm leading-relaxed text-text1">{children}</p>,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
      {children}
    </a>
  ),
  strong: ({ children }) => <strong className="font-semibold text-text1">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  del: ({ children }) => <del className="line-through text-text3">{children}</del>,
  blockquote: ({ children }) => (
    <blockquote className="my-2 border-l-2 border-accent pl-3 text-sm italic text-text2">
      {children}
    </blockquote>
  ),
  ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 pl-5 text-sm text-text1">{children}</ul>,
  ol: ({ children }) => <ol className="mb-2 list-decimal space-y-1 pl-5 text-sm text-text1">{children}</ol>,
  li: ({ children }) => <li className="text-sm leading-relaxed text-text1">{children}</li>,
  code: ({ className, children }) => {
    const isBlock = className?.includes('language-');
    if (isBlock) {
      return (
        <code className={`block text-xs font-mono ${className ?? ''}`}>
          {children}
        </code>
      );
    }
    return (
      <code className="rounded bg-surface2 px-1.5 py-0.5 font-mono text-xs text-text1">
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="my-2 overflow-auto rounded-card-inner bg-[rgb(8,8,12)] p-3 text-xs">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="my-2 overflow-auto">
      <table className="w-full border-collapse text-sm">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => <thead className="border-b border-border1">{children}</thead>,
  th: ({ children }) => <th className="px-3 py-1.5 text-left text-xs font-semibold text-text2">{children}</th>,
  td: ({ children }) => <td className="border-t border-border1 px-3 py-1.5 text-sm text-text1">{children}</td>,
  hr: () => <hr className="my-4 border-border1" />,
  img: ({ src, alt }) => <img src={src} alt={alt ?? ''} className="my-2 max-w-full rounded" />,
  input: ({ checked, disabled, type, ...rest }) => {
    if (type === 'checkbox') {
      return <input type="checkbox" checked={checked} disabled className="mr-1.5 accent-accent" {...rest} />;
    }
    return <input type={type} disabled={disabled} {...rest} />;
  },
};

const remarkPlugins = [remarkGfm];
const rehypePlugins = [rehypeRaw];

export const MarkdownBody: React.FC<MarkdownBodyProps> = React.memo(({ content, className = '' }) => {
  const trimmed = useMemo(() => content?.trim() ?? '', [content]);

  if (!trimmed) return null;

  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={remarkPlugins}
        rehypePlugins={rehypePlugins}
        components={components}
      >
        {trimmed}
      </ReactMarkdown>
    </div>
  );
});

MarkdownBody.displayName = 'MarkdownBody';
