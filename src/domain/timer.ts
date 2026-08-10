export type TimerUrgency = 'normal' | 'warning' | 'danger';

export const getTimerState = (initialMs: number, elapsedMs: number, totalMs = 45_000) => {
  const remainingMs = Math.max(0, initialMs - elapsedMs);
  const seconds = Math.ceil(remainingMs / 1000);
  const urgency: TimerUrgency = seconds <= 5 ? 'danger' : seconds <= 15 ? 'warning' : 'normal';
  return {
    remainingMs,
    seconds,
    urgency,
    percent: Math.max(0, Math.min(100, (remainingMs / totalMs) * 100)),
    expired: remainingMs === 0,
  };
};
