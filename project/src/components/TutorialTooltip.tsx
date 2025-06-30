import React, { useState, useEffect, useRef } from 'react';
import { X, ArrowLeft, ArrowRight, Play, SkipForward } from 'lucide-react';

interface TutorialStep {
  id: string;
  title: string;
  content: string;
  target: string; // CSS selector for the element to highlight
  position: 'top' | 'bottom' | 'left' | 'right';
  action?: () => void; // Optional action to perform when step is shown
  waitForElement?: boolean; // Wait for target element to exist
}

interface TutorialTooltipProps {
  steps: TutorialStep[];
  isActive: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

const TutorialTooltip: React.FC<TutorialTooltipProps> = ({ 
  steps, 
  isActive, 
  onComplete, 
  onSkip 
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  const currentStepData = steps[currentStep];

  useEffect(() => {
    if (!isActive || !currentStepData) return;

    const findTarget = () => {
      const element = document.querySelector(currentStepData.target) as HTMLElement;
      if (element) {
        setTargetElement(element);
        calculatePosition(element);
        
        // Execute step action if provided
        if (currentStepData.action) {
          setTimeout(currentStepData.action, 100);
        }
        
        return true;
      }
      return false;
    };

    if (currentStepData.waitForElement) {
      // Poll for element if it might not exist yet
      const pollInterval = setInterval(() => {
        if (findTarget()) {
          clearInterval(pollInterval);
        }
      }, 100);

      // Stop polling after 5 seconds
      setTimeout(() => clearInterval(pollInterval), 5000);
      
      return () => clearInterval(pollInterval);
    } else {
      findTarget();
    }
  }, [currentStep, isActive, currentStepData]);

  const calculatePosition = (target: HTMLElement) => {
    if (!tooltipRef.current) return;

    const targetRect = target.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    let top = 0;
    let left = 0;

    switch (currentStepData.position) {
      case 'top':
        top = targetRect.top - tooltipRect.height - 16;
        left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
        break;
      case 'bottom':
        top = targetRect.bottom + 16;
        left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
        break;
      case 'left':
        top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
        left = targetRect.left - tooltipRect.width - 16;
        break;
      case 'right':
        top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
        left = targetRect.right + 16;
        break;
    }

    // Keep tooltip within viewport
    if (left < 16) left = 16;
    if (left + tooltipRect.width > viewportWidth - 16) {
      left = viewportWidth - tooltipRect.width - 16;
    }
    if (top < 16) top = 16;
    if (top + tooltipRect.height > viewportHeight - 16) {
      top = viewportHeight - tooltipRect.height - 16;
    }

    setTooltipPosition({ top, left });
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onSkip();
  };

  if (!isActive || !currentStepData) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-40 z-40 pointer-events-none">
        {/* Highlight target element */}
        {targetElement && (
          <div
            className="absolute border-4 border-blue-400 rounded-lg pointer-events-none animate-pulse"
            style={{
              top: targetElement.getBoundingClientRect().top - 4,
              left: targetElement.getBoundingClientRect().left - 4,
              width: targetElement.getBoundingClientRect().width + 8,
              height: targetElement.getBoundingClientRect().height + 8,
              boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.3)',
            }}
          />
        )}
      </div>

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="fixed z-50 bg-white rounded-xl shadow-2xl max-w-sm border border-gray-200 pointer-events-auto"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
        }}
      >
        {/* Arrow pointer */}
        <div
          className={`absolute w-3 h-3 bg-white border rotate-45 ${
            currentStepData.position === 'top' ? 'bottom-[-7px] border-b border-r' :
            currentStepData.position === 'bottom' ? 'top-[-7px] border-t border-l' :
            currentStepData.position === 'left' ? 'right-[-7px] border-r border-b' :
            'left-[-7px] border-l border-t'
          }`}
          style={{
            left: currentStepData.position === 'top' || currentStepData.position === 'bottom' ? '50%' : undefined,
            top: currentStepData.position === 'left' || currentStepData.position === 'right' ? '50%' : undefined,
            transform: currentStepData.position === 'top' || currentStepData.position === 'bottom' ? 'translateX(-50%)' : 
                      currentStepData.position === 'left' || currentStepData.position === 'right' ? 'translateY(-50%)' : undefined,
          }}
        />

        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Play className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-gray-500">
                Step {currentStep + 1} of {steps.length}
              </span>
            </div>
            <button
              onClick={handleSkip}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-full transition-colors"
              title="Skip tutorial"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {currentStepData.title}
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              {currentStepData.content}
            </p>
          </div>

          {/* Progress bar */}
          <div className="mb-6">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Progress</span>
              <span>{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                currentStep === 0
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <div className="flex space-x-2">
              <button
                onClick={handleSkip}
                className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm transition-colors"
              >
                <SkipForward className="w-4 h-4" />
                <span>Skip</span>
              </button>

              <button
                onClick={nextStep}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-sm hover:from-blue-700 hover:to-purple-700 transition-colors"
              >
                <span>{currentStep === steps.length - 1 ? 'Finish' : 'Next'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TutorialTooltip;