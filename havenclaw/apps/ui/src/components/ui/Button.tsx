import type { ButtonHTMLAttributes } from 'react'
import { forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2'
    
    const variants = {
      primary: 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white focus:ring-indigo-500',
      secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-900 focus:ring-gray-500',
      outline: 'border-2 border-gray-300 hover:bg-gray-50 text-gray-700 focus:ring-gray-500',
      ghost: 'hover:bg-gray-100 text-gray-700 focus:ring-gray-500',
    }
    
    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    }
    
    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      />
    )
  }
)

Button.displayName = 'Button'
