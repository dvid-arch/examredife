
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-sm dark:border dark:border-slate-700/50 ${className}`}>
      {children}
    </div>
  );
};

export default Card;