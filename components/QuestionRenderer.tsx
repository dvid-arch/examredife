import React from 'react';
import MarkdownRenderer from './MarkdownRenderer.tsx';
import { PastQuestion } from '../types.ts';

interface QuestionRendererProps {
  question: PastQuestion;
  questionContent?: string;
  className?: string;
  imageClassName?: string;
}

const QuestionRenderer: React.FC<QuestionRendererProps> = ({ question, questionContent, className = '', imageClassName = '' }) => {
  const content = questionContent || question.question;
  const hasPlaceholder = content.includes('[IMAGE]');
  const hasDiagram = !!question.questionDiagram;

  if (hasDiagram && hasPlaceholder) {
    const parts = content.split('[IMAGE]');
    return (
      <div className={className}>
        {parts.map((part, index) => (
          <React.Fragment key={index}>
            <MarkdownRenderer content={part} />
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
      <MarkdownRenderer content={content} />
      {hasDiagram && (
         <div className="my-4 flex justify-center">
            <img src={question.questionDiagram} alt="Question diagram" className={`max-w-full h-auto rounded-lg border bg-white shadow-sm dark:border-slate-600 ${imageClassName}`} />
        </div>
      )}
    </div>
  );
};

export default QuestionRenderer;
