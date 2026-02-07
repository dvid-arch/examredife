import React from 'react';
import MarkdownRenderer from './MarkdownRenderer.tsx';
import { PastQuestion } from '../types.ts';

interface QuestionRendererProps {
  question: PastQuestion;
  questionContent?: string;
  className?: string;
  imageClassName?: string;
  forceLightMode?: boolean;
}

const QuestionRenderer: React.FC<QuestionRendererProps> = ({ question, questionContent, className = '', imageClassName = '', forceLightMode = false }) => {
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
    </div>
  );
};

export default QuestionRenderer;
