# Salone Fuel Monitor

> **Sierra Leone's first dedicated fuel price transparency and market intelligence platform.**

Salone Fuel Monitor is a public interest web application built and maintained by **DreamDay Technology Limited**. It empowers citizens, businesses, and institutions in Sierra Leone with real-time access to official fuel prices, station locations, transport fares, and energy sector analytics.

🌐 **Live Platform:** [https://salonefuelmonitor.com](https://salonefuelmonitor.com)

---

## 🛢️ Platform Features

### 1. Real-Time Fuel Prices
Track official pump prices for **Petrol (PMS)**, **Diesel (AGO)**, and **Kerosene (DPK)** at stations nationwide. Prices are updated directly from official and verified sources.

### 2. Fuel Station Finder
An interactive map of verified fuel stations across all districts in Sierra Leone. Each station shows:
- Live stock status (In Stock / Low Stock / Out of Stock)
- Queue length reports
- User reviews and ratings
- Fuel type availability

### 3. Price Trends & History
A complete historical record of Sierra Leone's official fuel prices with:
- Interactive line/bar charts by fuel type
- Month-over-month and year-over-year comparisons
- One-click branded PDF report export

### 4. Transport Fare Directory
Official public transport fares across all districts — Poda-Poda, Taxi, and intercity routes. Updated whenever government revises fares. Protects commuters from overcharging.

### 5. Regional Fuel Comparison
Live side-by-side comparison of Sierra Leone's fuel prices against **8 West African neighbours**:
- Card, Table, Map, and Chart views
- USD and local currency display modes
- World average benchmark
- Medal-style ranking system

### 6. Barrel vs. Pump Price Tracker
Tracks the relationship between **global crude oil prices (Brent & WTI)** and Sierra Leone's local pump prices over time. Includes overlay charts, historical correlation analysis, and PDF report export.

### 7. Exchange Rate Monitor
Tracks **Bank of Sierra Leone official exchange rates** alongside parallel market rates for USD, GBP, EUR, and other major currencies.

### 8. Fuel Calculator
Instantly calculates fuel cost and quantity needed for any journey based on vehicle efficiency, distance, and today's live prices. Supports all three fuel types.

### 9. Transport Trends
Historical analysis of public transport fare changes over time, filterable by route, district, and vehicle type.

### 10. My Garage (Personal Fleet Manager)
A personal vehicle management tool for individual users, businesses, and dispatch operations:
- Add and manage multiple vehicles
- Log fuel fill-ups with cost and quantity
- Track trip history and mileage
- Monitor maintenance records and service intervals
- Export fuel and trip reports as PDF

### 11. Market Intelligence & Blog
Analysis, blog posts, and data-driven insights on energy economics, fuel policy, and market trends affecting Sierra Leone. Features:
- Rich text blog posts with cover images and tags
- SEO-optimised post pages with Open Graph sharing
- "More to Explore" recommended posts section

---

## 👥 User Roles

| Role | Access |
|---|---|
| **Public** | All price data, station map, transport fares, blog, calculator |
| **Registered User** | Above + My Garage, price alerts, favourites, profile |
| **Station Owner** | Above + Station Dashboard (stock updates, reviews, analytics) |
| **Admin** | Full platform management, price data entry, blog CMS, user management, system settings |

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | React 18 + TypeScript |
| **Build Tool** | Vite |
| **Styling** | Tailwind CSS v4 |
| **Animations** | Motion (Framer Motion) |
| **Routing** | React Router v6 |
| **Database** | Firebase Firestore |
| **Authentication** | Firebase Auth |
| **File Storage** | Firebase Storage |
| **Analytics** | Firebase Analytics |
| **Push Notifications** | Firebase Cloud Messaging (FCM) |
| **Mapping** | Leaflet + React Leaflet |
| **Charts** | Recharts |
| **PDF Export** | jsPDF + html-to-image |
| **Notifications/Toast** | Sonner |
| **Icons** | Lucide React |
| **PWA** | Vite PWA Plugin (Workbox) |
| **Hosting** | Firebase Hosting |

---

## 🏗️ Project Structure

```
src/
├── components/          # Shared UI components (Navbar, Footer, AdminBlog, etc.)
├── contexts/            # React contexts (AuthContext, NotificationContext, FavoriteContext)
├── firebase.ts          # Firebase initialisation and exports
├── hooks/               # Custom hooks (useSEO, useAnalytics, usePageViewTracker)
├── pages/               # All application pages (29 pages)
│   ├── Landing.tsx      # Home page
│   ├── FuelStations.tsx # Station finder with map
│   ├── PriceTrends.tsx  # Historical price charts
│   ├── TransportPrices.tsx
│   ├── RegionalComparison.tsx
│   ├── BarrelVsFuel.tsx
│   ├── ExchangeRates.tsx
│   ├── Calculator.tsx
│   ├── MyGarage.tsx
│   ├── BlogList.tsx / BlogPost.tsx
│   ├── MarketIntelligence.tsx
│   ├── AdminDashboard.tsx
│   ├── StationDashboard.tsx
│   └── ...
├── services/            # Business logic (NotificationService, etc.)
public/
├── images/              # Section and feature images
├── og-image.png         # Open Graph share image
├── logo.png             # App logo / favicon
├── sitemap.xml          # XML sitemap for Google & Bing
├── robots.txt           # Crawler instructions
└── firebase-messaging-sw.js  # FCM service worker
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18 or higher
- npm

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/dreamdaytech/Salone-Fuel-Monitor-.git
   cd Salone-Fuel-Monitor-
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**

   Create a `.env` file in the root directory:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
   VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

6. **Deploy to Firebase Hosting**
   ```bash
   firebase deploy
   ```

---

## 🔥 Firebase Collections

| Collection | Description |
|---|---|
| `users` | User profiles, roles, alert preferences |
| `stations` | Verified fuel station data |
| `stationReports` | Crowdsourced stock/queue reports |
| `stationReviews` | User ratings and reviews |
| `fuelPrices` | Official fuel price history |
| `transportPrices` | Official transport fare data |
| `barrelFuelSnapshots` | Global crude oil vs pump price records |
| `exchangeRates` | Official and parallel exchange rate records |
| `blogPosts` | Market intelligence blog content |
| `vehicles` | User garage vehicle records |
| `fuelLogs` | Personal fuel fill-up logs |
| `tripLogs` | Personal trip history |
| `maintenanceLogs` | Vehicle maintenance records |
| `system/version` | App version document for Force Update system |

---

## 📈 SEO & Performance

- **Google PageSpeed:** Desktop 73 / Mobile 63 (actively optimising)
- **SEO Score:** 100/100 (Google PageSpeed)
- **Sitemap:** `https://salonefuelmonitor.com/sitemap.xml`
- **Structured Data:** JSON-LD WebSite + Organization schema
- **Open Graph:** Full og: tags for Facebook, WhatsApp, Twitter
- **PWA:** Installable as a Progressive Web App on mobile devices

---

## 🔒 Security & Privacy

- Firebase Authentication with email/password
- Firestore security rules enforce role-based access
- Admin and station owner routes are protected by role checks
- Private routes blocked from search engine crawlers via `robots.txt`
- Privacy Policy, Terms of Service, and Cookie Policy pages included

---

## 📬 Contact

**DreamDay Technology Limited**
- 📧 [slfuelmonitor@gmail.com](mailto:slfuelmonitor@gmail.com)
- 📞 +232 76 111668
- 🌐 [https://salonefuelmonitor.com](https://salonefuelmonitor.com)

---

*Salone Fuel Monitor is an independent public interest platform committed to fuel price transparency and energy sector accountability in Sierra Leone.*
