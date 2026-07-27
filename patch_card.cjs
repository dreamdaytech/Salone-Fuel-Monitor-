const fs = require('fs');
const content = fs.readFileSync('src/pages/Home.tsx', 'utf8');
const target = `                  {activePromos.length > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-amber-500 text-white shadow-sm animate-in bounce-in duration-500">
                      <Percent className="w-3 h-3" />
                      Promo
                    </span>
                  )}`;
const replacement = `                  {activePromos.length > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-amber-500 text-white shadow-sm animate-in bounce-in duration-500">
                      <Percent className="w-3 h-3" />
                      Promo
                    </span>
                  )}
                  {isOffline && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-amber-100 text-amber-800 shadow-sm border border-amber-200">
                      <CloudOff className="w-3 h-3" />
                      Offline
                    </span>
                  )}`;
fs.writeFileSync('src/pages/Home.tsx', content.replace(target, replacement));
