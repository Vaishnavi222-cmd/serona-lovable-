
import { Button } from "@/components/ui/button";

interface UserMenuTriggerProps {
  userEmail: string | undefined;
}

export function UserMenuTrigger({ userEmail }: UserMenuTriggerProps) {
  return (
    <Button variant="ghost" className="relative h-9 w-9 rounded-full bg-[#1EAEDB]">
      <span className="h-9 w-9 rounded-full flex items-center justify-center text-white font-medium">
        {userEmail?.charAt(0).toUpperCase() ?? 'U'}
      </span>
    </Button>
  );
}
