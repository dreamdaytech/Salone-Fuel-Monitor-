import { db } from './src/firebase';
import { collection, getDocs } from 'firebase/firestore';

async function check() {
  const snapshot = await getDocs(collection(db, 'price_history'));
  console.log('price_history docs count:', snapshot.size);
}
check();
