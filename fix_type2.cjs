const fs = require('fs');
let content = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

const original = "const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'stations' | 'submitted_stations' | 'map' | 'prices' | 'transport' | 'messages' | 'reviews' | 'settings'>('overview');";
const updated = "const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'stations' | 'submitted_stations' | 'map' | 'prices' | 'price_trends' | 'transport' | 'messages' | 'reviews' | 'settings'>('overview');";

content = content.replace(original, updated);

fs.writeFileSync('src/pages/AdminDashboard.tsx', content);
