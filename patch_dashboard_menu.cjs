const fs = require('fs');

let content = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

// 1. Update <aside> classes and add the pattern overlay
const oldAsideStart = `<aside 
          className={\`bg-surface-900 text-gray-400 transition-all duration-300 flex flex-col fixed md:sticky top-0 h-screen z-50 md:z-40 w-64 \${`;

const newAsideStart = `<aside 
          className={\`relative overflow-hidden bg-gradient-to-br from-[#0072C6] via-[#005aa0] to-[#1EB53A] text-blue-100 transition-all duration-300 flex flex-col fixed md:sticky top-0 h-screen z-50 md:z-40 w-64 border-r border-white/10 \${`;

const logoSectionStart = `{/* Logo Section */}`;

const backgroundOverlay = `
          {/* Background Overlay */}
          <div 
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{ 
              backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', 
              backgroundSize: '60px 60px' 
            }} 
          />
          
          `;

if (content.includes(oldAsideStart)) {
  content = content.replace(oldAsideStart, newAsideStart);
  content = content.replace(logoSectionStart, backgroundOverlay + logoSectionStart);
}

// 2. Change text-gray-400 to text-blue-100 for the nav buttons inside the aside
// To avoid replacing text-gray-400 everywhere in the file, we'll only replace it inside the <nav> block
const navMatch = content.match(/<nav className="flex-1 overflow-y-auto py-4 px-3 space-y-[0-9]+">([\s\S]*?)<\/nav>/);
if (navMatch) {
  let navContent = navMatch[0];
  navContent = navContent.replace(/text-gray-400/g, 'text-blue-100');
  navContent = navContent.replace(/hover:bg-white\/5/g, 'hover:bg-white/10');
  
  content = content.replace(navMatch[0], navContent);
}

// 3. Make the bottom Sign Out section look good (if it exists)
const signOutMatch = content.match(/<div className="p-4 border-t border-gray-800">([\s\S]*?)<\/div>/);
if (signOutMatch) {
  let signOutContent = signOutMatch[0];
  signOutContent = signOutContent.replace(/border-gray-800/g, 'border-white/20 relative z-10');
  signOutContent = signOutContent.replace(/text-gray-400/g, 'text-blue-100');
  content = content.replace(signOutMatch[0], signOutContent);
}

// Also make Logo Section relative z-10 so it sits above the pattern
content = content.replace(/<div className="p-6 flex items-center justify-between">/g, '<div className="relative p-6 flex items-center justify-between z-10">');
content = content.replace(/<nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">/g, '<nav className="relative flex-1 overflow-y-auto py-4 px-3 space-y-1 z-10">');
content = content.replace(/<nav className="flex-1 overflow-y-auto py-4 px-3 space-y-2">/g, '<nav className="relative flex-1 overflow-y-auto py-4 px-3 space-y-2 z-10">');


fs.writeFileSync('src/pages/AdminDashboard.tsx', content);
console.log('Successfully patched AdminDashboard.tsx sidebar');
