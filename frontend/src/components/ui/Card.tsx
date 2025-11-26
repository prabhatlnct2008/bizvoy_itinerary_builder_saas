import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
}

const Card: React.FC<CardProps> = ({ children, className = '', padding = true }) => {
  return (
    <div className={`card ${padding ? 'p-24' : ''} ${className}`}>
      {children}
    </div>
  );
};

export default Card;
