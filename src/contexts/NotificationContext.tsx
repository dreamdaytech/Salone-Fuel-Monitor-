import React, { createContext, useContext, useEffect, useState } from 'react';
import { db, collection, query, where, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, orderBy, updateDoc, handleFirestoreError, OperationType, messaging, getToken, onMessage } from '../firebase';
import { useAuth } from './AuthContext';

export interface Subscription {
  id: string;
  userId: string;
  type: 'station' | 'district';
  targetId: string;
  targetName: string;
  createdAt: any;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: any;
  type?: 'price_update' | 'gov_update' | 'system';
  link?: string;
  stationId?: string;
  isFavorite?: boolean;
}

interface NotificationContextType {
  subscriptions: Subscription[];
  notifications: Notification[];
  unreadCount: number;
  fcmToken: string | null;
  subscribe: (type: 'station' | 'district', targetId: string, targetName: string) => Promise<void>;
  unsubscribe: (subscriptionId: string) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  isSubscribed: (type: 'station' | 'district', targetId: string) => boolean;
  requestNotificationPermission: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType>({
  subscriptions: [],
  notifications: [],
  unreadCount: 0,
  fcmToken: null,
  subscribe: async () => {},
  unsubscribe: async () => {},
  markAsRead: async () => {},
  markAllAsRead: async () => {},
  isSubscribed: () => false,
  requestNotificationPermission: async () => {},
});

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, updateProfile } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setSubscriptions([]);
      setNotifications([]);
      setFcmToken(null);
      return;
    }

    const subQ = query(collection(db, 'subscriptions'), where('userId', '==', user.uid));
    const unsubSubs = onSnapshot(subQ, (snapshot) => {
      const subs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Subscription[];
      setSubscriptions(subs);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'subscriptions'));

    const notifQ = query(collection(db, 'notifications'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
    const unsubNotifs = onSnapshot(notifQ, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Notification[];
      setNotifications(notifs);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'notifications'));

    // Listen for foreground messages
    let unsubMessaging: (() => void) | undefined;
    if (messaging) {
      unsubMessaging = onMessage(messaging, (payload) => {
        console.log('Received foreground message:', payload);
        // The message is also saved to Firestore by the backend, so we don't need to manually add it here
        // unless we want to show a toast immediately.
      });
    }

    return () => {
      unsubSubs();
      unsubNotifs();
      if (unsubMessaging) unsubMessaging();
    };
  }, [user]);

  const requestNotificationPermission = async () => {
    if (!user || !messaging) return;
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        let vapidKey = import.meta.env.VITE_VAPID_KEY;
        
        // If not in env, try to fetch from server settings
        if (!vapidKey) {
          try {
            const response = await fetch('/api/settings/fcm');
            if (response.ok) {
              const data = await response.json();
              if (data.vapidKey) {
                vapidKey = data.vapidKey;
              }
            }
          } catch (e) {
            console.error('Failed to fetch VAPID key from server', e);
          }
        }

        const token = await getToken(messaging, vapidKey ? { vapidKey } : undefined);
        if (token) {
          setFcmToken(token);
          // Save token to user profile if it's new or changed
          if (profile && profile.fcmToken !== token) {
            await updateProfile({ fcmToken: token });
          }
        }
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };

  const subscribe = async (type: 'station' | 'district', targetId: string, targetName: string) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'subscriptions'), {
        userId: user.uid,
        type,
        targetId,
        targetName,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'subscriptions');
    }
  };

  const unsubscribe = async (subscriptionId: string) => {
    try {
      await deleteDoc(doc(db, 'subscriptions', subscriptionId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `subscriptions/${subscriptionId}`);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), { read: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `notifications/${notificationId}`);
    }
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.read);
    for (const notif of unread) {
      await markAsRead(notif.id);
    }
  };

  const isSubscribed = (type: 'station' | 'district', targetId: string) => {
    return subscriptions.some(s => s.type === type && s.targetId === targetId);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{
      subscriptions,
      notifications,
      unreadCount,
      subscribe,
      unsubscribe,
      markAsRead,
      markAllAsRead,
      isSubscribed,
      requestNotificationPermission,
      fcmToken
    }}>
      {children}
    </NotificationContext.Provider>
  );
};
