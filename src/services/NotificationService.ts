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
  stationId?: string;
  isFavorite?: boolean;
}

export const NotificationService = {
  // Helper to send Email via our backend API
  sendEmail: async (to: string, subject: string, body: string, stationName?: string, prices?: Record<string, number>) => {
    try {
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, subject, body, stationName, prices })
      });
      if (!response.ok) {
        throw new Error(`Email API error: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to send Email:', error);
    }
  },

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
          title: 'Price Trends Updated',
          message: message,
          read: false,
          createdAt: serverTimestamp(),
          type: 'gov_update',
          link: '/dashboard'
        });
        count++;

        // Send Email if available
        if (userData.email && (userData.optInEmail !== false)) {
          NotificationService.sendEmail(
            userData.email,
            'Official Price Trends Updated',
            `Hello ${userData.name || 'Station Owner'},\n\n` + message + '\n\nNew Prices:\n' +
            Object.entries(newPrices).map(([fuel, price]) => `• ${fuel}: Le ${price.toLocaleString()}`).join('\n'),
            'Government Prices',
            newPrices
          );
        }

        // Send SMS if opted in
        if (userData.optInSms && userData.phoneNumber) {
          NotificationService.sendSms(userData.phoneNumber, `FuelPrice SL: ${message}`);
        }

        // Send FCM if token exists
        if (userData.fcmToken) {
          NotificationService.sendFcm(userData.fcmToken, 'Price Trends Updated', message, { link: '/dashboard' });
        }
      });
      
      if (count > 0) {
        await batch.commit();
      }
    } catch (error) {
      console.error('Error sending gov price notifications:', error);
    }
  },

  // Notify users when a station updates prices in their favorite stations, subscribed target, or district
  notifyStationPriceUpdate: async (stationId: string, stationName: string, district: string, changedFuels: string[], currentPrices: Record<string, number>, allStationsInDistrict: any[]) => {
    try {
      // 1. Get users who opted in for general alerts
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('optInAlerts', '==', true));
      const snapshot = await getDocs(q);
      
      // 2. Get users who favorited this station
      const favsRef = collection(db, 'favorites');
      const favsQ = query(favsRef, where('stationId', '==', stationId));
      const favsSnap = await getDocs(favsQ);
      const favoriteUserIds = new Set<string>();
      favsSnap.forEach(doc => favoriteUserIds.add(doc.data().userId));

      // 3. Get users who explicitly subscribed to this station or district
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

      // Combined set of all candidate user IDs
      const allTargetUserIds = new Set<string>([
        ...Array.from(favoriteUserIds),
        ...Array.from(subscriberIds),
        ...snapshot.docs.map(d => d.id)
      ]);

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

      const processUser = async (userId: string, userData: any) => {
        if (notifiedUserIds.has(userId)) return;

        const isFavoriteStation = favoriteUserIds.has(userId);
        const isSpecificSubscriber = subscriberIds.has(userId);

        let shouldNotify = isFavoriteStation || isSpecificSubscriber;
        let specialAlert = '';

        if (!shouldNotify) {
          if (userData.optInAlerts) {
            const interestedDistricts = userData.alertDistricts || [];
            const isInterestedInDistrict = interestedDistricts.length === 0 || interestedDistricts.includes(district) || interestedDistricts.includes('All');
            
            const interestedFuels = userData.alertFuelTypes || [];
            const isInterestedInFuel = interestedFuels.length === 0 || changedFuels.some((f: string) => interestedFuels.includes(f));
            
            if (isInterestedInDistrict && isInterestedInFuel) {
              shouldNotify = true;
            }
          }
        }

        // Check for special conditions: price threshold or significantly lower than average
        if (shouldNotify) {
          for (const fuel of changedFuels) {
            const price = currentPrices[fuel];
            const avg = districtAverages[fuel];
            
            const threshold = userData.priceThresholds?.[fuel];
            if (threshold && price <= threshold) {
              specialAlert = `🎯 THRESHOLD REACHED: ${fuel} at ${stationName} is now Le ${price.toLocaleString()}, which is below your threshold of Le ${threshold.toLocaleString()}!`;
              break;
            }

            if (avg && price < avg * 0.95) {
              specialAlert = `🔥 GREAT DEAL: ${fuel} at ${stationName} is significantly lower than district average!`;
              break;
            }
          }
        }

        if (shouldNotify) {
          const newNotifRef = doc(notificationsRef);
          const priceDetails = changedFuels.map(f => `${f}: Le ${currentPrices[f] ? currentPrices[f].toLocaleString() : '-'}`).join(', ');
          
          const title = isFavoriteStation 
            ? `⭐ Price Alert: Favorite Station ${stationName}`
            : (specialAlert ? 'Price Alert' : `Fuel Price Update: ${stationName}`);

          const message = specialAlert 
            ? specialAlert 
            : (isFavoriteStation 
                ? `Your favorite station "${stationName}" in ${district} updated fuel prices: ${priceDetails}.`
                : `${stationName} in ${district} has updated fuel prices: ${priceDetails}.`);

          batch.set(newNotifRef, {
            userId: userId,
            title: title,
            message: message,
            read: false,
            createdAt: serverTimestamp(),
            type: 'price_update',
            stationId: stationId,
            isFavorite: isFavoriteStation,
            link: `/?station=${stationId}`
          });
          count++;
          notifiedUserIds.add(userId);

          // Email alert dispatch if user has email and email alerts are enabled
          const userEmail = userData.email;
          const sendEmail = userEmail && (userData.optInEmail !== false) && (userData.optInEmail || isFavoriteStation || userData.optInAlerts || userData.optInFavoriteAlerts !== false);
          
          if (sendEmail) {
            const emailSubject = isFavoriteStation 
              ? `⭐ Fuel Price Alert for Favorite Station: ${stationName}` 
              : `Fuel Price Update: ${stationName} (${district})`;

            const emailBody = `Hello ${userData.name || 'Valued User'},\n\n` +
              `Fuel prices have changed for ${isFavoriteStation ? 'your favorite station' : 'a station you follow'} (${stationName} - ${district}):\n\n` +
              changedFuels.map(f => `• ${f}: Le ${currentPrices[f] ? currentPrices[f].toLocaleString() : '-'}/L`).join('\n') +
              `\n\nView details in Salone Fuel Monitor:\nhttps://salonefuelmonitor.com/?station=${stationId}\n\n` +
              `Thank you for using Salone Fuel Monitor.`;

            NotificationService.sendEmail(userEmail, emailSubject, emailBody, stationName, currentPrices);
          }

          // Send SMS if opted in
          if (userData.optInSms && userData.phoneNumber) {
            NotificationService.sendSms(userData.phoneNumber, `FuelPrice SL: ${message}`);
          }

          // Send FCM if token exists
          if (userData.fcmToken) {
            NotificationService.sendFcm(userData.fcmToken, title, message, { link: `/?station=${stationId}` });
          }
        }
      };

      // Process all candidate users
      for (const userId of allTargetUserIds) {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          await processUser(userId, userDoc.data());
        }
      }
      
      if (count > 0) {
        await batch.commit();
      }
    } catch (error: any) {
      if (error.code === 'permission-denied' || error.message?.includes('Missing or insufficient permissions')) {
        console.warn('Notification fan-out requires admin privileges or a backend service. Skipping client-side notifications.');
        return;
      }
      console.error('Error sending station price notifications:', error);
    }
  }
};
