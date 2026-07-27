const fs = require('fs');
const content = fs.readFileSync('src/pages/Home.tsx', 'utf8');
const target = 'Showing <span className="text-surface-900 font-bold">{filteredStations.length}</span> stations\\n                          </p>';
const replacement = 'Showing <span className="text-surface-900 font-bold">{filteredStations.length}</span> stations\\n                          </p>\\n                          {isOffline && (\\n                            <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 text-amber-600 rounded-lg text-xs font-bold shadow-sm border border-amber-100 ml-2">\\n                              <CloudOff className="w-3.5 h-3.5" />\\n                              Offline\\n                            </div>\\n                          )}';
fs.writeFileSync('src/pages/Home.tsx', content.replace(/Showing <span className="text-surface-900 font-bold">\{filteredStations.length\}<\/span> stations\s*<\/p>/, replacement.replace(/\\n/g, '\n')));
