import React from 'react';

const Button = ({ onClick, disabled, children, className = '' }) => {
  return (
    <button
      className={`py-2 px-4 bg-white text-cyan-700 rounded hover:bg-gray-100 transition-colors duration-200 ease-in-out ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button;
