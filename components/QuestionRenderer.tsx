import React from 'react';
import MarkdownRenderer from './MarkdownRenderer.tsx';
import { PastQuestion } from '../types.ts';
import SpeechButton from './SpeechButton.tsx';

interface QuestionRendererProps {
  question: PastQuestion;
  questionContent?: string;
  className?: string;
  imageClassName?: string;
  forceLightMode?: boolean;
  renderOptions?: boolean;
  correctAnswer?: string;
}

const QuestionRenderer: React.FC<QuestionRendererProps> = ({ question, questionContent, className = '', imageClassName = '', forceLightMode = false, renderOptions = true, correctAnswer }) => {
  const content = questionContent || question?.question || '';

  // Prepare text for reading: Question + Options
  const getSpeechText = () => {
    let text = content;
    if (renderOptions && question.options) {
      text += '. Options are: ';
      text += Object.entries(question.options)
        .map(([key, opt]) => `${key}: ${opt.text}`)
        .join('. ');
    }
    return text;
  };
  const hasPlaceholder = content.includes('[IMAGE]');
  const hasDiagram = !!question.questionDiagram;

  if (hasDiagram && hasPlaceholder) {
    const parts = content.split('[IMAGE]');
    return (
      <div className={className}>
        <div className="mb-2">
          <SpeechButton text={getSpeechText()} size="sm" variant="ghost" showText={false} className="bg-slate-50 dark:bg-slate-800/50" />
        </div>
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
      <div className="mb-2">
        <SpeechButton text={getSpeechText()} size="sm" variant="ghost" showText={false} className="bg-slate-50 dark:bg-slate-800/50" />
      </div>
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
        <div className="mt-3 sm:mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
          {Object.entries(question.options).map(([key, option]) => {
            const isCorrect = key === correctAnswer;
            return (
              <div key={key} className={`flex items-start gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-lg border transition-all ${isCorrect
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 ring-1 ring-green-100 dark:ring-green-900/30'
                : forceLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                }`}>
                <span className={`flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-md flex items-center justify-center text-[10px] sm:text-xs font-bold ${isCorrect
                  ? 'bg-green-500 text-white'
                  : forceLightMode ? 'bg-slate-200 text-slate-600' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}>
                  {key}
                </span>
                <div className={`text-sm ${isCorrect
                  ? 'text-green-800 dark:text-green-200 font-medium'
                  : forceLightMode ? 'text-slate-700' : 'text-slate-700 dark:text-slate-300'
                  }`}>
                  <MarkdownRenderer content={option.text} forceLightMode={forceLightMode} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default QuestionRenderer;
