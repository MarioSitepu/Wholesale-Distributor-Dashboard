type ErrorMessageProps = {
  message?: string;
};

export const InputError = ({ message }: ErrorMessageProps) => {
  if (!message) return null;

  return (
    <span className="mt-1 flex items-center gap-1 text-xs text-red-500">
      ⚠️ {message}
    </span>
  );
};
