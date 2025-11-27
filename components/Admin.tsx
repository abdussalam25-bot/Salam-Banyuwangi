import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db, formatFirebaseDate } from '../services/firebase';
import { AttendanceRecord } from '../types';
import { Button } from './Button';
import { Card } from './Card';
import { CSVLink } from 'react-csv';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Download, Search, Filter } from 'lucide-react';

export const Admin: React.FC = () => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      // Query records within date range (inclusive)
      const q = query(
        collection(db, 'attendance'),
        where('dateStr', '>=', dateRange.start),
        where('dateStr', '<=', dateRange.end),
        orderBy('dateStr', 'desc'),
        orderBy('createdAt', 'desc')
      );
      
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as AttendanceRecord));
      setRecords(data);
    } catch (e) {
      console.error("Fetch failed", e);
      alert("Gagal memuat data. Pastikan index Firestore sudah dibuat jika menggunakan filter kompleks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => {
    const counts = { Hadir: 0, Terlambat: 0, Izin: 0, WFH: 0, DinasLuar: 0 };
    records.forEach(r => {
      if (r.status === 'Dinas Luar') counts.DinasLuar++;
      else if (counts[r.status as keyof typeof counts] !== undefined) {
        counts[r.status as keyof typeof counts]++;
      }
    });
    return [
      { name: 'Hadir', value: counts.Hadir, color: '#22c55e' },
      { name: 'Terlambat', value: counts.Terlambat, color: '#eab308' },
      { name: 'Izin', value: counts.Izin, color: '#3b82f6' },
      { name: 'WFH', value: counts.WFH, color: '#8b5cf6' },
      { name: 'Dinas', value: counts.DinasLuar, color: '#f97316' },
    ];
  }, [records]);

  const csvData = records.map(r => ({
    Nama: r.name,
    Email: r.email,
    Status: r.status,
    Tanggal: r.dateStr,
    Waktu: formatFirebaseDate(r.createdAt),
    Latitude: r.location?.lat || '',
    Longitude: r.location?.lng || ''
  }));

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col md:flex-row gap-4 items-end md:items-center justify-between mb-6">
          <div className="w-full md:w-auto">
            <h2 className="text-xl font-bold text-gray-800">Admin Dashboard</h2>
            <p className="text-sm text-gray-500">Rekapitulasi data absensi pegawai</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
             <div className="flex items-center gap-2 bg-gray-50 p-1 rounded border">
                <input 
                  type="date" 
                  className="bg-transparent text-sm border-none focus:ring-0 p-1"
                  value={dateRange.start}
                  onChange={e => setDateRange(p => ({ ...p, start: e.target.value }))}
                />
                <span className="text-gray-400">-</span>
                <input 
                  type="date" 
                  className="bg-transparent text-sm border-none focus:ring-0 p-1"
                  value={dateRange.end}
                  onChange={e => setDateRange(p => ({ ...p, end: e.target.value }))}
                />
             </div>
             <Button onClick={fetchData} isLoading={loading} className="px-3">
               <Search className="h-4 w-4" />
             </Button>
             <CSVLink 
               data={csvData} 
               filename={`absensi_${dateRange.start}_${dateRange.end}.csv`}
               className="inline-flex"
             >
               <Button variant="outline" className="px-3">
                 <Download className="h-4 w-4 mr-2" /> CSV
               </Button>
             </CSVLink>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
           <div className="lg:col-span-1 bg-gray-50 rounded-xl p-4 border border-gray-100 flex flex-col justify-center">
              <h4 className="text-sm font-semibold text-gray-500 mb-4 text-center">Statistik Periode Ini</h4>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{fontSize: 10}} />
                    <YAxis allowDecimals={false} />
                    <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '8px'}} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {stats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
           </div>

           <div className="lg:col-span-2 overflow-hidden rounded-xl border border-gray-200">
             <div className="overflow-x-auto h-80">
                <table className="w-full text-sm text-left text-gray-600">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-100 sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3">Nama</th>
                      <th className="px-4 py-3">Tanggal</th>
                      <th className="px-4 py-3">Waktu</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">GPS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.length === 0 ? (
                      <tr><td colSpan={5} className="text-center py-10">Tidak ada data.</td></tr>
                    ) : (
                      records.map(r => (
                        <tr key={r.id} className="bg-white border-b hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">{r.name}</td>
                          <td className="px-4 py-3">{r.dateStr}</td>
                          <td className="px-4 py-3">{formatFirebaseDate(r.createdAt).split(' ')[3] || formatFirebaseDate(r.createdAt)}</td>
                          <td className="px-4 py-3">
                             <span className={`px-2 py-0.5 rounded text-xs border ${
                               r.status === 'Hadir' ? 'bg-green-50 border-green-200 text-green-700' :
                               r.status === 'Terlambat' ? 'bg-yellow-50 border-yellow-200 text-yellow-700' :
                               'bg-blue-50 border-blue-200 text-blue-700'
                             }`}>
                               {r.status}
                             </span>
                          </td>
                          <td className="px-4 py-3 text-xs font-mono">
                            {r.location ? (
                                <a 
                                  href={`https://www.google.com/maps?q=${r.location.lat},${r.location.lng}`} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="text-brand-600 hover:underline"
                                >
                                  Map
                                </a>
                            ) : '-'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
             </div>
           </div>
        </div>
      </Card>
    </div>
  );
};