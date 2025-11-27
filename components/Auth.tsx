import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from 'firebase/auth';
import { setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { Button } from './Button';
import { UserRole } from '../types';
import { User, Lock, Mail, Building } from 'lucide-react';

export const Auth: React.FC = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('teacher');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isRegister) {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', cred.user.uid), {
          name,
          email,
          role,
          createdAt: serverTimestamp(),
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-brand-600 p-8 text-center">
          <div className="mx-auto h-16 w-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-lg">
            <Building className="h-8 w-8 text-brand-600" />
          </div>
          <h2 className="text-2xl font-bold text-white">SMK Gajah Mada</h2>
          <p className="text-brand-100 mt-2">Sistem Absensi Terpadu</p>
        </div>

        <div className="p-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-6 text-center">
            {isRegister ? 'Buat Akun Baru' : 'Masuk ke Sistem'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Nama Lengkap"
                  className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}
            
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="email"
                placeholder="Alamat Email"
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="password"
                placeholder="Kata Sandi"
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {isRegister && (
              <div className="relative">
                <select
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none bg-white"
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                >
                  <option value="teacher">Guru / Karyawan</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
                <span className="font-bold">Error:</span> {error}
              </div>
            )}

            <Button type="submit" className="w-full py-3 text-lg" isLoading={loading}>
              {isRegister ? 'Daftar Sekarang' : 'Masuk'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button 
              onClick={() => setIsRegister(!isRegister)}
              className="text-brand-600 hover:text-brand-700 font-medium text-sm hover:underline"
            >
              {isRegister 
                ? 'Sudah punya akun? Login disini' 
                : 'Belum punya akun? Daftar disini'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};