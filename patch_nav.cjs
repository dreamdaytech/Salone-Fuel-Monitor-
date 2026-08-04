const fs = require('fs');

let content = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

// The nav section starts at: <nav className="relative flex-1 overflow-y-auto py-4 px-3 space-y-2 z-10">
const navStart = content.indexOf('<nav className="relative flex-1 overflow-y-auto py-4 px-3 space-y-2 z-10">');
const navEnd = content.indexOf('</nav>', navStart);

if (navStart !== -1 && navEnd !== -1) {
  let navContent = content.substring(navStart, navEnd);
  
  // Add justify-start to the className of buttons within the nav
  navContent = navContent.replace(/w-full flex items-center gap-3 px-3 py-2\.5 rounded-xl/g, 'w-full flex items-center justify-start gap-3 px-3 py-2.5 rounded-xl');
  
  content = content.substring(0, navStart) + navContent + content.substring(navEnd);
  fs.writeFileSync('src/pages/AdminDashboard.tsx', content);
  console.log('Nav buttons updated with justify-start');
} else {
  console.log('Nav section not found');
}
