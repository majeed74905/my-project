import { useState, useEffect, useRef } from 'react';

export const useExamTimer = (
  initialMinutes: number, 
  onTimeUp: () => void,
  isActive: boolean
) => {
  // Store end time in state/ref to survive re-renders, or ideally localStorage if strict
  const [timeLeft, setTimeLeft] = useState(initialMinutes * 60);
  const [isRunning, setIsRunning] = useState(isActive);

  useEffect(() => {
    setIsRunning(isActive);
  }, [isActive]);

  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, onTimeUp]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return { minutes, seconds, isRunning };
};