import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface CheckInDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCheckIn: () => void;
  isCheckingIn: boolean;
}

export default function CheckInDialog({ open, onOpenChange, onCheckIn, isCheckingIn }: CheckInDialogProps) {
  const [keyHandedOver, setKeyHandedOver] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Check-in</DialogTitle>
          <DialogDescription>
            Please confirm that the guest has completed all the necessary formalities and the key has been handed over.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-2 my-4">
          <Checkbox id="key-handed-over-confirm" checked={keyHandedOver} onCheckedChange={() => setKeyHandedOver(!keyHandedOver)} />
          <Label htmlFor="key-handed-over-confirm">Key has been handed over</Label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onCheckIn} disabled={!keyHandedOver || isCheckingIn}>
            {isCheckingIn ? "Checking in..." : "Confirm Check-in"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
