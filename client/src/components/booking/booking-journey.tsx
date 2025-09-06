import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, CheckCircle, XCircle, Circle, ArrowRight } from "lucide-react";
import { format } from "date-fns";

interface BookingJourneyProps {
  bookingId: number;
}

interface JourneyMilestone {
  stage: string;
  status: string;
  actor: {
    id: number;
    name: string;
  } | null;
  timestamp: string;
  notes: string | null;
}

function JourneyIcon({ status }: { status: string }) {
  switch (status) {
    case "Submitted":
      return <Circle className="h-5 w-5 text-gray-500" />;
    case "Approved":
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case "Rejected":
      return <XCircle className="h-5 w-5 text-red-500" />;
    case "Allocated":
      return <CheckCircle className="h-5 w-5 text-blue-500" />;
    default:
      return <Circle className="h-5 w-5 text-gray-500" />;
  }
}

export default function BookingJourney({ bookingId }: BookingJourneyProps) {
  const { data: journey, isLoading, isError } = useQuery<JourneyMilestone[]>({
    queryKey: [`/api/bookings/${bookingId}/journey`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/bookings/${bookingId}/journey`);
      if (!res.ok) {
        throw new Error("Failed to fetch booking journey");
      }
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return <p className="text-red-500">Failed to load booking journey.</p>;
  }

  return (
    <div className="h-full flex flex-col">
      <h3 className="text-lg font-semibold mb-4">Booking Journey</h3>
      <div className="relative flex-grow overflow-y-auto pr-2">
        <div className="border-l-2 border-gray-200 absolute h-full left-2.5"></div>
        <ul className="space-y-8">
          {journey?.map((milestone, index) => (
            <li key={index} className="flex items-start relative">
              <div className="flex-shrink-0 w-5 h-5 bg-white rounded-full flex items-center justify-center z-10">
                <JourneyIcon status={milestone.status} />
              </div>
              <div className="ml-4 bg-gray-50 p-3 rounded-lg shadow-sm flex-grow">
                <p className="font-bold text-sm">{milestone.stage}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {format(new Date(milestone.timestamp), "PPP p")}
                </p>
                {milestone.actor && (
                  <p className="text-xs mt-1">
                    <span className="font-medium">By:</span> {milestone.actor.name}
                  </p>
                )}
                {milestone.notes && (
                  <p className="text-xs italic mt-1 text-gray-700">Notes: {milestone.notes}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
