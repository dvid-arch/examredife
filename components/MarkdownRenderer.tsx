import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';

const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  return (
    <ReactMarkdown
      children={content}
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeKatex, rehypeRaw]}
      className="prose prose-slate dark:prose-invert max-w-none"
      components={{
        table: ({node, ...props}) => (
          <div className="overflow-x-auto my-4 border border-slate-200 dark:border-slate-700 rounded-lg">
            <table className="min-w-full text-sm" {...props} />
          </div>
        ),
        thead: ({node, ...props}) => <thead className="bg-slate-50 dark:bg-slate-800/50" {...props} />,
        th: ({node, ...props}) => <th className="border-b border-slate-200 dark:border-slate-700 p-3 text-left font-semibold" {...props} />,
        tr: ({node, ...props}) => <tr className="border-b border-slate-200 dark:border-slate-700 last:border-b-0 even:bg-slate-50 dark:even:bg-slate-800/20" {...props} />,
        td: ({node, ...props}) => <td className="p-3 align-top break-words" {...props} />,
        code({node, inline, className, children, ...props}) {
            return !inline ? (
                <pre className="block bg-gray-800 text-white p-4 rounded-lg my-4 overflow-x-auto text-sm" {...props}>
                    <code>{children}</code>
                </pre>
            ) : (
                <code className="bg-gray-200 dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 font-mono px-1.5 py-1 rounded text-sm" {...props}>
                    {children}
                </code>
            );
        },
        a: ({node, ...props}) => <a className="text-primary hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
      }}
    />
  );
};

export default MarkdownRenderer;