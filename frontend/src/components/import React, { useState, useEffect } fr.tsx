import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { 
  Bell, 
  BellRing, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  AlertTriangle,
  X,
  Trash2,
  Filter
} from 'lucide-react';
import { useWebSocket } from '../hooks/useWebSocket';

import { formatDistanceToNow } from 'date-fns';

interface NotificationItem {
  id: string;
  type: 'submission:created' | 'submission:verified' | 'submission:updated' | 'submission:deleted' | 'system:notification';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  data?: any;
}

interface NotificationSystemProps {
  onNotificationClick?: (notification: NotificationItem) => void;
  showBadge?: boolean;
  maxNotifications?: number;
}

const NotificationSystem: React.FC<NotificationSystemProps> = ({
  onNotificationClick,
  showBadge = true,
  maxNotifications = 50
}) => {
  const { notifications, isConnected, clearNotifications } = useWebSocket();
  const [notificationItems, setNotificationItems] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [unreadCount, setUnreadCount] = useState(0);

  // Convert WebSocket notifications to NotificationItem format
  useEffect(() => {
    const converted: NotificationItem[] = notifications.slice(0, maxNotifications).map((notification, index) => {
      const { type, data, timestamp } = notification;
      
      let title = '';
      let message = data?.message || 'New notification';
      
      switch (type) {
        case 'submission:created': // Explicitly cast type to NotificationItem['type']
          title = 'New Submission';
          break;
        case 'submission:verified':
          title = 'Submission Verified';
          break;
        case 'submission:updated':
          title = 'Submission Updated';
          break;
        case 'submission:deleted':
          title = 'Submission Deleted';
          break;
        case 'system:notification':
          title = 'System Notification';
          break;
        default:
          title = 'Notification';
      }
      
      return { // Explicitly cast type to NotificationItem['type']
        id: `${type}-${timestamp}-${index}`,
        type,
        title,
        message,
        timestamp,
        read: false,
        data
      };
    });
    
    setNotificationItems(converted);
  }, [notifications, maxNotifications]);

  // Calculate unread count
  useEffect(() => {
    const unread = notificationItems.filter(item => !item.read).length;
    setUnreadCount(unread);
  }, [notificationItems]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'submission:created':
        return <Info className="h-4 w-4 text-blue-500" />;
      case 'submission:verified':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'submission:updated':
        return <Info className="h-4 w-4 text-blue-500" />;
      case 'submission:deleted':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'system:notification':
        return <AlertCircle className="h-4 w-4 text-purple-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'submission:created':
        return 'border-l-blue-500';
      case 'submission:verified':
        return 'border-l-green-500';
      case 'submission:updated':
        return 'border-l-blue-500';
      case 'submission:deleted':
        return 'border-l-orange-500';
      case 'system:notification':
        return 'border-l-purple-500';
      default:
        return 'border-l-gray-500';
    }
  };

  const handleNotificationClick = (notification: NotificationItem) => {
    // Mark as read
    setNotificationItems(prev => 
      prev.map(item => 
        item.id === notification.id 
          ? { ...item, read: true }
          : item
      )
    );
    
    // Call external handler if provided
    if (onNotificationClick) {
      onNotificationClick(notification);
    }
  };

  const markAllAsRead = () => {
    setNotificationItems(prev => 
      prev.map(item => ({ ...item, read: true }))
    );
  };

  const clearAllNotifications = () => {
    clearNotifications();
  };

  const filteredNotifications = notificationItems.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !item.read;
    return item.type === filter;
  });

  const getConnectionStatusIcon = () => {
    if (isConnected) {
      return <BellRing className="h-4 w-4 text-green-500" />;
    }
    return <Bell className="h-4 w-4 text-red-500" />;
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          {getConnectionStatusIcon()}
          {showBadge && unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between p-2 border-b">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {isConnected ? (
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                Live
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                Offline
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <Filter className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setFilter('all')}>
                  All
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter('unread')}>
                  Unread
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter('submission:created')}>
                  New Submissions
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter('submission:verified')}>
                  Verifications
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter('system:notification')}>
                  System
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {notificationItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Bell className="h-8 w-8 text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">No notifications yet</p>
            <p className="text-xs text-gray-400">You'll see real-time updates here</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between p-2 border-b">
              <span className="text-xs text-gray-500">
                {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? 's' : ''}
              </span>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={markAllAsRead}
                >
                  Mark all read
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={clearAllNotifications}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
            
            <ScrollArea className="h-96">
              <div className="space-y-1">
                {filteredNotifications.map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className={`p-3 cursor-pointer border-l-2 ${getNotificationColor(notification.type)} ${
                      !notification.read ? 'bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-2 w-full">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-sm font-medium ${
                            !notification.read ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </div>
            </ScrollArea>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationSystem;
