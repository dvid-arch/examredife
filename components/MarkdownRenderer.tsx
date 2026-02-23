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
  // Normalize LaTeX delimiters for remark-math ($ instead of \( or \[)
  const normalizeLatex = (text: string) => {
    if (!text) return '';
    let normalized = text
      // Standardize delimiters with spaces to ensure detection
      .replace(/\\\(/g, ' $')     // Replace \( with " $"
      .replace(/\\\)/g, '$ ')     // Replace \) with "$ "
      .replace(/\\\[/g, ' $$')    // Replace \[ with " $$"
      .replace(/\\\]/g, '$$ ');   // Replace \] with "$$ "

    // Fix escaped braces within math mode which break grouping (e.g. x^\{3\} -> x^{3})
    // This is a common data mangling issue
    normalized = normalized.replace(/\$([^\$]+)\$/g, (match, p1) => {
      return '$' + p1.replace(/\\\{/g, '{').replace(/\\\}/g, '}') + '$';
    });

    // Fallback for user-reported case: (\frac... without backslash
    normalized = normalized.replace(/\((\\frac)/g, ' $$1');

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