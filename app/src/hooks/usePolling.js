import { useEffect, useRef } from 'react';

export default function usePolling(callback, interval = 15000, isEnabled = true) {
  const savedCallback = useRef(callback);

  // Remember the latest callback if it changes
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval
  useEffect(() => {
    if (!isEnabled) {
      return;
    }

    const tick = () => {
      savedCallback.current();
    };

    const id = setInterval(tick, interval);
    return () => clearInterval(id);
  }, [interval, isEnabled]);
}
