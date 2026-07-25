const fs = require('fs');
let content = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

const correctSidebar = `
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
            <Button 
              onClick={() => { setActiveTab('transport'); setIsMobileMenuOpen(false); }}
              showNotification={false}
              variant="ghost"
              className={\`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative \${
                activeTab === 'transport' 
                  ? 'bg-white/10 text-white' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }\`}
            >
              {activeTab === 'transport' && <div className="absolute left-0 w-1 h-6 bg-primary rounded-r-full" />}
              <Bus className={\`w-5 h-5 shrink-0 \${activeTab === 'transport' ? 'text-primary' : 'group-hover:text-white'}\`} />
              {(!isSidebarCollapsed || isMobileMenuOpen) && <span className="font-semibold text-sm">Transport</span>}
            </Button>
            <Button 
              onClick={() => { setActiveTab('messages'); setIsMobileMenuOpen(false); }}
              showNotification={false}
              variant="ghost"
              className={\`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative \${
                activeTab === 'messages' 
                  ? 'bg-white/10 text-white' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }\`}
            >
              {activeTab === 'messages' && <div className="absolute left-0 w-1 h-6 bg-primary rounded-r-full" />}
              <MessageSquare className={\`w-5 h-5 shrink-0 \${activeTab === 'messages' ? 'text-primary' : 'group-hover:text-white'}\`} />
              {(!isSidebarCollapsed || isMobileMenuOpen) && <span className="font-semibold text-sm">Messages</span>}
            </Button>
            <Button 
              onClick={() => { setActiveTab('reviews'); setIsMobileMenuOpen(false); }}
              showNotification={false}
              variant="ghost"
              className={\`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative \${
                activeTab === 'reviews' 
                  ? 'bg-white/10 text-white' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }\`}
            >
              {activeTab === 'reviews' && <div className="absolute left-0 w-1 h-6 bg-primary rounded-r-full" />}
              <Star className={\`w-5 h-5 shrink-0 \${activeTab === 'reviews' ? 'text-primary' : 'group-hover:text-white'}\`} />
              {(!isSidebarCollapsed || isMobileMenuOpen) && <span className="font-semibold text-sm">Review Moderation</span>}
            </Button>
            <Button 
              onClick={() => { setActiveTab('settings'); setIsMobileMenuOpen(false); }}
              showNotification={false}
              variant="ghost"
              className={\`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative \${
                activeTab === 'settings' 
                  ? 'bg-white/10 text-white' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }\`}
            >
              {activeTab === 'settings' && <div className="absolute left-0 w-1 h-6 bg-primary rounded-r-full" />}
              <Settings className={\`w-5 h-5 shrink-0 \${activeTab === 'settings' ? 'text-primary' : 'group-hover:text-white'}\`} />
              {(!isSidebarCollapsed || isMobileMenuOpen) && <span className="font-semibold text-sm">Settings</span>}
            </Button>
          </nav>
`;

const match = content.match(/<nav className="flex-1 overflow-y-auto py-4 px-3 space-y-2">[\s\S]*?<\/nav>/);
if (match) {
  content = content.replace(match[0], correctSidebar.trim());
  fs.writeFileSync('src/pages/AdminDashboard.tsx', content);
} else {
  console.log("Could not find nav tag to replace");
}
