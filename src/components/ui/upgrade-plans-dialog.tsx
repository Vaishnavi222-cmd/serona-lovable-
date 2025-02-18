
import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Clock, Calendar, CalendarDays, Zap } from "lucide-react";

interface Plan {
  type: 'hourly' | 'daily' | 'monthly';
  title: string;
  price: number;
  duration: string;
  outputTokens: string;
  inputTokens: string;
  icon: React.ReactNode;
}

interface UpgradePlansDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectPlan: (planType: 'hourly' | 'daily' | 'monthly') => void;
}

export function UpgradePlansDialog({
  open,
  onOpenChange,
  onSelectPlan,
}: UpgradePlansDialogProps) {
  const plans: Plan[] = [
    {
      type: 'hourly',
      title: 'Hourly Plan',
      price: 25,
      duration: '1 hour',
      outputTokens: '9,000',
      inputTokens: '5,000',
      icon: <Clock className="w-5 h-5" />,
    },
    {
      type: 'daily',
      title: 'Daily Plan',
      price: 150,
      duration: '12 hours',
      outputTokens: '108,000',
      inputTokens: '60,000',
      icon: <Calendar className="w-5 h-5" />,
    },
    {
      type: 'monthly',
      title: 'Monthly Plan',
      price: 2999,
      duration: '30 days',
      outputTokens: '3,240,000',
      inputTokens: '1,800,000',
      icon: <CalendarDays className="w-5 h-5" />,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Upgrade Your Plan
          </DialogTitle>
          <DialogDescription>
            Choose a plan that best suits your needs
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {plans.map((plan) => (
            <div
              key={plan.type}
              className="relative p-6 rounded-lg border border-gray-200 hover:border-[#1EAEDB] transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    {plan.icon}
                    <h3 className="text-lg font-semibold">{plan.title}</h3>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">Duration: {plan.duration}</p>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm flex items-center gap-1">
                      <Zap className="w-4 h-4 text-[#1EAEDB]" />
                      {plan.outputTokens} output tokens
                    </p>
                    <p className="text-sm flex items-center gap-1">
                      <Zap className="w-4 h-4 text-[#1EAEDB]" />
                      {plan.inputTokens} input tokens
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-[#1EAEDB]">₹{plan.price}</p>
                  <Button
                    onClick={() => onSelectPlan(plan.type)}
                    className="mt-2 bg-[#1EAEDB] hover:bg-[#1EAEDB]/90"
                  >
                    Choose Plan
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
