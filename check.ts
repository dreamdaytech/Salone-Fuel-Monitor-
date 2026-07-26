import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
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

async function main() {
  const stationSnap = await getDocs(query(collection(db, 'stations'), where('name', '==', 'DreamOil')));
  if (stationSnap.empty) {
    console.log("DreamOil station not found.");
    process.exit(1);
    return;
  }
  const stationId = stationSnap.docs[0].id;
  
  const historySnap = await getDocs(query(collection(db, 'price_history'), where('stationId', '==', stationId)));
  console.log(`DreamOil price history count: ${historySnap.size}`);
  
  process.exit(0);
}
main().catch(console.error);
