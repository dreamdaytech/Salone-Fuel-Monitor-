import React, { useEffect, useRef } from 'react';
import { db, doc, onSnapshot } from '../firebase';
import { toast } from 'sonner';

const SEEN_VERSION_KEY = 'sfm_last_seen_version';

export default function SystemUpdater() {
  const initialVersionRef = useRef<string | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'system', 'version'),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          // Prefer explicit version string; fallback to updatedAt millis
          const serverVersion = data.version ||
            (data.updatedAt ? data.updatedAt.toMillis().toString() : 'unknown');

          if (initialVersionRef.current === null) {
            // First load: record the version the user started the session with
            initialVersionRef.current = serverVersion;
            // Also update localStorage so future tabs know the current version
            localStorage.setItem(SEEN_VERSION_KEY, serverVersion);
          } else if (initialVersionRef.current !== serverVersion) {
            // Version changed DURING this session — notify the user
            const lastSeen = localStorage.getItem(SEEN_VERSION_KEY);
            if (lastSeen !== serverVersion) {
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
                    localStorage.setItem(SEEN_VERSION_KEY, serverVersion);
                    window.location.reload();
                  },
                },
                onDismiss: () => {
                  localStorage.setItem(SEEN_VERSION_KEY, serverVersion);
                },
                duration: Infinity,
                id: 'system-update-toast',
              });
            }
            initialVersionRef.current = serverVersion;
          }
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

