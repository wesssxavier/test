import { clsx } from 'clsx';
import { Check, X, Clock, AlertCircle, Star, Crown, UserCheck } from 'lucide-react';

type BadgeVariant = 'green' | 'red' | 'yellow' | 'blue' | 'purple' | 'gray';

const variantClasses: Record<BadgeVariant, string> = {
  green: 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20',
  red: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20',
  yellow: 'bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-600/20',
  blue: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20',
  purple: 'bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-600/20',
  gray: 'bg-surface-100 text-surface-600 ring-1 ring-inset ring-surface-500/20',
};

interface StatusBadgeProps {
  label: string;
  variant: BadgeVariant;
  icon?: React.ReactNode;
  className?: string;
}

export function StatusBadge({ label, variant, icon, className }: StatusBadgeProps) {
  return (
    <span className={clsx('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium', variantClasses[variant], className)}>
      {icon}
      {label}
    </span>
  );
}

export function RsvpBadge({ status }: { status: string }) {
  switch (status) {
    case 'Confirmed':
      return <StatusBadge label="Confirmed" variant="green" icon={<Check className="h-3 w-3" />} />;
    case 'Declined':
      return <StatusBadge label="Declined" variant="red" icon={<X className="h-3 w-3" />} />;
    case 'Pending':
    default:
      return <StatusBadge label="Pending" variant="yellow" icon={<Clock className="h-3 w-3" />} />;
  }
}

export function GuestStatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'Confirmed':
      return <StatusBadge label="Confirmed" variant="green" icon={<Check className="h-3 w-3" />} />;
    case 'Declined':
      return <StatusBadge label="Declined" variant="red" icon={<X className="h-3 w-3" />} />;
    case 'Waitlist':
      return <StatusBadge label="Waitlist" variant="blue" icon={<Clock className="h-3 w-3" />} />;
    case 'Checked-In':
      return <StatusBadge label="Checked-In" variant="green" icon={<UserCheck className="h-3 w-3" />} />;
    case 'No Response':
      return <StatusBadge label="No Response" variant="gray" icon={<AlertCircle className="h-3 w-3" />} />;
    case 'Invited':
    default:
      return <StatusBadge label="Invited" variant="yellow" icon={<Clock className="h-3 w-3" />} />;
  }
}

export function VipBadge({ level }: { level: string }) {
  switch (level) {
    case 'VVIP':
      return <StatusBadge label="VVIP" variant="purple" icon={<Crown className="h-3 w-3" />} />;
    case 'VIP':
      return <StatusBadge label="VIP" variant="blue" icon={<Star className="h-3 w-3" />} />;
    default:
      return null;
  }
}

export function CheckedInIndicator({ checkedIn, checkedInAt }: { checkedIn: boolean; checkedInAt?: string | null }) {
  if (!checkedIn) return <span className="text-xs text-surface-400">-</span>;
  return (
    <div className="flex items-center gap-1">
      <div className="h-2 w-2 rounded-full bg-green-500" />
      <span className="text-xs text-green-700">
        {checkedInAt ? new Date(checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Yes'}
      </span>
    </div>
  );
}
