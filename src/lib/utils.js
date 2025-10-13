
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatTimeWithAMPM(date = new Date()) {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
}

export function formatTimer(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

export function startThemeBlinking(setIsDarkMode, stopBlinking) {
  let blinkCount = 0;
  const maxBlinks = 20; // 10 seconds with 500ms intervals
  const blinkInterval = setInterval(() => {
    if (blinkCount >= maxBlinks) {
      clearInterval(blinkInterval);
      return;
    }
    setIsDarkMode(prev => !prev);
    blinkCount++;
  }, 500);

  const cleanup = () => {
    clearInterval(blinkInterval);
    stopBlinking();
  };

  document.addEventListener('touchstart', cleanup, { once: true });
  document.addEventListener('mouseover', cleanup, { once: true });

  // Auto cleanup after 10 seconds
  setTimeout(cleanup, 10000);

  return cleanup;
}
