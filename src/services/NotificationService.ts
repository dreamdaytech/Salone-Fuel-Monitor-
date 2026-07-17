import { collection, addDoc, serverTimestamp, getDocs, query, where, doc, getDoc, writeBatch } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

export interface Notification {
  id?: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: any;
  type: 'price_update' | 'gov_update' | 'system';
  link?: string;
}

export const NotificationService = {
  // Helper to send SMS via our backend API
  sendSms: async (to: string, message: string) => {
    try {
      const response = await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, message })
      });
      if (!response.ok) {
        throw new Error(`SMS API error: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to send SMS:', error);
    }
  },

  // Helper to send FCM push notification via our backend API
  sendFcm: async (token: string, title: string, body: string, data?: any) => {
    try {
      const response = await fetch('/api/fcm/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, title, body, data })
      });
      if (!response.ok) {
        throw new Error(`FCM API error: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to send FCM:', error);
    }
  },

  // Notify station owners when government prices change
  notifyGovPriceUpdate: async (newPrices: Record<string, number>) => {
    try {
      // Get all station owners
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('role', '==', 'station_owner'));
      const snapshot = await getDocs(q);
      
      const batch = writeBatch(db);
      const notificationsRef = collection(db, 'notifications');
      
      let count = 0;
      snapshot.forEach((userDoc) => {
        const userData = userDoc.data();
        const newNotifRef = doc(notificationsRef);
        const message = 'The government-set fuel prices have been updated. Please review and update your station prices if necessary.';
        
        batch.set(newNotifRef, {
          userId: userDoc.id,
          title: 'Official Prices Updated',
          message: message,
          read: false,
          createdAt: serverTimestamp(),
          type: 'gov_update',
          link: '/dashboard'
        });
        count++;

        // Send SMS if opted in
        if (userData.optInSms && userData.phoneNumber) {
          NotificationService.sendSms(userData.phoneNumber, `FuelPrice SL: ${message}`);
        }

        // Send FCM if token exists
        if (userData.fcmToken) {
          NotificationService.sendFcm(userData.fcmToken, 'Official Prices Updated', message, { link: '/dashboard' });
        }
      });
      
      if (count > 0) {
        await batch.commit();
      }
    } catch (error) {
      console.error('Error sending gov price notifications:', error);
    }
  },

  // Notify users when a station updates prices in their district or for their fuel type
  notifyStationPriceUpdate: async (stationId: string, stationName: string, district: string, changedFuels: string[], currentPrices: Record<string, number>, allStationsInDistrict: any[]) => {
    try {
      // 1. Get users who opted in for general alerts (district/fuel type)
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('optInAlerts', '==', true));
      const snapshot = await getDocs(q);
      
      // 2. Get users who specifically subscribed to this station or district
      const subsRef = collection(db, 'subscriptions');
      const stationSubsQ = query(subsRef, where('type', '==', 'station'), where('targetId', '==', stationId));
      const districtSubsQ = query(subsRef, where('type', '==', 'district'), where('targetId', '==', district));
      
      const [stationSubs, districtSubs] = await Promise.all([
        getDocs(stationSubsQ),
        getDocs(districtSubsQ)
      ]);

      const subscriberIds = new Set<string>();
      stationSubs.forEach(doc => subscriberIds.add(doc.data().userId));
      districtSubs.forEach(doc => subscriberIds.add(doc.data().userId));

      const batch = writeBatch(db);
      const notificationsRef = collection(db, 'notifications');
      
      // Calculate district averages for changed fuels
      const districtAverages: Record<string, number> = {};
      changedFuels.forEach(fuel => {
        const prices = allStationsInDistrict
          .map(s => s.prices?.[fuel])
          .filter(p => p && p > 0);
        if (prices.length > 0) {
          districtAverages[fuel] = prices.reduce((a, b) => a + b, 0) / prices.length;
        }
      });

      let count = 0;
      const notifiedUserIds = new Set<string>();

      const processUser = async (userDoc: any, isSpecificSubscriber: boolean) => {
        const userId = userDoc.id;
        if (notifiedUserIds.has(userId)) return;

        const userData = userDoc.data();
        
        let shouldNotify = isSpecificSubscriber;
        let specialAlert = '';

        if (!shouldNotify) {
          // Check if user is interested in this district
          const interestedDistricts = userData.alertDistricts || [];
          const isInterestedInDistrict = interestedDistricts.length === 0 || interestedDistricts.includes(district) || interestedDistricts.includes('All');
          
          // Check if user is interested in these fuel types
          const interestedFuels = userData.alertFuelTypes || [];
          const isInterestedInFuel = interestedFuels.length === 0 || changedFuels.some(f => interestedFuels.includes(f));
          
          if (isInterestedInDistrict && isInterestedInFuel) {
            shouldNotify = true;
          }
        }

        // Check for special conditions: price drop or significantly lower than average
        if (shouldNotify) {
          for (const fuel of changedFuels) {
            const price = currentPrices[fuel];
            const avg = districtAverages[fuel];
            
            // Check user-defined threshold
            const threshold = userData.priceThresholds?.[fuel];
            if (threshold && price <= threshold) {
              specialAlert = `🎯 THRESHOLD REACHED: ${fuel} at ${stationName} is now ${price.toLocaleString()} SLL, which is below your alert threshold of ${threshold.toLocaleString()} SLL!`;
              break;
            }

            // "Significantly lower" = 5% below average
            if (avg && price < avg * 0.95) {
              specialAlert = `🔥 GREAT DEAL: ${fuel} at ${stationName} is significantly lower than the district average!`;
              break;
            }
          }
        }

        if (shouldNotify) {
          const newNotifRef = doc(notificationsRef);
          const message = specialAlert || `${stationName} in ${district} has updated prices for ${changedFuels.join(', ')}.`;
          
          batch.set(newNotifRef, {
            userId: userId,
            title: specialAlert ? 'Price Alert' : 'Fuel Price Update',
            message: message,
            read: false,
            createdAt: serverTimestamp(),
            type: 'price_update',
            link: `/?station=${stationId}`
          });
          count++;
          notifiedUserIds.add(userId);

          // Send SMS if opted in
          if (userData.optInSms && userData.phoneNumber) {
            NotificationService.sendSms(userData.phoneNumber, `FuelPrice SL: ${message}`);
          }

          // Send FCM if token exists
          if (userData.fcmToken) {
            NotificationService.sendFcm(userData.fcmToken, specialAlert ? 'Price Alert' : 'Fuel Price Update', message, { link: `/?station=${stationId}` });
          }
        }
      };

      // Process general opt-in users
      for (const userDoc of snapshot.docs) {
        await processUser(userDoc, false);
      }

      // Process specific subscribers who might not have general opt-in
      for (const subUserId of subscriberIds) {
        if (!notifiedUserIds.has(subUserId)) {
          const userDoc = await getDoc(doc(db, 'users', subUserId));
          if (userDoc.exists()) {
            await processUser(userDoc, true);
          }
        }
      }
      
      if (count > 0) {
        await batch.commit();
      }
    } catch (error: any) {
      // Ignore permission errors for station owners querying users
      if (error.code === 'permission-denied' || error.message?.includes('Missing or insufficient permissions')) {
        console.warn('Notification fan-out requires admin privileges or a backend service. Skipping client-side notifications.');
        return;
      }
      console.error('Error sending station price notifications:', error);
    }
  }
};
