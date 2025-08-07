interface AgreementDebugPanelProps {
  agreements: any[];
  isLoading: boolean;
  error?: any;
  searchParams?: any;
}

export const AgreementDebugPanel = ({ agreements, isLoading, error, searchParams }: AgreementDebugPanelProps) => {
  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="bg-gray-100 border border-gray-300 rounded p-4 mb-4 text-sm">
      <h3 className="font-bold mb-2">🔍 Debug Info</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}
        </div>
        <div>
          <strong>Error:</strong> {error ? error.message || 'Unknown error' : 'None'}
        </div>
        <div>
          <strong>Agreements Count:</strong> {agreements?.length || 0}
        </div>
        <div>
          <strong>Search Params:</strong> {JSON.stringify(searchParams || {})}
        </div>
      </div>
      {agreements?.length > 0 && (
        <div className="mt-2">
          <strong>Sample Agreement:</strong>
          <pre className="text-xs bg-white p-2 rounded mt-1 overflow-auto max-h-20">
            {JSON.stringify(agreements[0], null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};