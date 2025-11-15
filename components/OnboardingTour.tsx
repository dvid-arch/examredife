
import React, { useState, useLayoutEffect, useRef } from 'react';

interface TourStep {
  selector: string;
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

interface OnboardingTourProps {
  steps: TourStep[];
  onComplete: () => void;
}

const OnboardingTour: React.FC<OnboardingTourProps> = ({ steps, onComplete }) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  
  const currentStep = steps[stepIndex];

  useLayoutEffect(() => {
    if (!currentStep) return;

    const targetElement = document.querySelector(currentStep.selector) as HTMLElement;
    
    document.querySelectorAll('.tour-highlight').forEach(el => el.classList.remove('tour-highlight'));

    if (targetElement) {
        targetElement.classList.add('tour-highlight');
        const rect = targetElement.getBoundingClientRect();
        setTargetRect(rect);
        // Gently scroll the element into view if it's not fully visible
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    } else {
        setTargetRect(null); // Handle cases where element is not found, hiding the tooltip
    }
    
    return () => {
        if (targetElement) {
            targetElement.classList.remove('tour-highlight');
        }
    };
  }, [stepIndex, currentStep]);

  const handleNext = () => {
    if (stepIndex < steps.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (stepIndex > 0) {
      setStepIndex(stepIndex - 1);
    }
  };

  const handleComplete = () => {
      document.querySelectorAll('.tour-highlight').forEach(el => el.classList.remove('tour-highlight'));
      onComplete();
  };
  
  const getTooltipPosition = () => {
      if (!targetRect || !tooltipRef.current) return { visibility: 'hidden' as const };
      
      const tooltipHeight = tooltipRef.current.offsetHeight;
      const tooltipWidth = tooltipRef.current.offsetWidth;
      const space = 15; // Increased space for better visual separation
      
      let top = targetRect.top + (targetRect.height / 2) - (tooltipHeight / 2);
      let left = targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2);

      const position = currentStep.position || 'bottom';

      switch (position) {
          case 'bottom':
              top = targetRect.bottom + space;
              left = targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2);
              break;
          case 'top':
              top = targetRect.top - tooltipHeight - space;
              left = targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2);
              break;
          case 'left':
              top = targetRect.top + (targetRect.height / 2) - (tooltipHeight / 2);
              left = targetRect.left - tooltipWidth - space;
              break;
          case 'right':
              top = targetRect.top + (targetRect.height / 2) - (tooltipHeight / 2);
              left = targetRect.right + space;
              break;
      }
      
      // Boundary checks to keep tooltip on screen
      if (top < space) top = space;
      if (left < space) left = space;
      if (left + tooltipWidth > window.innerWidth) left = window.innerWidth - tooltipWidth - space;
      if (top + tooltipHeight > window.innerHeight) top = window.innerHeight - tooltipHeight - space;
      
      return { top: `${top}px`, left: `${left}px`, visibility: 'visible' as const };
  };

  if (!currentStep) return null;

  return (
    <div className="fixed inset-0 z-[990] pointer-events-none">
        {/* Invisible layer to catch clicks and close the tour */}
        <div className="fixed inset-0 z-[998] pointer-events-auto" onClick={handleComplete}></div>

        <div 
            ref={tooltipRef}
            className={`tour-tooltip bg-white dark:bg-slate-800 pointer-events-auto ${!targetRect ? 'tour-modal' : ''}`} 
            style={getTooltipPosition()}
        >
            <div className="p-4">
                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-50">{currentStep.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">{currentStep.content}</p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-slate-700/50 flex justify-between items-center rounded-b-lg">
                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">{stepIndex + 1} / {steps.length}</span>
                <div className="flex items-center gap-2">
                     <button onClick={handleComplete} className="text-sm font-semibold text-slate-600 dark:text-slate-300 px-3 py-1 rounded hover:bg-gray-200 dark:hover:bg-slate-600">
                        Skip
                    </button>
                    {stepIndex > 0 && (
                        <button onClick={handlePrev} className="text-sm font-semibold text-slate-600 dark:text-slate-300 px-3 py-1 rounded hover:bg-gray-200 dark:hover:bg-slate-600">
                            Back
                        </button>
                    )}
                    <button onClick={handleNext} className="text-sm font-bold text-white bg-primary px-4 py-1.5 rounded-lg hover:bg-accent">
                        {stepIndex === steps.length - 1 ? 'Finish' : 'Next'}
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};

export default OnboardingTour;