interface ReassignmentDetailsProps {
  reassignmentId: string;
}

export function ReassignmentDetails({ reassignmentId }: ReassignmentDetailsProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Reassignment Details</h3>
      <p>Reassignment ID: {reassignmentId}</p>
      {/* Add more reassignment details here */}
    </div>
  );
}
