import React from 'react';

export default function LoadingSpinner({ size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div className={`flex flex-col items-center justify-center space-y-2 ${className}`}>
      <div
        className={`${sizeClasses[size]} border-t-amber-500 border-r-transparent border-b-amber-500 border-l-transparent rounded-full animate-spin`}
      />
      <span className="text-sm font-medium text-slate-500 animate-pulse">Loading...</span>
    </div>
  );
}
