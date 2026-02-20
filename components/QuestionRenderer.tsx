import React from 'react';
import MarkdownRenderer from './MarkdownRenderer.tsx';
import { PastQuestion } from '../types.ts';

interface QuestionRendererProps {
  question: PastQuestion;
  questionContent?: string;
  className?: string;
  imageClassName?: string;
  forceLightMode?: boolean;
  renderOptions?: boolean;
}

const QuestionRenderer: React.FC<QuestionRendererProps> = ({ question, questionContent, className = '', imageClassName = '', forceLightMode = false, renderOptions = true }) => {
  const content = questionContent || question?.question || '';
  const hasPlaceholder = content.includes('[IMAGE]');
  const hasDiagram = !!question.questionDiagram;

  if (hasDiagram && hasPlaceholder) {
    const parts = content.split('[IMAGE]');
    return (
      <div className={className}>
        {parts.map((part, index) => (
          <React.Fragment key={index}>
            <MarkdownRenderer content={part} forceLightMode={forceLightMode} />
            {index < parts.length - 1 && (
              <div className="my-4 flex justify-center">
                <img src={question.questionDiagram} alt="Question diagram" className={`max-w-full h-auto rounded-lg border bg-white shadow-sm dark:border-slate-600 ${imageClassName}`} />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    );
  }

  // Fallback to original behavior
  return (
    <div className={className}>
      {content ? (
        <MarkdownRenderer content={content} forceLightMode={forceLightMode} />
      ) : (
        <p className="text-slate-400 italic">Question text not available.</p>
      )}
      {hasDiagram && (
        <div className="my-4 flex justify-center">
          <img src={question.questionDiagram} alt="Question diagram" className={`max-w-full h-auto rounded-lg border bg-white shadow-sm dark:border-slate-600 ${imageClassName}`} />
        </div>
      )}

      {/* Render Options if available and requested */}
      {renderOptions && question.options && Object.keys(question.options).length > 0 && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Object.entries(question.options).map(([key, option]) => (
            <div key={key} className={`flex items-start gap-3 p-3 rounded-xl border ${forceLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
              <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${forceLightMode ? 'bg-slate-200 text-slate-600' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                {key}
              </span>
              <div className={`text-sm ${forceLightMode ? 'text-slate-700' : 'text-slate-700 dark:text-slate-300'}`}>
                <MarkdownRenderer content={option.text} forceLightMode={forceLightMode} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuestionRenderer;
