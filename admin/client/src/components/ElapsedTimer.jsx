import { useState, useEffect } from 'react';

/**
 * Displays a live elapsed timer since the order was created.
 * Turns amber at 10 min, red-urgent at 20 min.
 */
export default function ElapsedTimer({ createdAt }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = new Date(createdAt).getTime();

    const tick = () => {
      const diff = Math.floor((Date.now() - start) / 1000);
      setElapsed(diff);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [createdAt]);

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const display = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  const colorClass =
    mins >= 20
      ? 'text-red-600 timer-urgent'
      : mins >= 10
      ? 'text-amber-600'
      : 'text-stone-500';

  return (
    <span
      className={`text-xs font-mono font-bold tracking-widest ${colorClass}`}
      title={`Order placed at ${new Date(createdAt).toLocaleTimeString()}`}
    >
      ⏱ {display}
    </span>
  );
}
