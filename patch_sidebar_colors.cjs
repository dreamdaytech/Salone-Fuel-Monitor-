const fs = require('fs');

let content = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

// Find the sidebar which starts around <aside and ends around </aside>
const startIndex = content.indexOf('<aside');
const endIndex = content.indexOf('</aside>', startIndex);

if (startIndex !== -1 && endIndex !== -1) {
  let before = content.substring(0, startIndex);
  let sidebar = content.substring(startIndex, endIndex + 8);
  let after = content.substring(endIndex + 8);
  
  sidebar = sidebar.replace(/text-gray-400/g, 'text-blue-100');
  sidebar = sidebar.replace(/hover:bg-white\/5/g, 'hover:bg-white/10');
  sidebar = sidebar.replace(/border-gray-800/g, 'border-white/20');
  
  fs.writeFileSync('src/pages/AdminDashboard.tsx', before + sidebar + after);
  console.log('Sidebar text colors patched successfully.');
} else {
  console.log('Could not find aside tags.');
}
