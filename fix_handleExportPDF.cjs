const fs = require('fs');

let content = fs.readFileSync('src/pages/BarrelVsFuel.tsx', 'utf8');

// Extract the handleExportPDF function
const startIdx = content.indexOf('  const handleExportPDF = async () => {');
const endMarker = '    }\n  };\n';
const endIdx = content.indexOf(endMarker, startIdx) + endMarker.length;

if (startIdx !== -1 && endIdx > startIdx) {
  const funcContent = content.substring(startIdx, endIdx);
  
  // Remove it from its current position
  content = content.substring(0, startIdx) + content.substring(endIdx);
  
  // Find the real return statement: "  return (\n    <div className="min-h-screen bg-surface-50">"
  const mainReturnIdx = content.indexOf('  return (\n    <div className="min-h-screen bg-surface-50">');
  
  if (mainReturnIdx !== -1) {
    // Insert it right before the main return statement
    content = content.substring(0, mainReturnIdx) + funcContent + '\n' + content.substring(mainReturnIdx);
    fs.writeFileSync('src/pages/BarrelVsFuel.tsx', content);
    console.log('Fixed handleExportPDF location');
  } else {
    console.log('Could not find main return statement');
  }
} else {
  console.log('Could not find handleExportPDF function');
}
