interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Spinner = ({ size = 'md', className = '' }: SpinnerProps) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <div
      className={`animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600 ${sizeClasses[size]} ${className}`}
      aria-label="Loading"
    />
  );
};

/**
 * Full page spinner
 */
export const FullPageSpinner = () => (
  <div className="flex h-screen items-center justify-center">
    <Spinner size="lg" />
  </div>
);
