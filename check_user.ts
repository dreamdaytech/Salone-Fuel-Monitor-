import { db } from './src/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

async function check() {
  const q = query(collection(db, 'users'), where('email', '==', 'slfuelmonitor@gmail.com'));
  const snapshot = await getDocs(q);
  snapshot.forEach(doc => {
    console.log(doc.id, doc.data());
  });
}
check();
