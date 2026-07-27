const fs = require('fs');
const content = fs.readFileSync('src/pages/Home.tsx', 'utf8');
const target = `                          <div className="h-4 w-px bg-gray-200 hidden sm:block"></div>
                          <p className="text-sm text-gray-500 font-medium">
                            Showing <span className="text-surface-900 font-bold">{filteredStations.length}</span> stations
                          </p>
                        </div>`;
const replacement = `                          <div className="h-4 w-px bg-gray-200 hidden sm:block"></div>
                          <p className="text-sm text-gray-500 font-medium flex items-center gap-2">
                            <span>Showing <span className="text-surface-900 font-bold">{filteredStations.length}</span> stations</span>
                            {isOffline && (
                              <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md text-[10px] font-bold uppercase tracking-wider">
                                <CloudOff className="w-3 h-3" />
                                Offline
                              </span>
                            )}
                          </p>
                        </div>`;
fs.writeFileSync('src/pages/Home.tsx', content.replace(target, replacement));
