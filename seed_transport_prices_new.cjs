const admin = require('firebase-admin');

admin.initializeApp({
  projectId: "ai-studio-0233f303-b06f-4958-8cb3-5b709f801af6"
});

const db = admin.firestore();

const categories = [
  {
    name: "Freetown Routes",
    icon: "Bus",
    order: 1,
    vehicleTypes: ["Car", "Bus", "Poda Poda", "Keke", "Okada"],
    routes: [
      { name: "Lumley - Regent Road", price: 6.1 },
      { name: "Aberdeen - Regent Road", price: 6.1 },
      { name: "Waterloo - Bombay Street", price: 14.7 },
      { name: "Waterloo - Tokeh", price: 30.7 },
      { name: "Wilberforce - Jui", price: 13.5 },
      { name: "Lumley - Bawbaw", price: 11.0 },
      { name: "Lumley - Mambo", price: 7.4 },
      { name: "Mess Mess - Eastern Police", price: 7.4 },
      { name: "Jui - Lumley", price: 19.7 },
      { name: "Grafton - Bombay Street", price: 12.3 },
      { name: "Wellington - Eastern Police", price: 7.4 },
      { name: "Gloucester - Model", price: 12.3 },
      { name: "Regent - Bus Station", price: 12.3 },
      { name: "Charlotte Street - Wilberforce", price: 8.6 },
      { name: "Calaba Town - Goderich Street", price: 8.6 },
      { name: "Brima Lane - Eastern Police", price: 7.4 }
    ]
  },
  {
    name: "Freetown to Provincial",
    icon: "Bus",
    order: 2,
    vehicleTypes: ["Car", "Bus", "Poda Poda"],
    routes: [
      { name: "Freetown - Kailahun", price: 307.1 },
      { name: "Freetown - Kono", price: 233.5 },
      { name: "Freetown - Kabala", price: 196.5 },
      { name: "Freetown - Kenema", price: 184.3 },
      { name: "Freetown - Bo", price: 159.7 },
      { name: "Freetown - Kambia", price: 147.4 },
      { name: "Freetown - Makeni", price: 147.4 },
      { name: "Freetown - Port Loko", price: 147.4 },
      { name: "Freetown - Moyamba", price: 159.7 },
      { name: "Freetown - Matru/Bonthe", price: 172.0 },
      { name: "Freetown - Lunsar", price: 110.6 }
    ]
  },
  {
    name: "Provincial",
    icon: "Bus",
    order: 3,
    vehicleTypes: ["Car", "Bus", "Poda Poda"],
    routes: [
      { name: "Kenema - Kailahun", price: 147.4 },
      { name: "Kenema - Jendema", price: 227.2 },
      { name: "Kenema - Segbema", price: 92.1 },
      { name: "Kenema - Gendema", price: 258.0 },
      { name: "Kenema - Bo", price: 73.7 },
      { name: "Kenema - Pamalap", price: 319.4 },
      { name: "Bo - Mattru John", price: 110.6 },
      { name: "Bo - Rutile", price: 104.4 },
      { name: "Bo - Gnamgatoke", price: 110.6 },
      { name: "Bo - Makeni", price: 258.0 },
      { name: "Bo - Freetown", price: 165.8 },
      { name: "Bo - Jendema", price: 165.8 },
      { name: "Bo - Taima", price: 55.3 },
      { name: "Bo - Pujehun", price: 79.9 },
      { name: "Makeni - Magburaka", price: 49.2 },
      { name: "Makeni - Kabala", price: 159.7 },
      { name: "Makeni - Kamabai", price: 61.4 },
      { name: "Makeni - Kono", price: 147.4 },
      { name: "Makeni - Lunsar", price: 73.7 },
      { name: "Makeni - Kamakwei", price: 159.7 }
    ]
  },
  {
    name: "Ferry",
    icon: "Ship",
    order: 4,
    vehicleTypes: ["Ferry", "Ship"],
    routes: [
      { name: "First Class Tickets", price: 59.2 },
      { name: "Second Class Ticket", price: 32.1 },
      { name: "Van/Jeep", price: 258.0 },
      { name: "Cars", price: 214.6 },
      { name: "Coach Below 25 Seats", price: 271.7 },
      { name: "Coach Between 25 and 40", price: 342.4 },
      { name: "Coach 42 Seats", price: 442.8 },
      { name: "Coach Above 42 Seats", price: 685.0 },
      { name: "Truck Empty", price: 0, isNegotiable: true },
      { name: "Truck Full", price: 0, isNegotiable: true },
      { name: "Motor Bike", price: 60.6 },
      { name: "Bus Eg. TATA", price: 1124.2 },
      { name: "Biscycles", price: 32.9 },
      { name: "Tricycle (KEKEH)", price: 175.2 },
      { name: "Trailer (20ft)", price: 0, isNegotiable: true },
      { name: "Trailer (40ft)", price: 0, isNegotiable: true },
      { name: "Student (In Uniform)", price: 0 }, // Free
      { name: "Forces (GoSL)", price: 11.8 },
      { name: "Luggage", price: 0, isNegotiable: true }
    ]
  }
];

const effectiveDate = "2026-06-30"; // Tuesday 30th June, 2026
const updatedBy = "admin_seed_script";

async function seedTransportData() {
  console.log('Seeding Transport Data...');
  
  // Create Categories first
  for (const cat of categories) {
    console.log(`Processing Category: ${cat.name}`);
    const catQuery = await db.collection('transport_categories').where('name', '==', cat.name).get();
    let categoryId = '';
    
    if (catQuery.empty) {
      const docRef = db.collection('transport_categories').doc();
      await docRef.set({
        name: cat.name,
        icon: cat.icon,
        order: cat.order,
        description: `${cat.name} standard pricing`,
        routes: cat.routes.map(r => r.name),
        vehicleTypes: cat.vehicleTypes,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      categoryId = docRef.id;
      console.log(`Created new category ${cat.name} with ID ${categoryId}`);
    } else {
      const existingDoc = catQuery.docs[0];
      categoryId = existingDoc.id;
      await existingDoc.ref.update({
        routes: cat.routes.map(r => r.name),
        vehicleTypes: cat.vehicleTypes,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`Updated existing category ${cat.name} with ID ${categoryId}`);
    }

    // Process prices for this category
    for (const route of cat.routes) {
      // Find existing price to overwrite or create new
      const priceQuery = await db.collection('transport_prices')
        .where('categoryId', '==', categoryId)
        .where('route', '==', route.name)
        .get();

      const defaultVehicleType = cat.icon === "Ship" ? "Ferry" : "Car";
      
      const priceData = {
        route: route.name,
        categoryId: categoryId,
        price: route.price,
        isNegotiable: route.isNegotiable || false,
        vehicleType: defaultVehicleType,
        date: effectiveDate,
        updatedBy: updatedBy,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      };

      if (priceQuery.empty) {
        await db.collection('transport_prices').add(priceData);
        console.log(`  Added price for route ${route.name}`);
      } else {
        await priceQuery.docs[0].ref.update(priceData);
        console.log(`  Updated price for route ${route.name}`);
      }
    }
  }
  
  console.log('Successfully seeded Transport Data');
}

seedTransportData().catch(console.error);
