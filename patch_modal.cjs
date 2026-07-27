const fs = require('fs');
const content = fs.readFileSync('src/pages/Home.tsx', 'utf8');
const target = `                      </span>
                    )}`;
const replacement = `                      </span>
                    )}
                    {isOffline && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-800">
                        <CloudOff className="w-2.5 h-2.5" />
                        Offline
                      </span>
                    )}`;
fs.writeFileSync('src/pages/Home.tsx', content.replace(target, replacement));
