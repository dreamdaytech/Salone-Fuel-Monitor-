const fs = require('fs');

const files = [
  'src/pages/FuelStations.tsx',
  'src/pages/StationDashboard.tsx',
  'src/components/AdminStationMap.tsx',
  'src/pages/LocationPickerPage.tsx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Check if claimStatus is already there
    if (!content.includes('claimStatus?:')) {
      // Find where status?: is, or isOutOfStock?: is, and inject below it
      content = content.replace(
        /isOutOfStock\?: boolean;/g,
        "isOutOfStock?: boolean;\n  ownerId?: string | null;\n  claimStatus?: 'unclaimed' | 'pending' | 'claimed';"
      );
      
      // For StationDashboard.tsx which has ownerId: string;
      if (file.includes('StationDashboard.tsx')) {
        content = content.replace(/ownerId: string;/g, "ownerId?: string | null;\n  claimStatus?: 'unclaimed' | 'pending' | 'claimed';");
      }
      
      fs.writeFileSync(file, content);
      console.log(`Patched ${file}`);
    }
  }
});
