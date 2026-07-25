const fs = require('fs');
let content = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

const correctSection = `
          {/* Logo Section */}
          <div className="p-6 flex items-center justify-between">
            {(!isSidebarCollapsed || isMobileMenuOpen) && (
              <div className="flex items-center gap-2">
                <div className="bg-primary p-1.5 rounded-lg">
                  <Fuel className="h-5 w-5 text-white" />
                </div>
                <span className="text-white font-bold text-lg tracking-tight">SL Fuel Monitor</span>
              </div>
            )}
            <Button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              showNotification={false}
              variant="ghost"
              className="hidden md:flex p-2 hover:bg-white/10 text-white rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </Button>
            <Button
              onClick={() => setIsMobileMenuOpen(false)}
              showNotification={false}
              variant="ghost"
              className="md:hidden p-2 hover:bg-white/10 text-white rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-2">
            <Button 
              onClick={() => { setActiveTab('overview'); setIsMobileMenuOpen(false); }}
              showNotification={false}
              variant="ghost"
              className={\`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative \${
                activeTab === 'overview' 
                  ? 'bg-white/10 text-white' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }\`}
            >
              {activeTab === 'overview' && <div className="absolute left-0 w-1 h-6 bg-primary rounded-r-full" />}
              <LayoutDashboard className={\`w-5 h-5 shrink-0 \${activeTab === 'overview' ? 'text-primary' : 'group-hover:text-white'}\`} />
              {(!isSidebarCollapsed || isMobileMenuOpen) && <span className="font-semibold text-sm">Overview</span>}
            </Button>
            <Button 
              onClick={() => { setActiveTab('stations'); setIsMobileMenuOpen(false); }}
              showNotification={false}
              variant="ghost"
              className={\`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative \${
                activeTab === 'stations' 
                  ? 'bg-white/10 text-white' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }\`}
            >
              {activeTab === 'stations' && <div className="absolute left-0 w-1 h-6 bg-primary rounded-r-full" />}
              <Building2 className={\`w-5 h-5 shrink-0 \${activeTab === 'stations' ? 'text-primary' : 'group-hover:text-white'}\`} />
              {(!isSidebarCollapsed || isMobileMenuOpen) && <span className="font-semibold text-sm">Stations</span>}
            </Button>
            <Button 
              onClick={() => { setActiveTab('submitted_stations'); setIsMobileMenuOpen(false); }}
              showNotification={false}
              variant="ghost"
              className={\`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative \${
                activeTab === 'submitted_stations' 
                  ? 'bg-white/10 text-white' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }\`}
            >
              {activeTab === 'submitted_stations' && <div className="absolute left-0 w-1 h-6 bg-primary rounded-r-full" />}
              <Clock className={\`w-5 h-5 shrink-0 \${activeTab === 'submitted_stations' ? 'text-primary' : 'group-hover:text-white'}\`} />
              {(!isSidebarCollapsed || isMobileMenuOpen) && <span className="font-semibold text-sm">Submitted Stations</span>}
            </Button>
            <Button 
              onClick={() => { setActiveTab('map'); setIsMobileMenuOpen(false); }}
              showNotification={false}
              variant="ghost"
              className={\`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative \${
                activeTab === 'map' 
                  ? 'bg-white/10 text-white' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }\`}
            >
              {activeTab === 'map' && <div className="absolute left-0 w-1 h-6 bg-primary rounded-r-full" />}
              <MapPin className={\`w-5 h-5 shrink-0 \${activeTab === 'map' ? 'text-primary' : 'group-hover:text-white'}\`} />
              {(!isSidebarCollapsed || isMobileMenuOpen) && <span className="font-semibold text-sm">Map View</span>}
            </Button>
            <Button 
              onClick={() => { setActiveTab('users'); setIsMobileMenuOpen(false); }}
              showNotification={false}
              variant="ghost"
              className={\`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative \${
                activeTab === 'users' 
                  ? 'bg-white/10 text-white' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }\`}
            >
              {activeTab === 'users' && <div className="absolute left-0 w-1 h-6 bg-primary rounded-r-full" />}
              <Users className={\`w-5 h-5 shrink-0 \${activeTab === 'users' ? 'text-primary' : 'group-hover:text-white'}\`} />
              {(!isSidebarCollapsed || isMobileMenuOpen) && <span className="font-semibold text-sm">Users</span>}
            </Button>
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

const regex = /\{\/\* Logo Section \*\/\}[\s\S]*?<Button \s*onClick=\{\(\) => \{ setActiveTab\('transport'\);/;
const match = content.match(regex);
if (match) {
  content = content.replace(match[0], correctSection.trim() + `
            <Button 
              onClick={() => { setActiveTab('transport');`);
  fs.writeFileSync('src/pages/AdminDashboard.tsx', content);
  console.log("Fixed sidebar successfully");
} else {
  console.log("Could not find section to replace");
}
