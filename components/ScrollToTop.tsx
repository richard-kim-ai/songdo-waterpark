'use client';

import { useEffect, useState } from 'react';

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 400);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="맨 위로 이동"
      className="fixed right-6 bottom-24 md:bottom-6 z-40 w-12 h-12 flex items-center justify-center bg-primary text-white rounded-full shadow-lg hover:bg-opacity-90 transition-all cursor-pointer"
    >
      <i className="ri-arrow-up-line text-2xl"></i>
    </button>
  );
}
