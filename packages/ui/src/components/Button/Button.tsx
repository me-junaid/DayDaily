import React from 'react';
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
}
export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  return <button className={`px-4 py-2 rounded-lg font-medium ${className}`} {...props} />;
}
