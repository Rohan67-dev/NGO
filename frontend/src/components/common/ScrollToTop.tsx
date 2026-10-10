import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** Scrolls to the top when the route path changes (filters/pagination on the same path keep their position). */
export const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};
