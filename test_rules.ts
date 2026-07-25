import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
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
const auth = getAuth(app);
const db = getFirestore(app, config.firestoreDatabaseId);

async function check() {
  try {
    const q = query(collection(db, 'price_trends'), orderBy('effectiveDate', 'desc'));
    const snap = await getDocs(q);
    console.log('Unauthenticated can read price_trends:', snap.size);
  } catch(e) {
    console.log('Unauthenticated read failed:', e.message);
  }
}
check().then(() => process.exit(0)).catch(console.error);
