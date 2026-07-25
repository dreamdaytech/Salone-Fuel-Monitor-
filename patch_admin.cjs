const fs = require('fs');

let content = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

// Add import for AdminPriceTrends and Activity
content = content.replace(
  "import AdminTransportPrices from '../components/AdminTransportPrices';",
  "import { AdminPriceTrends } from '../components/AdminPriceTrends';\nimport AdminTransportPrices from '../components/AdminTransportPrices';"
);

content = content.replace(
  "LayoutDashboard, Search,",
  "LayoutDashboard, Search, Activity,"
);

// Add the state type for activeTab
content = content.replace(
  "const [activeTab, setActiveTab] = useState<'overview' | 'stations' | 'submitted_stations' | 'map' | 'users' | 'prices' | 'transport' | 'messages' | 'reviews' | 'settings'>('overview');",
  "const [activeTab, setActiveTab] = useState<'overview' | 'stations' | 'submitted_stations' | 'map' | 'users' | 'prices' | 'price_trends' | 'transport' | 'messages' | 'reviews' | 'settings'>('overview');"
);

// Add the sidebar button
const sidebarButton = `
            <Button 
              onClick={() => { setActiveTab('prices'); setIsMobileMenuOpen(false); }}
              showNotification={false}
              variant="ghost"
              className={\`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative \${
                activeTab === 'prices' 
                  ? 'bg-white/10 text-white' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }\`}
            >
              {activeTab === 'prices' && <div className="absolute left-0 w-1 h-6 bg-primary rounded-r-full" />}
              <TrendingUp className={\`w-5 h-5 shrink-0 \${activeTab === 'prices' ? 'text-primary' : 'group-hover:text-white'}\`} />
              {(!isSidebarCollapsed || isMobileMenuOpen) && <span className="font-semibold text-sm">Official Prices</span>}
            </Button>
            <Button 
              onClick={() => { setActiveTab('price_trends'); setIsMobileMenuOpen(false); }}
              showNotification={false}
              variant="ghost"
              className={\`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative \${
                activeTab === 'price_trends' 
                  ? 'bg-white/10 text-white' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }\`}
            >
              {activeTab === 'price_trends' && <div className="absolute left-0 w-1 h-6 bg-primary rounded-r-full" />}
              <Activity className={\`w-5 h-5 shrink-0 \${activeTab === 'price_trends' ? 'text-primary' : 'group-hover:text-white'}\`} />
              {(!isSidebarCollapsed || isMobileMenuOpen) && <span className="font-semibold text-sm">Price Trends</span>}
            </Button>
`;

content = content.replace(
  /            <Button [\s\S]*?Official Prices[\s\S]*?<\/Button>/,
  sidebarButton.trim()
);

// Add the content block
const contentBlock = `
            {activeTab === 'price_trends' && (
              <AdminPriceTrends />
            )}
`;

content = content.replace(
  "{activeTab === 'prices' && (",
  contentBlock + "\n            {activeTab === 'prices' && ("
);

fs.writeFileSync('src/pages/AdminDashboard.tsx', content);
