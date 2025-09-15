import { CheckCircle } from "lucide-react";

interface SectionHeaderProps {
  title: string;
  isCompleted: boolean;
}

export default function SectionHeader({ title, isCompleted }: SectionHeaderProps) {
  return (
    <div className={`flex items-center space-x-2 p-4 rounded-t-lg ${isCompleted ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
      {isCompleted && <CheckCircle className="h-5 w-5" />}
      <h3 className="text-lg font-semibold">{title}</h3>
    </div>
  );
}
