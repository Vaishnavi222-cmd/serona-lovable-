
import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Clock, Calendar, CalendarDays, CheckCircle2, X } from "lucide-react";

// Memoize the plans array since it never changes
const plans = [
  {
    type: 'hourly',
    title: 'Hourly Access',
    price: 25,
    duration: '1 hour',
    features: [
      'Full access for 1 hour',
      'Detailed responses',
      'Instant activation',
      'One-time payment/no recurring charges'
    ],
    icon: <Clock className="w-5 h-5" />,
  },
  {
    type: 'daily',
    title: 'Daily Access',
    price: 150,
    duration: '12 hours',
    features: [
      'Extended 12-hour access',
      'Comprehensive responses',
      'Higher usage limits',
      'One-time payment/no recurring charges'
    ],
    icon: <Calendar className="w-5 h-5" />,
  },
  {
    type: 'monthly',
    title: 'Monthly Access',
    price: 2999,
    duration: '30 days',
    features: [
      'Full month access',
      'Unlimited detailed responses',
      'Priority processing',
      'One-time payment/no recurring charges'
    ],
    icon: <CalendarDays className="w-5 h-5" />,
  },
] as const;

interface Plan {
  type: 'hourly' | 'daily' | 'monthly';
  title: string;
  price: number;
  duration: string;
  features: string[];
  icon: React.ReactNode;
}

interface UpgradePlansDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectPlan: (planType: 'hourly' | 'daily' | 'monthly') => void;
}

// Memoize the plan card component to prevent unnecessary re-renders
const PlanCard = React.memo(({ 
  plan, 
  onSelect 
}: { 
  plan: Plan; 
  onSelect: (e: React.MouseEvent, type: 'hourly' | 'daily' | 'monthly') => void;
}) => (
  <div className="relative p-4 sm:p-6 rounded-xl bg-white border border-gray-200 hover:border-[#1EAEDB] hover:shadow-md transition-all">
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-[#1EAEDB]">
          {plan.icon}
          <h3 className="text-lg font-semibold">{plan.title}</h3>
        </div>
        <p className="text-sm text-gray-600">{plan.duration}</p>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold">₹{plan.price}</span>
          <span className="text-gray-500 text-sm">
            {plan.type === 'monthly' ? '/mo' : ''}
          </span>
        </div>
      </div>
      <ul className="space-y-3">
        {plan.features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2 text-sm">
            <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <Button
        type="button"
        onClick={(e) => onSelect(e, plan.type)}
        className="w-full bg-[#1EAEDB] hover:bg-[#1EAEDB]/90"
      >
        Get Started
      </Button>
    </div>
  </div>
));

PlanCard.displayName = 'PlanCard';

export function UpgradePlansDialog({
  open,
  onOpenChange,
  onSelectPlan,
}: UpgradePlansDialogProps) {
  // Memoize the handleSelectPlan callback
  const handleSelectPlan = React.useCallback((e: React.MouseEvent, planType: 'hourly' | 'daily' | 'monthly') => {
    e.preventDefault();
    e.stopPropagation();
    onSelectPlan(planType);
  }, [onSelectPlan]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] w-[95%] p-0 h-[90vh] sm:h-auto overflow-auto">
        <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground z-50">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogClose>
        <DialogHeader className="p-6 pb-2 sticky top-0 bg-white z-10 border-b">
          <DialogTitle className="text-2xl font-semibold text-center">
            Upgrade Your Experience
          </DialogTitle>
          <DialogDescription className="text-center">
            Choose the plan that best fits your needs
          </DialogDescription>
        </DialogHeader>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 p-4 sm:p-6 bg-gray-50/50">
          {plans.map((plan) => (
            <PlanCard 
              key={plan.type} 
              plan={plan} 
              onSelect={handleSelectPlan}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
