import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { User } from "@shared/schema";
import { format } from "date-fns";

interface RejectionHistoryProps {
  rejectionHistory: {
    reason: string;
    rejectedBy: number;
    rejectedAt: string;
  }[];
}

function RejecterName({ userId }: { userId: number }) {
  const { data: user, isLoading } = useQuery<User>({
    queryKey: [`/api/users/${userId}`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/users/${userId}`);
      if (!res.ok) {
        throw new Error("Failed to fetch user details");
      }
      return res.json();
    },
  });

  if (isLoading) return <span>Loading...</span>;
  return <span>{user?.name}</span>;
}

export default function RejectionHistory({ rejectionHistory }: RejectionHistoryProps) {
  if (!rejectionHistory || rejectionHistory.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">Rejection History</h2>
      <div className="space-y-4">
        {rejectionHistory.map((rejection, index) => (
          <div key={index} className="bg-red-50 p-4 rounded-lg">
            <p className="font-bold">Rejected by: <RejecterName userId={rejection.rejectedBy} /></p>
            <p>Reason: {rejection.reason}</p>
            <p className="text-sm text-gray-500">Date: {format(new Date(rejection.rejectedAt), "PPP")}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
