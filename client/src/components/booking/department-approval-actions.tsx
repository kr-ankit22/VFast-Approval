import { Button } from "@/components/ui/button";

type DepartmentApprovalActionsProps = {
  onApprove: () => void;
  onReject: () => void;
};

export default function DepartmentApprovalActions({ onApprove, onReject }: DepartmentApprovalActionsProps) {
  return (
    <div className="flex gap-2">
      <Button size="sm" onClick={onApprove}>
        Approve
      </Button>
      <Button size="sm" variant="destructive" onClick={onReject}>
        Reject
      </Button>
    </div>
  );
}
