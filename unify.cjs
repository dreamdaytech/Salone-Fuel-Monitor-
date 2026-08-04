const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;

      const gradientDotPatternTextWhite = `relative overflow-hidden bg-gradient-to-br from-[#0072C6] via-[#005aa0] to-[#1EB53A] text-white">
        <div 
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ 
            backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', 
            backgroundSize: '60px 60px' 
          }} 
        />`;

      // 1. RegionalComparison.tsx, MarketIntelligence.tsx, ExchangeRates.tsx
      content = content.replace(/bg-gradient-to-br from-surface-900 via-surface-800 to-emerald-900 text-white">/g, gradientDotPatternTextWhite);

      // 2. About.tsx
      content = content.replace(/bg-surface-900 py-24 relative overflow-hidden">/g, `relative overflow-hidden bg-gradient-to-br from-[#0072C6] via-[#005aa0] to-[#1EB53A] py-24">
        <div 
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ 
            backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', 
            backgroundSize: '60px 60px' 
          }} 
        />`);

      // 3. Contact.tsx
      content = content.replace(/bg-surface-900 p-8 rounded-\[2rem\] text-white relative overflow-hidden">/g, `relative overflow-hidden bg-gradient-to-br from-[#0072C6] via-[#005aa0] to-[#1EB53A] p-8 rounded-[2rem] text-white">
        <div 
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ 
            backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', 
            backgroundSize: '60px 60px' 
          }} 
        />`);

      // 4. AdminBarrelVsFuel.tsx
      content = content.replace(/bg-gradient-to-r from-\[#0072C6\] to-\[#005aa0\] shadow-md">/g, `relative overflow-hidden bg-gradient-to-br from-[#0072C6] via-[#005aa0] to-[#1EB53A] shadow-md">
        <div 
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ 
            backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', 
            backgroundSize: '60px 60px' 
          }} 
        />`);
      
      // Update decorative elements that are white/10 in About.tsx to prevent clash
      if (file === 'About.tsx') {
        content = content.replace(/bg-primary\/10 rounded-full/g, 'bg-white/10 rounded-full');
        content = content.replace(/bg-emerald-500\/10 rounded-full/g, 'bg-white/10 rounded-full');
        // change "About Salone Fuel Monitor" where Salone Fuel Monitor is text-primary -> text-white
        content = content.replace(/text-primary">Salone Fuel Monitor/g, 'text-blue-100">Salone Fuel Monitor');
        content = content.replace(/text-slate-400/g, 'text-blue-100');
      }

      if (file === 'Contact.tsx') {
        content = content.replace(/text-primary/g, 'text-blue-200');
        content = content.replace(/text-slate-400/g, 'text-blue-100');
      }

      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content);
        console.log(`Updated backgrounds in ${fullPath}`);
      }
    }
  }
}

processDir('src/pages');
