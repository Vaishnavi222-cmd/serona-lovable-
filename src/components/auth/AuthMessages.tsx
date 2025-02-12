
interface AuthMessagesProps {
  errorMessage?: string;
  successMessage?: string;
}

export function AuthMessages({ errorMessage, successMessage }: AuthMessagesProps) {
  if (!errorMessage && !successMessage) return null;
  
  return (
    <>
      {errorMessage && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{errorMessage}</p>
        </div>
      )}

      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-600 text-sm">{successMessage}</p>
        </div>
      )}
    </>
  );
}
