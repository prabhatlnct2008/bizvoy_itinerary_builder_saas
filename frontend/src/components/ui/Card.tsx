import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
}

const Card: React.FC<CardProps> = ({ children, className = '', padding = true }) => {
  return (
    <div className={`bg-white border border-slate-200 rounded-xl ${padding ? 'p-4' : ''} ${className}`}>
      {children}
    </div>
  );
};

export default Card;
