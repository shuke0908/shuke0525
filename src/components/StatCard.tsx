import { Card, CardContent } from '@/components/ui/card';
import React from 'react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

type StatCardProps = {
  title: string;
  value: string;
  trend?: {
    value: string;
    label: string;
    positive: boolean;
  };
  icon: LucideIcon;
  iconBgClass: string;
  iconColorClass: string;
  actions?: ReactNode;
};

export default function StatCard({
  title,
  value,
  trend,
  icon: Icon,
  iconBgClass,
  iconColorClass,
  actions,
}: StatCardProps) {
  return (
    <Card>
      <CardContent className='p-6'>
        <div className='flex justify-between items-start'>
          <div>
            <p className='text-sm text-muted-foreground'>{title}</p>
            <div className='flex items-baseline mt-2 mb-1'>
              <h3 className='text-2xl font-bold'>{value}</h3>
              {trend && (
                <span
                  className={`ml-2 text-xs font-medium ${trend.positive ? 'text-success' : 'text-destructive'}`}
                >
                  {trend.positive ? '+' : ''}
                  {trend.value}
                </span>
              )}
            </div>
            {trend && (
              <p className='text-xs text-muted-foreground'>{trend.label}</p>
            )}
            {actions && <div className='mt-2'>{actions}</div>}
          </div>
          <div className={`p-2 rounded-full ${iconBgClass}`}>
            <Icon className={`h-5 w-5 ${iconColorClass}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
