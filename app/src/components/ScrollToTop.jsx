import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Attempt to scroll main document
    window.scrollTo(0, 0);
    // If there is an internal scrollable container, attempt to scroll it too
    const root = document.getElementById('root');
    if (root) root.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
