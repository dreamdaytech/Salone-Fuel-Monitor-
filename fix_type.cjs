const fs = require('fs');
let content = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

content = content.replace(
  "const [activeTab, setActiveTab] = useState<'overview' | 'stations' | 'submitted_stations' | 'map' | 'users' | 'prices' | 'transport' | 'messages' | 'reviews' | 'settings'>('overview');",
  "const [activeTab, setActiveTab] = useState<'overview' | 'stations' | 'submitted_stations' | 'map' | 'users' | 'prices' | 'price_trends' | 'transport' | 'messages' | 'reviews' | 'settings'>('overview');"
);

fs.writeFileSync('src/pages/AdminDashboard.tsx', content);

let trendsContent = fs.readFileSync('src/components/AdminPriceTrends.tsx', 'utf8');

trendsContent = trendsContent.replace(
  "import { db } from '../lib/firebase';",
  "import { db } from '../firebase';"
);

trendsContent = trendsContent.replace(
  "import { Button } from './Button';",
  "import { Button } from './ui/Button';"
);

trendsContent = trendsContent.replace(
  /petrolPrice: e\.target\.value/g,
  "petrolPrice: e.target.value ? Number(e.target.value) : ''"
);

trendsContent = trendsContent.replace(
  /dieselPrice: e\.target\.value/g,
  "dieselPrice: e.target.value ? Number(e.target.value) : ''"
);

trendsContent = trendsContent.replace(
  /kerosenePrice: e\.target\.value/g,
  "kerosenePrice: e.target.value ? Number(e.target.value) : ''"
);

fs.writeFileSync('src/components/AdminPriceTrends.tsx', trendsContent);
