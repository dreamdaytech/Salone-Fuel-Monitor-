import { initializeApp } from 'firebase/app';
import { getFirestore, writeBatch, doc, serverTimestamp } from 'firebase/firestore';
import fs from 'fs';

// Read config from firebase-applet-config.json
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

const data = [
  { "monthYear": "Jan 2020", "petrolPrice": 9.00, "dieselPrice": 9.00, "kerosenePrice": 9.00, "effectiveDate": "18 Jan 2020" },
  { "monthYear": "Feb 2020", "petrolPrice": 9.00, "dieselPrice": 9.00, "kerosenePrice": 9.00, "effectiveDate": "18 Jan 2020" },
  { "monthYear": "Mar 2020", "petrolPrice": 8.50, "dieselPrice": 8.50, "kerosenePrice": 8.50, "effectiveDate": "6 Mar 2020" },
  { "monthYear": "Apr 2020", "petrolPrice": 8.50, "dieselPrice": 8.50, "kerosenePrice": 8.50, "effectiveDate": "6 Mar 2020" },
  { "monthYear": "May 2020", "petrolPrice": 8.50, "dieselPrice": 8.50, "kerosenePrice": 8.50, "effectiveDate": "6 Mar 2020" },
  { "monthYear": "Jun 2020", "petrolPrice": 8.50, "dieselPrice": 8.50, "kerosenePrice": 8.50, "effectiveDate": "6 Mar 2020" },
  { "monthYear": "Jul 2020", "petrolPrice": 8.50, "dieselPrice": 8.50, "kerosenePrice": 8.50, "effectiveDate": "6 Mar 2020" },
  { "monthYear": "Aug 2020", "petrolPrice": 8.50, "dieselPrice": 8.50, "kerosenePrice": 8.50, "effectiveDate": "6 Mar 2020" },
  { "monthYear": "Sep 2020", "petrolPrice": 8.50, "dieselPrice": 8.50, "kerosenePrice": 8.50, "effectiveDate": "6 Mar 2020" },
  { "monthYear": "Oct 2020", "petrolPrice": 8.50, "dieselPrice": 8.50, "kerosenePrice": 8.50, "effectiveDate": "6 Mar 2020" },
  { "monthYear": "Nov 2020", "petrolPrice": 8.50, "dieselPrice": 8.50, "kerosenePrice": 8.50, "effectiveDate": "6 Mar 2020" },
  { "monthYear": "Dec 2020", "petrolPrice": 8.50, "dieselPrice": 8.50, "kerosenePrice": 8.50, "effectiveDate": "6 Mar 2020" },
  { "monthYear": "Jan 2021", "petrolPrice": 8.50, "dieselPrice": 8.50, "kerosenePrice": 8.50, "effectiveDate": "6 Mar 2020" },
  { "monthYear": "Feb 2021", "petrolPrice": 8.50, "dieselPrice": 8.50, "kerosenePrice": 8.50, "effectiveDate": "6 Mar 2020" },
  { "monthYear": "Mar 2021", "petrolPrice": 8.50, "dieselPrice": 8.50, "kerosenePrice": 8.50, "effectiveDate": "6 Mar 2020" },
  { "monthYear": "Apr 2021", "petrolPrice": 8.50, "dieselPrice": 8.50, "kerosenePrice": 8.50, "effectiveDate": "6 Mar 2020" },
  { "monthYear": "May 2021", "petrolPrice": 8.50, "dieselPrice": 8.50, "kerosenePrice": 8.50, "effectiveDate": "6 Mar 2020" },
  { "monthYear": "Jun 2021", "petrolPrice": 8.50, "dieselPrice": 8.50, "kerosenePrice": 8.50, "effectiveDate": "6 Mar 2020" },
  { "monthYear": "Jul 2021", "petrolPrice": 9.50, "dieselPrice": 9.50, "kerosenePrice": 9.50, "effectiveDate": "1 Jul 2021" },
  { "monthYear": "Aug 2021", "petrolPrice": 9.50, "dieselPrice": 9.50, "kerosenePrice": 9.50, "effectiveDate": "1 Jul 2021" },
  { "monthYear": "Sep 2021", "petrolPrice": 9.50, "dieselPrice": 9.50, "kerosenePrice": 9.50, "effectiveDate": "1 Jul 2021" },
  { "monthYear": "Oct 2021", "petrolPrice": 9.50, "dieselPrice": 9.50, "kerosenePrice": 9.50, "effectiveDate": "1 Jul 2021" },
  { "monthYear": "Nov 2021", "petrolPrice": 9.50, "dieselPrice": 9.50, "kerosenePrice": 9.50, "effectiveDate": "1 Jul 2021" },
  { "monthYear": "Dec 2021", "petrolPrice": 9.50, "dieselPrice": 9.50, "kerosenePrice": 9.50, "effectiveDate": "1 Jul 2021" },
  { "monthYear": "Jan 2022", "petrolPrice": 9.50, "dieselPrice": 9.50, "kerosenePrice": 9.50, "effectiveDate": "1 Jul 2021" },
  { "monthYear": "Feb 2022", "petrolPrice": 9.50, "dieselPrice": 9.50, "kerosenePrice": 9.50, "effectiveDate": "1 Jul 2021" },
  { "monthYear": "Mar 2022", "petrolPrice": 15.00, "dieselPrice": 15.00, "kerosenePrice": 15.00, "effectiveDate": "17 Mar 2022" },
  { "monthYear": "Apr 2022", "petrolPrice": 15.00, "dieselPrice": 15.00, "kerosenePrice": 15.00, "effectiveDate": "17 Mar 2022" },
  { "monthYear": "May 2022", "petrolPrice": 15.00, "dieselPrice": 15.00, "kerosenePrice": 15.00, "effectiveDate": "17 Mar 2022" },
  { "monthYear": "Jun 2022", "petrolPrice": 18.00, "dieselPrice": 18.00, "kerosenePrice": 18.00, "effectiveDate": "9 Jun 2022" },
  { "monthYear": "Jul 2022", "petrolPrice": 18.00, "dieselPrice": 18.00, "kerosenePrice": 18.00, "effectiveDate": "9 Jun 2022" },
  { "monthYear": "Aug 2022", "petrolPrice": 18.00, "dieselPrice": 18.00, "kerosenePrice": 18.00, "effectiveDate": "9 Jun 2022" },
  { "monthYear": "Sep 2022", "petrolPrice": 25.00, "dieselPrice": 23.00, "kerosenePrice": 23.00, "effectiveDate": "Sep 2022" },
  { "monthYear": "Oct 2022", "petrolPrice": 25.00, "dieselPrice": 23.00, "kerosenePrice": 23.00, "effectiveDate": "Sep 2022" },
  { "monthYear": "Nov 2022", "petrolPrice": 25.00, "dieselPrice": 23.00, "kerosenePrice": 23.00, "effectiveDate": "Sep 2022" },
  { "monthYear": "Dec 2022", "petrolPrice": 25.00, "dieselPrice": 23.00, "kerosenePrice": 23.00, "effectiveDate": "Sep 2022" },
  { "monthYear": "Jan 2023", "petrolPrice": 25.00, "dieselPrice": 23.00, "kerosenePrice": 23.00, "effectiveDate": "Sep 2022" },
  { "monthYear": "Feb 2023", "petrolPrice": 25.00, "dieselPrice": 23.00, "kerosenePrice": 23.00, "effectiveDate": "Sep 2022" },
  { "monthYear": "Mar 2023", "petrolPrice": 25.00, "dieselPrice": 23.00, "kerosenePrice": 23.00, "effectiveDate": "Sep 2022" },
  { "monthYear": "Apr 2023", "petrolPrice": 25.00, "dieselPrice": 23.00, "kerosenePrice": 23.00, "effectiveDate": "Sep 2022" },
  { "monthYear": "May 2023", "petrolPrice": 25.00, "dieselPrice": 23.00, "kerosenePrice": 23.00, "effectiveDate": "Sep 2022" },
  { "monthYear": "Jun 2023", "petrolPrice": 25.00, "dieselPrice": 23.00, "kerosenePrice": 23.00, "effectiveDate": "Sep 2022" },
  { "monthYear": "Jul 2023", "petrolPrice": 25.00, "dieselPrice": 23.00, "kerosenePrice": 23.00, "effectiveDate": "Sep 2022" },
  { "monthYear": "Aug 2023", "petrolPrice": 25.00, "dieselPrice": 23.00, "kerosenePrice": 23.00, "effectiveDate": "Sep 2022" },
  { "monthYear": "Sep 2023", "petrolPrice": 25.00, "dieselPrice": 23.00, "kerosenePrice": 23.00, "effectiveDate": "Sep 2022" },
  { "monthYear": "Oct 2023", "petrolPrice": 25.00, "dieselPrice": 23.00, "kerosenePrice": 23.00, "effectiveDate": "Sep 2022" },
  { "monthYear": "Nov 2023", "petrolPrice": 25.00, "dieselPrice": 23.00, "kerosenePrice": 23.00, "effectiveDate": "Sep 2022" },
  { "monthYear": "Dec 2023", "petrolPrice": 25.00, "dieselPrice": 23.00, "kerosenePrice": 23.00, "effectiveDate": "Sep 2022" },
  { "monthYear": "Jan 2024", "petrolPrice": 25.00, "dieselPrice": 23.00, "kerosenePrice": 23.00, "effectiveDate": "Sep 2022" },
  { "monthYear": "Feb 2024", "petrolPrice": 25.00, "dieselPrice": 23.00, "kerosenePrice": 23.00, "effectiveDate": "Sep 2022" },
  { "monthYear": "Mar 2024", "petrolPrice": 25.00, "dieselPrice": 23.00, "kerosenePrice": 23.00, "effectiveDate": "Sep 2022" },
  { "monthYear": "Apr 2024", "petrolPrice": 25.00, "dieselPrice": 23.00, "kerosenePrice": 23.00, "effectiveDate": "Sep 2022" },
  { "monthYear": "May 2024", "petrolPrice": 25.00, "dieselPrice": 23.00, "kerosenePrice": 23.00, "effectiveDate": "Sep 2022" },
  { "monthYear": "Jun 2024", "petrolPrice": 25.00, "dieselPrice": 23.00, "kerosenePrice": 23.00, "effectiveDate": "Sep 2022" },
  { "monthYear": "Jul 2024", "petrolPrice": 25.00, "dieselPrice": 23.00, "kerosenePrice": 23.00, "effectiveDate": "Sep 2022" },
  { "monthYear": "Aug 2024", "petrolPrice": 25.00, "dieselPrice": 23.00, "kerosenePrice": 23.00, "effectiveDate": "Sep 2022" },
  { "monthYear": "Sep 2024", "petrolPrice": 25.00, "dieselPrice": 23.00, "kerosenePrice": 23.00, "effectiveDate": "Sep 2022" },
  { "monthYear": "Oct 2024", "petrolPrice": 25.00, "dieselPrice": 23.00, "kerosenePrice": 23.00, "effectiveDate": "Sep 2022" },
  { "monthYear": "Nov 2024", "petrolPrice": 25.00, "dieselPrice": 23.00, "kerosenePrice": 23.00, "effectiveDate": "Sep 2022" },
  { "monthYear": "Dec 2024", "petrolPrice": 25.00, "dieselPrice": 23.00, "kerosenePrice": 23.00, "effectiveDate": "Sep 2022" },
  { "monthYear": "Jan 2025", "petrolPrice": 27.30, "dieselPrice": 27.40, "kerosenePrice": 25.43, "effectiveDate": "2 Jan 2025" },
  { "monthYear": "Feb 2025", "petrolPrice": 27.30, "dieselPrice": 27.40, "kerosenePrice": 25.43, "effectiveDate": "2 Jan 2025" },
  { "monthYear": "Mar 2025", "petrolPrice": 27.30, "dieselPrice": 27.40, "kerosenePrice": 26.35, "effectiveDate": "3 Mar 2025" },
  { "monthYear": "Apr 2025", "petrolPrice": 27.30, "dieselPrice": 27.40, "kerosenePrice": 26.35, "effectiveDate": "3 Mar 2025" },
  { "monthYear": "May 2025", "petrolPrice": 27.30, "dieselPrice": 27.40, "kerosenePrice": 26.35, "effectiveDate": "3 Mar 2025" },
  { "monthYear": "Jun 2025", "petrolPrice": 27.30, "dieselPrice": 27.40, "kerosenePrice": 26.35, "effectiveDate": "3 Mar 2025" },
  { "monthYear": "Jul 2025", "petrolPrice": 27.75, "dieselPrice": 28.85, "kerosenePrice": 25.79, "effectiveDate": "1 Jul 2025" },
  { "monthYear": "Aug 2025", "petrolPrice": 27.75, "dieselPrice": 28.85, "kerosenePrice": 25.79, "effectiveDate": "1 Jul 2025" },
  { "monthYear": "Sep 2025", "petrolPrice": 27.75, "dieselPrice": 28.85, "kerosenePrice": 25.79, "effectiveDate": "1 Jul 2025" },
  { "monthYear": "Oct 2025", "petrolPrice": 27.75, "dieselPrice": 28.85, "kerosenePrice": 25.79, "effectiveDate": "1 Jul 2025" },
  { "monthYear": "Nov 2025", "petrolPrice": 27.75, "dieselPrice": 28.85, "kerosenePrice": 25.79, "effectiveDate": "1 Jul 2025" },
  { "monthYear": "Dec 2025", "petrolPrice": 27.90, "dieselPrice": 29.97, "kerosenePrice": 26.78, "effectiveDate": "8 Dec 2025" },
  { "monthYear": "Jan 2026", "petrolPrice": 28.50, "dieselPrice": 28.50, "kerosenePrice": 26.76, "effectiveDate": "1 Jan 2026" },
  { "monthYear": "Feb 2026", "petrolPrice": 28.50, "dieselPrice": 28.50, "kerosenePrice": 26.76, "effectiveDate": "1 Jan 2026" },
  { "monthYear": "Mar 2026", "petrolPrice": 32.00, "dieselPrice": 35.00, "kerosenePrice": 28.03, "effectiveDate": "14 Mar 2026" },
  { "monthYear": "Apr 2026", "petrolPrice": 35.00, "dieselPrice": 40.00, "kerosenePrice": 44.67, "effectiveDate": "2 Apr 2026" },
  { "monthYear": "May 2026", "petrolPrice": 35.00, "dieselPrice": 40.00, "kerosenePrice": 41.44, "effectiveDate": "6 May 2026" },
  { "monthYear": "Jun 2026", "petrolPrice": 33.00, "dieselPrice": 35.00, "kerosenePrice": 30.65, "effectiveDate": "29 Jun 2026" },
  { "monthYear": "Jul 2026", "petrolPrice": 33.00, "dieselPrice": 35.00, "kerosenePrice": 37.25, "effectiveDate": "15 Jul 2026" }
];

async function seedData() {
  console.log('Seeding Price Trends data via Web SDK...');
  let currentBatch = writeBatch(db);
  let count = 0;
  
  for (const item of data) {
    const docRef = doc(db, 'price_trends', item.monthYear.replace(' ', '_').toLowerCase());
    currentBatch.set(docRef, {
      ...item,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    count++;
    
    // Firestore batch limit is 500
    if (count % 400 === 0) {
      await currentBatch.commit();
      currentBatch = writeBatch(db);
    }
  }
  
  if (count % 400 !== 0) {
    await currentBatch.commit();
  }
  
  console.log('Successfully seeded Price Trends data');
  process.exit(0);
}

seedData().catch(console.error);
