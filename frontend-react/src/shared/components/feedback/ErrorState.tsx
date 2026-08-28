interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  error?: string;
}

export const ErrorState = ({
  title = 'Có lỗi xảy ra',
  description = 'Không thể tải dữ liệu. Vui lòng thử lại.',
  onRetry,
  error,
}: ErrorStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-4 text-5xl">⚠️</div>
      <h3 className="mb-2 text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mb-6 text-sm text-gray-600">{description}</p>
      {error && <p className="mb-6 text-xs text-red-600">{error}</p>}
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Thử lại
        </button>
      )}
    </div>
  );
};
