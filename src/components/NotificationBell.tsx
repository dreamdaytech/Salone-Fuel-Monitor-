import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, Trash2, BellRing } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../contexts/NotificationContext';
import { Button } from './ui/Button';

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, requestNotificationPermission, fcmToken } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (notif: any) => {
    if (!notif.read) {
      markAsRead(notif.id);
    }
    if (notif.link) {
      navigate(notif.link);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        onClick={() => setIsOpen(!isOpen)}
        showNotification={false}
        variant="ghost"
        className="relative p-2 text-gray-600 hover:text-primary focus:outline-none rounded-full hover:bg-gray-100 transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <Button
                onClick={() => markAllAsRead()}
                notificationMessage="All notifications marked as read"
                className="text-xs text-emerald-600 hover:text-emerald-800 font-medium flex items-center gap-1"
              >
                <Check className="h-3 w-3" />
                Mark all read
              </Button>
            )}
          </div>

          {!fcmToken && (
            <div className="p-3 bg-emerald-50 border-b border-emerald-100 flex items-start gap-2">
              <BellRing className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-emerald-800 font-medium">Enable push notifications</p>
                <p className="text-[10px] text-emerald-600 mt-0.5">Get instant alerts for price changes</p>
              </div>
              <Button 
                onClick={requestNotificationPermission}
                className="text-[10px] h-6 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded"
              >
                Enable
              </Button>
            </div>
          )}

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${!notif.read ? 'bg-emerald-50/50' : ''}`}
                    onClick={() => handleNotificationClick(notif)}
                  >
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <p className={`text-sm ${!notif.read ? 'font-semibold text-gray-900' : 'text-gray-800'}`}>
                          {notif.title}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                        <p className="text-xs text-gray-400 mt-2">
                          {notif.createdAt?.toDate?.()?.toLocaleString() || 'Just now'}
                        </p>
                      </div>
                      {!notif.read && (
                        <div className="flex-shrink-0 pt-1">
                          <div className="h-2 w-2 bg-emerald-600 rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
