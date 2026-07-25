import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, orderBy } from 'firebase/firestore';
import fs from 'fs';

const configStr = fs.readFileSync('firebase-applet-config.json', 'utf-8');
const config = JSON.parse(configStr);
const firebaseConfig = {
  projectId: config.projectId,
  appId: config.appId,
  apiKey: config.apiKey,
  authDomain: config.authDomain,
  storageBucket: config.storageBucket,
  messagingSenderId: config.messagingSenderId,
  measurementId: config.measurementId
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, config.firestoreDatabaseId);

async function check() {
  const q = collection(db, 'price_trends');
  const snap = await getDocs(q);
  console.log('Total price_trends:', snap.size);
  
  const q2 = query(collection(db, 'price_trends'), orderBy('effectiveDate', 'desc'));
  const snap2 = await getDocs(q2);
  console.log('With effectiveDate desc:', snap2.size);
}
check().then(() => process.exit(0)).catch(console.error);
