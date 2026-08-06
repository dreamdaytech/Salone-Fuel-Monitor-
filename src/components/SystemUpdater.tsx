import React, { useEffect, useState } from 'react';
import { db, doc, onSnapshot } from '../firebase';
import { toast } from 'sonner';

export default function SystemUpdater() {
  const [initialVersion, setInitialVersion] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'system', 'version'),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          // Use a specific version string, or fallback to the timestamp of the update
          const serverVersion = data.version || (data.updatedAt ? data.updatedAt.toMillis().toString() : 'unknown');

          setInitialVersion((prev) => {
            if (prev === null) {
              // First load: just store the current version
              return serverVersion;
            } else if (prev !== serverVersion) {
              // Version changed during the session!
              const ignoredVersion = sessionStorage.getItem('ignoredUpdateVersion');
              
              if (ignoredVersion !== serverVersion) {
                toast.success('A new version of the app is available!', {
                  description: 'Refresh to get the latest features and updates.',
                  action: {
                    label: 'Refresh Now',
                    onClick: async () => {
                      if ('serviceWorker' in navigator) {
                        try {
                          const registrations = await navigator.serviceWorker.getRegistrations();
                          for (const registration of registrations) {
                            await registration.unregister();
                          }
                        } catch (err) {
                          console.error('Failed to unregister service workers', err);
                        }
                      }
                      if ('caches' in window) {
                        try {
                          const cacheNames = await caches.keys();
                          await Promise.all(cacheNames.map(name => caches.delete(name)));
                        } catch (err) {
                          console.error('Failed to clear caches', err);
                        }
                      }
                      window.location.reload();
                    },
                  },
                  onDismiss: () => {
                    sessionStorage.setItem('ignoredUpdateVersion', serverVersion);
                  },
                  duration: Infinity,
                  id: 'system-update-toast',
                });
              }
              return serverVersion;
            }
            return prev;
          });
        }
      },
      (error) => {
        console.warn('Could not listen to system version updates:', error);
      }
    );

    return () => unsub();
  }, []);

  return null;
}
