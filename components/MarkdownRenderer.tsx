import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import { InlineQuestion } from '../types.ts';
import CheckpointCard from './CheckpointCard.tsx';

const MarkdownRenderer: React.FC<{
  content: string;
  forceLightMode?: boolean;
  inlineQuestions?: InlineQuestion[];
  renderOptions?: boolean; // Control whether to render options internally
  onCheckpointResult?: (isCorrect: boolean) => void;
}> = ({ content, forceLightMode, inlineQuestions = [], renderOptions = true, onCheckpointResult }) => {
  const normalizeLatex = (text: string) => {
    if (!text) return '';
    let normalized = text
      // Standardize delimiters with spaces to ensure detection
      .replace(/\\\(/g, ' $')     // Replace \( with " $"
      .replace(/\\\)/g, '$ ')     // Replace \) with "$ "
      .replace(/\\\[/g, ' $$')    // Replace \[ with " $$"
      .replace(/\\\]/g, '$$ ');   // Replace \] with "$$ "

    // Fix escaped braces within math mode which break grouping (e.g. x^\{3\} -> x^{3})
    // This handles both $...$ and $$...$$
    normalized = normalized.replace(/\$(\$)?([^\$]+)\$(\$)?/g, (match, d1, p1, d2, d3) => {
      const content = p1.replace(/\\\{/g, '{').replace(/\\\}/g, '}');
      const delim = d1 ? '$$' : '$';
      return delim + content + delim;
    });

    return normalized;
  };

  const normalizedContent = normalizeLatex(content);

  // Helper to extract text from React children
  const getHeaderText = (children: any): string => {
    if (typeof children === 'string') return children;
    if (Array.isArray(children)) return children.map(child => getHeaderText(child)).join('');
    if (children?.props?.children) return getHeaderText(children.props.children);
    return '';
  };

  const renderHeaderWithCheckpoint = (Level: 'h1' | 'h2' | 'h3', props: any, children: any) => {
    const text = getHeaderText(children);
    const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
    const question = inlineQuestions.find(q => q.triggerHeader.toLowerCase() === text.toLowerCase());

    return (
      <>
        <Level id={id} {...props}>{children}</Level>
        {question && <CheckpointCard question={question} onResult={onCheckpointResult} />}
      </>
    );
  };

  return (
    <ReactMarkdown
      children={normalizedContent}
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeKatex, rehypeRaw]}
      className={`prose prose-slate ${forceLightMode ? '' : 'dark:prose-invert'} max-w-none`}
      components={{
        h1: ({ node, children, ...props }) => renderHeaderWithCheckpoint('h1', props, children),
        h2: ({ node, children, ...props }) => renderHeaderWithCheckpoint('h2', props, children),
        h3: ({ node, children, ...props }) => renderHeaderWithCheckpoint('h3', props, children),
        table: ({ node, ...props }) => (
          <div className={`overflow-x-auto my-4 border border-slate-200 ${forceLightMode ? '' : 'dark:border-slate-700'} rounded-lg`}>
            <table className="min-w-full text-sm" {...props} />
          </div>
        ),
        thead: ({ node, ...props }) => <thead className={`bg-slate-50 ${forceLightMode ? '' : 'dark:bg-slate-800/50'}`} {...props} />,
        th: ({ node, ...props }) => <th className={`border-b border-slate-200 ${forceLightMode ? '' : 'dark:border-slate-700'} p-3 text-left font-semibold`} {...props} />,
        tr: ({ node, ...props }) => <tr className={`border-b border-slate-200 ${forceLightMode ? '' : 'dark:border-slate-700'} last:border-b-0 even:bg-slate-50 ${forceLightMode ? '' : 'dark:even:bg-slate-800/20'}`} {...props} />,
        td: ({ node, ...props }) => <td className="p-3 align-top break-words" {...props} />,
        code({ node, className, children, ...props }: any) {
          const isInline = !props.parent || props.parent.tagName !== 'pre';
          const match = /language-(\w+)/.exec(className || '');
          const language = match ? match[1] : '';

          if (language === 'solution') {
            return (
              <div className="bg-slate-900 border border-slate-700 p-3 sm:p-4 rounded-xl my-4 text-slate-100 shadow-2xl overflow-x-auto">
                <div className="flex items-center gap-2 mb-2 border-b border-slate-800 pb-2 text-sm font-bold uppercase tracking-widest text-emerald-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                  Worked Solution
                </div>
                <div className="solution-markdown prose-tight">
                  <ReactMarkdown
                    children={normalizeLatex(String(children).trim())}
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[rehypeKatex, rehypeRaw]}
                    className="prose prose-invert max-w-none prose-sm"
                  />
                </div>
              </div>
            );
          }

          return !isInline ? (
            <pre className="block bg-gray-800 text-white p-4 rounded-lg my-4 overflow-x-auto text-sm">
              <code className={className} {...props}>{children}</code>
            </pre>
          ) : (
            <code className={`bg-gray-200 ${forceLightMode ? '' : 'dark:bg-slate-700'} text-emerald-700 ${forceLightMode ? '' : 'dark:text-emerald-300'} font-mono px-1.5 py-1 rounded text-sm`} {...props}>
              {children}
            </code>
          );
        },
        a: ({ node, ...props }) => <a className="text-primary hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
      }}
    />
  );
};

export default MarkdownRenderer;