import React, { useEffect, useState } from 'react';

export interface AnimatedPageProps {
  children: React.ReactNode;
  className?: string;
}

export const AnimatedPage: React.FC<AnimatedPageProps> = ({ children, className = '' }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handle = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(handle);
  }, []);

  return (
    <div
      className={`relative h-full w-full transition-opacity duration-300 ease-in-out ${visible ? 'opacity-100' : 'opacity-0'} ${className}`}
    >
      {children}
    </div>
  );
};

export default AnimatedPage;
