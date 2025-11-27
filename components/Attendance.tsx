import React, { useState, useEffect } from 'react';
import { addDoc, collection, serverTimestamp, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import { db, formatFirebaseDate } from '../services/firebase';
import { UserProfile, AttendanceStatus, AttendanceRecord } from '../types';
import { Button } from './Button';
import { Card } from './Card';
import { MapPin, CheckCircle, Clock, Calendar, AlertTriangle, Briefcase, Home } from 'lucide-react';

interface AttendanceProps {
  user: any;
  profile: UserProfile;
}

const LATE_THRESHOLD_HOUR = 7;
const LATE_THRESHOLD_MINUTE = 30;

export const Attendance: React.FC<AttendanceProps> = ({ user, profile }) => {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    fetchHistory();
  }, [user.uid]);

  const fetchHistory = async () => {
    try {
      const q = query(
        collection(db, 'attendance'),
        where('uid', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as AttendanceRecord));
      setHistory(data);
    } catch (e) {
      console.error("Fetch history failed", e);
    }
  };

  const getGeolocation = (): Promise<{ lat: number; lng: number } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) resolve(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => {
          console.error(err);
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    });
  };

  const handleCheckIn = async (statusOverride?: AttendanceStatus) => {
    setLoading(true);
    setMsg(null);

    try {
      const loc = await getGeolocation();
      
      let status: AttendanceStatus = 'Hadir';
      const now = new Date();
      
      if (statusOverride) {
        status = statusOverride;
      } else {
        // Auto logic
        if (now.getHours() > LATE_THRESHOLD_HOUR || 
           (now.getHours() === LATE_THRESHOLD_HOUR && now.getMinutes() >= LATE_THRESHOLD_MINUTE)) {
          status = 'Terlambat';
        }
      }

      const todayStr = now.toISOString().split('T')[0];

      await addDoc(collection(db, 'attendance'), {
        uid: user.uid,
        name: profile.name || user.email,
        email: user.email,
        status,
        manualStatus: !!statusOverride,
        location: loc,
        createdAt: serverTimestamp(),
        dateStr: todayStr,
      });

      setMsg({ type: 'success', text: `Berhasil absen: ${status}` });
      fetchHistory(); // refresh list
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message || 'Gagal melakukan absensi' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card title="Absensi Hari Ini" className="border-t-4 border-t-brand-500">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <h4 className="font-medium text-blue-900 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Waktu Sekarang
              </h4>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </p>
              <p className="text-sm text-blue-700 mt-1">
                {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>

            {msg && (
              <div className={`p-4 rounded-lg flex items-center gap-2 ${msg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {msg.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                {msg.text}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 justify-center">
            <Button onClick={() => handleCheckIn()} isLoading={loading} className="h-12 text-lg w-full">
              <MapPin className="h-5 w-5" /> Check In (Hadir)
            </Button>
            <div className="grid grid-cols-3 gap-2">
              <Button onClick={() => handleCheckIn('Izin')} variant="secondary" isLoading={loading} className="text-xs sm:text-sm">
                <Calendar className="h-4 w-4" /> Izin
              </Button>
              <Button onClick={() => handleCheckIn('WFH')} variant="secondary" isLoading={loading} className="text-xs sm:text-sm">
                <Home className="h-4 w-4" /> WFH
              </Button>
              <Button onClick={() => handleCheckIn('Dinas Luar')} variant="secondary" isLoading={loading} className="text-xs sm:text-sm">
                <Briefcase className="h-4 w-4" /> Dinas
              </Button>
            </div>
            <p className="text-xs text-gray-400 text-center mt-2">
              *Lokasi GPS akan dicatat otomatis saat Anda menekan tombol.
            </p>
          </div>
        </div>
      </Card>

      <Card title="Riwayat Absensi Terakhir">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50">
              <tr>
                <th className="px-4 py-3">Waktu</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Lokasi</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-gray-500">Belum ada data absensi.</td>
                </tr>
              ) : (
                history.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {formatFirebaseDate(item.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold
                        ${item.status === 'Hadir' ? 'bg-green-100 text-green-700' : 
                          item.status === 'Terlambat' ? 'bg-yellow-100 text-yellow-700' : 
                          'bg-blue-100 text-blue-700'}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {item.location ? `${item.location.lat.toFixed(4)}, ${item.location.lng.toFixed(4)}` : 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};