import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy, where } from 'firebase/firestore';
import { db } from '../firebase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { History } from 'lucide-react';

interface StationComparisonChartProps {
  stationId: string;
  stationName: string;
}

export default function StationComparisonChart({ stationId, stationName }: StationComparisonChartProps) {
  const [priceHistory, setPriceHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsubscribeHistory = onSnapshot(
      query(
        collection(db, 'price_history'),
        where('stationId', '==', stationId),
        orderBy('timestamp', 'asc')
      ),
      (snapshot) => {
        const historyData = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Group by date to format for chart
        const groupedData: Record<string, any> = {};
        
        historyData.forEach((entry: any) => {
          if (!entry.timestamp || typeof entry.timestamp.toDate !== 'function') return;
          const dateStr = entry.timestamp.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          if (!groupedData[dateStr]) {
            groupedData[dateStr] = { date: dateStr, timestamp: entry.timestamp.toDate().getTime() };
          }
          if (entry.fuelType) {
            groupedData[dateStr][entry.fuelType] = entry.price;
          }
        });

        const sortedData = Object.values(groupedData).sort((a: any, b: any) => a.timestamp - b.timestamp);
        
        setPriceHistory(sortedData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching price history:", error);
        setLoading(false);
      }
    );

    return () => unsubscribeHistory();
  }, [stationId]);

  if (loading) {
    return (
      <div className="h-48 flex items-center justify-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
        <p className="text-sm font-bold text-gray-500 animate-pulse">Loading history...</p>
      </div>
    );
  }

  if (priceHistory.length === 0) {
    return (
      <div className="h-48 flex flex-col items-center justify-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
        <History className="w-6 h-6 text-gray-300 mb-2" />
        <p className="text-sm font-bold text-gray-500">No price history available</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex-1">
      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">{stationName} History</h4>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={priceHistory} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
            <XAxis 
              dataKey="date" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 700 }}
              dy={10}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 700 }}
              tickFormatter={(value) => value >= 1000 ? `Le ${(value / 1000).toFixed(0)}k` : `NLe ${value.toFixed(0)}`}
              dx={-10}
            />
            <Tooltip 
              contentStyle={{ 
                borderRadius: '16px', 
                border: 'none', 
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                padding: '12px'
              }}
              itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
              labelStyle={{ fontSize: '10px', color: '#9CA3AF', fontWeight: 'bold', marginBottom: '4px', textTransform: 'uppercase' }}
            />
            <Line name="Petrol" type="monotone" dataKey="Petrol" stroke="var(--color-primary)" strokeWidth={3} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
            <Line name="Diesel" type="monotone" dataKey="Diesel" stroke="#1F2937" strokeWidth={3} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
            <Line name="Kerosene" type="monotone" dataKey="Kerosene" stroke="#2563EB" strokeWidth={3} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
