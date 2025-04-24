import { Badge } from "@/components/ui/badge";
import { BookingStatus } from "@shared/schema";
import { cn } from "@/lib/utils";

interface BookingStatusBadgeProps {
  status: BookingStatus;
  className?: string;
}

export default function BookingStatusBadge({ status, className }: BookingStatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case BookingStatus.PENDING:
        return {
          className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
          label: "Pending"
        };
      case BookingStatus.APPROVED:
        return {
          className: "bg-green-100 text-green-800 hover:bg-green-100",
          label: "Approved"
        };
      case BookingStatus.REJECTED:
        return {
          className: "bg-red-100 text-red-800 hover:bg-red-100",
          label: "Rejected"
        };
      case BookingStatus.ALLOCATED:
        return {
          className: "bg-blue-100 text-blue-800 hover:bg-blue-100",
          label: "Allocated"
        };
      default:
        return {
          className: "bg-gray-100 text-gray-800 hover:bg-gray-100",
          label: "Unknown"
        };
    }
  };

  const { className: statusClassName, label } = getStatusConfig();

  return (
    <Badge 
      variant="outline" 
      className={cn(
        "px-2 py-1 rounded-full text-xs font-semibold border-0",
        statusClassName,
        className
      )}
    >
      {label}
    </Badge>
  );
}
