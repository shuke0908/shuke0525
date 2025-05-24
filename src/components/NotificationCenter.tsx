import React, { useState } from 'react';
import { format } from 'date-fns';
import {
  Bell,
  Check,
  Info,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  X,
  Loader2,
} from 'lucide-react';
import { useNotifications, type Notification } from '@/hooks/useNotifications';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

export function NotificationCenter() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    isMarkingAsRead,
    isMarkingAllAsRead,
  } = useNotifications();
  const [open, setOpen] = useState(false);

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'info':
        return <Info className='h-4 w-4 text-blue-500' />;
      case 'success':
        return <CheckCircle2 className='h-4 w-4 text-green-500' />;
      case 'warning':
        return <AlertTriangle className='h-4 w-4 text-yellow-500' />;
      case 'error':
        return <AlertCircle className='h-4 w-4 text-red-500' />;
      default:
        return <Info className='h-4 w-4 text-blue-500' />;
    }
  };

  const handleMarkAsRead = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    markAsRead(id);
  };

  const handleMarkAllAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    markAllAsRead();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant='ghost' size='icon' className='relative'>
          <Bell className='h-5 w-5' />
          {unreadCount > 0 && (
            <Badge
              className='absolute -top-1 -right-1 px-1.5 py-0.5 bg-red-500'
              variant='destructive'
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-80 p-0' align='end'>
        <div className='flex items-center justify-between p-3 border-b'>
          <h3 className='font-medium'>Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant='ghost'
              size='sm'
              className='h-8 px-2 text-xs'
              onClick={handleMarkAllAsRead}
              disabled={isMarkingAllAsRead}
            >
              {isMarkingAllAsRead ? (
                <Loader2 className='h-3 w-3 mr-1 animate-spin' />
              ) : (
                <Check className='h-3 w-3 mr-1' />
              )}
              Mark all as read
            </Button>
          )}
        </div>

        <ScrollArea className='h-[300px]'>
          {notifications.length === 0 ? (
            <div className='flex flex-col items-center justify-center p-4 text-center text-muted-foreground h-[300px]'>
              <Bell className='h-8 w-8 mb-2' />
              <p>You have no notifications</p>
            </div>
          ) : (
            <div>
              {notifications.map(notification => (
                <div key={notification.id} className='group'>
                  <div
                    className={`flex items-start p-3 hover:bg-accent cursor-pointer ${
                      !notification.isRead ? 'bg-accent/20' : ''
                    }`}
                  >
                    <div className='mr-3 mt-0.5'>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className='flex-1 space-y-1'>
                      <div className='flex items-center justify-between'>
                        <p className='text-sm font-medium'>
                          {notification.title}
                        </p>
                        <span className='text-xs text-muted-foreground'>
                          {format(
                            new Date(notification.createdAt),
                            'MMM d, h:mm a'
                          )}
                        </span>
                      </div>
                      <p className='text-xs text-muted-foreground'>
                        {notification.message}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <Button
                        variant='ghost'
                        size='icon'
                        className='h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity'
                        onClick={e => handleMarkAsRead(notification.id, e)}
                        disabled={isMarkingAsRead}
                      >
                        {isMarkingAsRead ? (
                          <Loader2 className='h-3 w-3 animate-spin' />
                        ) : (
                          <X className='h-3 w-3' />
                        )}
                        <span className='sr-only'>Mark as read</span>
                      </Button>
                    )}
                  </div>
                  <Separator />
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
