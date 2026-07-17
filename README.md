# Salone Fuel Monitor

Salone Fuel Monitor is a comprehensive real-time fuel tracking and monitoring web application designed specifically for Sierra Leone. The application empowers citizens, station operators, and regulators with real-time updates on fuel availability, pricing, and station statuses across all districts in Sierra Leone.

---

## 🌟 Key Features

- **Interactive Maps Integration**: Visualize fuel stations across Sierra Leone using Google Maps. See real-time availability status (In Stock, Low Stock, Out of Stock) represented dynamically on the map.
- **District-Based Filtering**: Easily locate stations within any of Sierra Leone's districts.
- **Real-Time Fuel Updates**: Crowdsourced and operator-verified reports on Petrol, Diesel, and Kerosene availability, prices, and queue lengths.
- **User Authentication**: Secure email-based and phone verification systems built on Firebase.
- **Station Profiles & Favorites**: Save frequently visited stations to a personalized dashboard for instant monitoring.
- **Dynamic Analytics**: Real-time charts demonstrating pricing trends, regional availability, and historical data points.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS
- **Interactions/Animations**: Framer Motion
- **Database & Backend**: Firebase Firestore & Firebase Auth
- **Geospatial & Mapping**: Google Maps Platform, Places API (New)
- **Data Visualization**: Recharts, Lucide Icons

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or bun

### Installation

1. Clone the repository or navigate to the project directory.
2. Install the dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and configure your credentials (refer to `.env.example`):
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

---

## 🏢 Developed By

This software is developed and maintained by **DreamDay Technology Limited**.
