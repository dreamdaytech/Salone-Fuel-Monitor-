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

async function testRead() {
  const q = query(collection(db, 'price_trends'), orderBy('effectiveDate', 'desc'));
  try {
    const querySnapshot = await getDocs(q);
    console.log('Got', querySnapshot.docs.length, 'documents');
  } catch (err) {
    console.error('Error fetching docs:', err);
  }
  process.exit(0);
}

testRead().catch(console.error);
