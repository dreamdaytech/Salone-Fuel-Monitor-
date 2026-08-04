const fs = require('fs');

// 1. Update FuelStations.tsx export
let fuelStationsContent = fs.readFileSync('src/pages/FuelStations.tsx', 'utf8');
fuelStationsContent = fuelStationsContent.replace(/export default function Home\(\) \{/g, 'export default function FuelStations() {');
fs.writeFileSync('src/pages/FuelStations.tsx', fuelStationsContent);
console.log('Updated FuelStations.tsx export');

// 2. Update App.tsx routing
let appContent = fs.readFileSync('src/App.tsx', 'utf8');
// Import Landing and FuelStations
appContent = appContent.replace(/import Home from '\.\/pages\/Home';/g, "import Landing from './pages/Landing';\nimport FuelStations from './pages/FuelStations';");
// Update Routes
appContent = appContent.replace(/<Route path="\/" element=\{<Home \/>\} \/>/g, '<Route path="/" element={<Landing />} />\n                <Route path="/stations" element={<FuelStations />} />');
fs.writeFileSync('src/App.tsx', appContent);
console.log('Updated App.tsx routing');

// 3. Update Navbar.tsx
let navbarContent = fs.readFileSync('src/components/Navbar.tsx', 'utf8');
navbarContent = navbarContent.replace(/to="\/"(\s+)className=\{`flex items-center gap-1\.5 text-sm font-medium transition-colors \$\{isActive\('\/'\)/g, 'to="/stations"$1className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${isActive(\'/stations\')');
fs.writeFileSync('src/components/Navbar.tsx', navbarContent);
console.log('Updated Navbar.tsx links');
