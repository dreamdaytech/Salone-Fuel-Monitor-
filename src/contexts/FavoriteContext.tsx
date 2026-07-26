import React, { createContext, useContext, useEffect, useState } from 'react';
import { db, collection, query, where, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

export interface Favorite {
  id: string;
  userId: string;
  stationId: string;
  createdAt: any;
}

interface FavoriteContextType {
  favorites: Favorite[];
  addFavorite: (stationId: string) => Promise<void>;
  removeFavorite: (favoriteId: string) => Promise<void>;
  isFavorite: (stationId: string) => boolean;
  toggleFavorite: (stationId: string) => Promise<void>;
  loading: boolean;
}

const FavoriteContext = createContext<FavoriteContextType>({
  favorites: [],
  addFavorite: async () => {},
  removeFavorite: async () => {},
  isFavorite: () => false,
  toggleFavorite: async () => {},
  loading: false,
});

export const useFavorites = () => useContext(FavoriteContext);

export const FavoriteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setFavorites([]);
      return;
    }

    setLoading(true);
    const favQ = query(collection(db, 'favorites'), where('userId', '==', user.uid));
    const unsubFavs = onSnapshot(favQ, (snapshot) => {
      const favsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Favorite[];
      setFavorites(favsList);
      setLoading(false);
    }, (error) => {
      setLoading(false);
      handleFirestoreError(error, OperationType.LIST, 'favorites');
    });

    return () => unsubFavs();
  }, [user]);

  const addFavorite = async (stationId: string) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'favorites'), {
        userId: user.uid,
        stationId,
        createdAt: serverTimestamp()
      });
      toast.success('Station favorited! Price change alerts enabled.', { icon: '⭐' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'favorites');
    }
  };

  const removeFavorite = async (favoriteId: string) => {
    try {
      await deleteDoc(doc(db, 'favorites', favoriteId));
      toast.success('Removed from favorite stations.');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `favorites/${favoriteId}`);
    }
  };

  const isFavorite = (stationId: string) => {
    return favorites.some(fav => fav.stationId === stationId);
  };

  const toggleFavorite = async (stationId: string) => {
    if (!user) return;
    const existingFav = favorites.find(fav => fav.stationId === stationId);
    if (existingFav) {
      await removeFavorite(existingFav.id);
    } else {
      await addFavorite(stationId);
    }
  };

  return (
    <FavoriteContext.Provider value={{ favorites, addFavorite, removeFavorite, isFavorite, toggleFavorite, loading }}>
      {children}
    </FavoriteContext.Provider>
  );
};
