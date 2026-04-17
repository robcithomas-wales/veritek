interface BadgeProps {
  children: React.ReactNode;
  variant?: 'gray' | 'blue' | 'green' | 'yellow' | 'orange' | 'red' | 'purple';
  size?: 'sm' | 'md';
}

const variantClasses: Record<NonNullable<BadgeProps['variant']>, string> = {
  gray:   'bg-gray-100 text-gray-700',
  blue:   'bg-blue-100 text-blue-700',
  green:  'bg-green-100 text-green-700',
  yellow: 'bg-yellow-100 text-yellow-800',
  orange: 'bg-orange-100 text-orange-700',
  red:    'bg-red-100 text-red-700',
  purple: 'bg-purple-100 text-purple-700',
};

export function Badge({ children, variant = 'gray', size = 'md' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center font-medium rounded-full ${
      size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-0.5 text-xs'
    } ${variantClasses[variant]}`}>
      {children}
    </span>
  );
}

const STATUS_VARIANTS: Record<string, BadgeProps['variant']> = {
  received:    'blue',
  accepted:    'purple',
  in_route:    'yellow',
  in_progress: 'orange',
  completed:   'green',
  closed:      'gray',
};

const PRIORITY_VARIANTS: Record<string, BadgeProps['variant']> = {
  low:      'gray',
  medium:   'blue',
  high:     'yellow',
  critical: 'orange',
  urgent:   'red',
};

export function StatusBadge({ status }: { status: string }) {
  const label = status.replace('_', ' ');
  return <Badge variant={STATUS_VARIANTS[status] ?? 'gray'}>{label}</Badge>;
}

export function PriorityBadge({ priority }: { priority: number }) {
  const label =
    priority < 20 ? 'LOW' :
    priority < 40 ? 'MEDIUM' :
    priority < 60 ? 'HIGH' :
    priority < 80 ? 'CRITICAL' : 'URGENT';
  const variant =
    priority < 20 ? 'gray' :
    priority < 40 ? 'blue' :
    priority < 60 ? 'yellow' :
    priority < 80 ? 'orange' : 'red';
  return <Badge variant={variant as BadgeProps['variant']}>{label}</Badge>;
}
