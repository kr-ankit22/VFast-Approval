import { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: string;
    positive?: boolean;
  };
  className?: string;
  iconClassName?: string;
}

export default function StatsCard({ 
  title, 
  value, 
  icon, 
  trend, 
  className, 
  iconClassName 
}: StatsCardProps) {
  return (
    <Card className={cn("p-4", className)}>
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <h3 className="text-2xl font-bold">{value}</h3>
        </div>
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center",
          iconClassName || "bg-blue-100 text-blue-500"
        )}>
          {icon}
        </div>
      </div>
      
      {trend && (
        <div className={cn(
          "mt-2 text-xs flex items-center",
          trend.positive ? "text-green-600" : "text-red-600"
        )}>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-3 w-3 mr-1" 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            {trend.positive ? (
              <path 
                fillRule="evenodd" 
                d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" 
                clipRule="evenodd" 
              />
            ) : (
              <path 
                fillRule="evenodd" 
                d="M12 13a1 1 0 100 2h5a1 1 0 001-1v-5a1 1 0 10-2 0v2.586l-4.293-4.293a1 1 0 00-1.414 0L8 9.586l-4.293-4.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0L11 9.414 14.586 13H12z" 
                clipRule="evenodd" 
              />
            )}
          </svg>
          {trend.value}
        </div>
      )}
    </Card>
  );
}
