import { useState, useEffect } from 'react';

interface TutorialState {
  isActive: boolean;
  hasCompletedBefore: boolean;
  currentTutorial: string | null;
}

export const useTutorial = (tutorialId: string) => {
  const [tutorialState, setTutorialState] = useState<TutorialState>({
    isActive: false,
    hasCompletedBefore: false,
    currentTutorial: null,
  });

  const STORAGE_KEY = `tutorial_${tutorialId}`;

  useEffect(() => {
    // Check if user has completed this tutorial before
    const completed = localStorage.getItem(STORAGE_KEY) === 'completed';
    const isFirstTime = localStorage.getItem('user_first_visit') !== 'false';
    
    setTutorialState({
      isActive: false,
      hasCompletedBefore: completed,
      currentTutorial: null,
    });

    // Auto-start tutorial on first visit if not completed
    if (isFirstTime && !completed && tutorialId === 'main') {
      setTimeout(() => startTutorial(), 1000); // Delay to let page load
      localStorage.setItem('user_first_visit', 'false');
    }
  }, [tutorialId]);

  const startTutorial = () => {
    setTutorialState(prev => ({
      ...prev,
      isActive: true,
      currentTutorial: tutorialId,
    }));
  };

  const completeTutorial = () => {
    localStorage.setItem(STORAGE_KEY, 'completed');
    setTutorialState(prev => ({
      ...prev,
      isActive: false,
      hasCompletedBefore: true,
      currentTutorial: null,
    }));
  };

  const skipTutorial = () => {
    localStorage.setItem(STORAGE_KEY, 'skipped');
    setTutorialState(prev => ({
      ...prev,
      isActive: false,
      currentTutorial: null,
    }));
  };

  const resetTutorial = () => {
    localStorage.removeItem(STORAGE_KEY);
    setTutorialState(prev => ({
      ...prev,
      hasCompletedBefore: false,
    }));
  };

  return {
    ...tutorialState,
    startTutorial,
    completeTutorial,
    skipTutorial,
    resetTutorial,
  };
};