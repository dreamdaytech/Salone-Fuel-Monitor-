import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app);

getDocs(collection(db, 'regional_countries')).then(snap => {
  snap.docs.forEach(d => {
    const data = d.data();
    console.log(`${d.id}: Diesel=${data.prices?.diesel}, ExchangeRate=${data.exchangeRateToUSD}`);
  });
  process.exit(0);
});
