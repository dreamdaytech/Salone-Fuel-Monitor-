import React, { useState, useEffect, useMemo } from 'react';
import { db, collection, query, orderBy, onSnapshot } from '../firebase';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import { Activity, History, ChevronDown } from 'lucide-react';

export default function PriceTrends() {
  const [globalPriceHistory, setGlobalPriceHistory] = useState<any[]>([]);
  const [globalHistoryLoading, setGlobalHistoryLoading] = useState(true);
  const [selectedFuel, setSelectedFuel] = useState<string>('All');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('30');
  const [chartType, setChartType] = useState<string>('bar');

  useEffect(() => {
    const unsubscribeGlobalHistory = onSnapshot(
      query(
        collection(db, 'price_history'),
        orderBy('timestamp', 'asc')
      ),
      (snapshot) => {
        const historyData = snapshot.docs.map(doc => doc.data());
        
        const groupedData: Record<string, any> = {};
        
        historyData.forEach((entry: any) => {
          if (!entry.timestamp) return;
          const date = entry.timestamp.toDate().toLocaleDateString();
          if (!groupedData[date]) {
            groupedData[date] = { date, sumPetrol: 0, countPetrol: 0, sumDiesel: 0, countDiesel: 0, sumKerosene: 0, countKerosene: 0 };
          }
          if (entry.fuelType === 'Petrol') {
            groupedData[date].sumPetrol += entry.price;
            groupedData[date].countPetrol += 1;
          } else if (entry.fuelType === 'Diesel') {
            groupedData[date].sumDiesel += entry.price;
            groupedData[date].countDiesel += 1;
          } else if (entry.fuelType === 'Kerosene') {
            groupedData[date].sumKerosene += entry.price;
            groupedData[date].countKerosene += 1;
          }
        });

        
        // Always generate dummy data for the last 365 days for demonstration purposes
        const dummyData = [];
        const basePetrol = 30000;
        const baseDiesel = 28500;
        const baseKerosene = 24000;
        
        for (let i = 365; i >= 0; i--) {
          const dateObj = new Date();
          dateObj.setDate(dateObj.getDate() - i);
          const dateStr = dateObj.toLocaleDateString();
          
          // Add some semi-realistic fluctuations
          const trend = Math.sin(i / 10) * 1000 + (365 - i) * 10;
          const noise1 = (Math.random() - 0.5) * 500;
          const noise2 = (Math.random() - 0.5) * 600;
          const noise3 = (Math.random() - 0.5) * 400;
          
          // If we have real data for this date, use it; otherwise use dummy data
          if (groupedData[dateStr]) {
            const d = groupedData[dateStr];
            dummyData.push({
              date: dateStr,
              Petrol: d.countPetrol ? Math.round(d.sumPetrol / d.countPetrol) : Math.round(basePetrol + trend + noise1),
              Diesel: d.countDiesel ? Math.round(d.sumDiesel / d.countDiesel) : Math.round(baseDiesel + trend + noise2),
              Kerosene: d.countKerosene ? Math.round(d.sumKerosene / d.countKerosene) : Math.round(baseKerosene + trend * 0.8 + noise3),
            });
          } else {
            dummyData.push({
              date: dateStr,
              Petrol: Math.round(basePetrol + trend + noise1),
              Diesel: Math.round(baseDiesel + trend + noise2),
              Kerosene: Math.round(baseKerosene + trend * 0.8 + noise3),
            });
          }
        }
        setGlobalPriceHistory(dummyData);
        
        setGlobalHistoryLoading(false);
      },
      (error) => {
        setGlobalHistoryLoading(false);
        console.error("Error fetching global price history:", error);
      }
    );

    return () => {
      unsubscribeGlobalHistory();
    };
  }, []);

  const filteredData = useMemo(() => {
    if (!globalPriceHistory.length) return [];
    if (selectedTimeframe === 'all') return globalPriceHistory;
    
    const days = parseInt(selectedTimeframe, 10);
    return globalPriceHistory.slice(-days);
  }, [globalPriceHistory, selectedTimeframe]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-surface-900 mb-2 tracking-tight">Price Trends</h1>
        <p className="text-gray-500 font-medium">Historical average fuel prices across all monitored stations in Sierra Leone</p>
      </div>

      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-gray-100 overflow-hidden">
        <div className="p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-surface-900 flex items-center gap-2">
                <Activity className="w-6 h-6 text-primary" />
                National Average Price Trends
              </h2>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <select
                  value={chartType}
                  onChange={(e) => setChartType(e.target.value)}
                  className="appearance-none bg-white border border-gray-200 text-gray-700 py-2 pl-4 pr-10 rounded-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary hover:border-primary/50 transition-all cursor-pointer"
                >
                  <option value="line">Line Chart</option>
                  <option value="bar">Bar Chart</option>
                  <option value="table">Table View</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                  <ChevronDown className="h-4 w-4" />
                </div>
              </div>

              <div className="relative">
                <select
                  value={selectedTimeframe}
                  onChange={(e) => setSelectedTimeframe(e.target.value)}
                  className="appearance-none bg-white border border-gray-200 text-gray-700 py-2 pl-4 pr-10 rounded-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary hover:border-primary/50 transition-all cursor-pointer"
                >
                  <option value="30">1 Month</option>
                  <option value="90">3 Months</option>
                  <option value="180">6 Months</option>
                  <option value="365">1 Year</option>
                  <option value="all">All Time</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                  <ChevronDown className="h-4 w-4" />
                </div>
              </div>

              <div className="relative">
                <select
                  value={selectedFuel}
                  onChange={(e) => setSelectedFuel(e.target.value)}
                  className="appearance-none bg-white border border-gray-200 text-gray-700 py-2 pl-4 pr-10 rounded-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary hover:border-primary/50 transition-all cursor-pointer"
                >
                  <option value="All">All Fuels</option>
                  <option value="Petrol">Petrol Only</option>
                  <option value="Diesel">Diesel Only</option>
                  <option value="Kerosene">Kerosene Only</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                  <ChevronDown className="h-4 w-4" />
                </div>
              </div>
            </div>
          </div>
          
          <div className="h-96 w-full mt-8">
            {globalHistoryLoading ? (
              <div className="flex flex-col justify-center items-center h-full gap-3">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary/20 border-t-primary"></div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading Trends...</p>
              </div>
            ) : filteredData.length > 0 ? (
              <>
                {chartType === 'line' && (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={filteredData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 700 }}
                        dy={10}
                        minTickGap={30}
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 700 }}
                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                        dx={-10}
                        domain={[0, 36000]}
                        tickCount={5}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          borderRadius: '16px', 
                          border: 'none', 
                          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                          padding: '12px'
                        }}
                        itemStyle={{ fontSize: '12px', fontWeight: 700, padding: '2px 0' }}
                        labelStyle={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: '#9CA3AF', marginBottom: '8px' }}
                        formatter={(value: number) => [`${value.toLocaleString()} SLL`, '']}
                      />
                      <Legend 
                        verticalAlign="top" 
                        align="right" 
                        iconType="circle"
                        wrapperStyle={{ paddingBottom: '20px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}
                      />
                      {(selectedFuel === 'All' || selectedFuel === 'Diesel') && (
                        <Line name="Diesel" type="monotone" dataKey="Diesel" stroke="var(--color-surface-900)" strokeWidth={4} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
                      )}
                      {(selectedFuel === 'All' || selectedFuel === 'Kerosene') && (
                        <Line name="Kerosene" type="monotone" dataKey="Kerosene" stroke="#D946EF" strokeWidth={4} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
                      )}
                      {(selectedFuel === 'All' || selectedFuel === 'Petrol') && (
                        <Line name="Petrol" type="monotone" dataKey="Petrol" stroke="var(--color-primary)" strokeWidth={4} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                )}
                {chartType === 'bar' && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={filteredData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 700 }} dy={10} minTickGap={30} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 700 }} tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} dx={-10} domain={[0, 36000]} tickCount={5} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', padding: '12px' }}
                        itemStyle={{ fontSize: '12px', fontWeight: 700, padding: '2px 0' }}
                        labelStyle={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: '#9CA3AF', marginBottom: '8px' }}
                        formatter={(value: number) => [`${value.toLocaleString()} SLL`, '']}
                      />
                      <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                      {(selectedFuel === 'All' || selectedFuel === 'Diesel') && (
                        <Bar name="Diesel" dataKey="Diesel" fill="var(--color-surface-900)" radius={[4, 4, 0, 0]} maxBarSize={6} />
                      )}
                      {(selectedFuel === 'All' || selectedFuel === 'Kerosene') && (
                        <Bar name="Kerosene" dataKey="Kerosene" fill="#D946EF" radius={[4, 4, 0, 0]} maxBarSize={6} />
                      )}
                      {(selectedFuel === 'All' || selectedFuel === 'Petrol') && (
                        <Bar name="Petrol" dataKey="Petrol" fill="var(--color-primary)" radius={[4, 4, 0, 0]} maxBarSize={6} />
                      )}
                    </BarChart>
                  </ResponsiveContainer>
                )}
                {chartType === 'table' && (
                  <div className="overflow-auto w-full h-full border border-gray-100 rounded-2xl">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                          {(selectedFuel === 'All' || selectedFuel === 'Petrol') && (
                            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Petrol (SLL)</th>
                          )}
                          {(selectedFuel === 'All' || selectedFuel === 'Diesel') && (
                            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Diesel (SLL)</th>
                          )}
                          {(selectedFuel === 'All' || selectedFuel === 'Kerosene') && (
                            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Kerosene (SLL)</th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredData.slice().reverse().map((row, idx) => (
                          <tr key={idx} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.date}</td>
                            {(selectedFuel === 'All' || selectedFuel === 'Petrol') && (
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.Petrol?.toLocaleString() || '-'}</td>
                            )}
                            {(selectedFuel === 'All' || selectedFuel === 'Diesel') && (
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.Diesel?.toLocaleString() || '-'}</td>
                            )}
                            {(selectedFuel === 'All' || selectedFuel === 'Kerosene') && (
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.Kerosene?.toLocaleString() || '-'}</td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col justify-center items-center h-full text-gray-400 gap-2">
                <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mb-2">
                  <History className="w-6 h-6 text-gray-200" />
                </div>
                <p className="text-sm font-bold">No historical data available</p>
                <p className="text-xs font-medium opacity-60">Trends will appear as prices are recorded over time</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
