import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './services/firebase';
import { Auth } from './components/Auth';
import { Attendance } from './components/Attendance';
import { Admin } from './components/Admin';
import { UserProfile } from './types';
import { LogOut, User as UserIcon } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'attendance' | 'admin'>('attendance');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const docRef = doc(db, 'users', u.uid);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            setProfile({ uid: u.uid, ...snap.data() } as UserProfile);
          } else {
            // Fallback profile if Firestore doc missing
            setProfile({ uid: u.uid, email: u.email!, name: u.email!, role: 'teacher' });
          }
        } catch (e) {
          console.error("Profile fetch error", e);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  if (!user || !profile) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-brand-600 p-1.5 rounded-lg">
               <span className="text-white font-bold text-lg leading-none">GM</span>
            </div>
            <h1 className="text-xl font-bold text-gray-800 hidden md:block">SMK Gajah Mada</h1>
          </div>

          <div className="flex items-center gap-4">
             {profile.role === 'admin' && (
               <div className="flex bg-gray-100 p-1 rounded-lg">
                 <button 
                   onClick={() => setView('attendance')}
                   className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${view === 'attendance' ? 'bg-white shadow text-brand-700' : 'text-gray-500 hover:text-gray-700'}`}
                 >
                   Absen
                 </button>
                 <button 
                   onClick={() => setView('admin')}
                   className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${view === 'admin' ? 'bg-white shadow text-brand-700' : 'text-gray-500 hover:text-gray-700'}`}
                 >
                   Admin
                 </button>
               </div>
             )}

            <div className="flex items-center gap-3 pl-4 border-l">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{profile.name}</p>
                <p className="text-xs text-gray-500 capitalize">{profile.role}</p>
              </div>
              <div className="h-8 w-8 bg-brand-100 rounded-full flex items-center justify-center text-brand-700">
                <UserIcon className="h-4 w-4" />
              </div>
              <button 
                onClick={() => signOut(auth)}
                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {view === 'admin' && profile.role === 'admin' ? (
          <Admin />
        ) : (
          <div className="max-w-4xl mx-auto">
             <Attendance user={user} profile={profile} />
          </div>
        )}
      </main>

      <footer className="bg-white border-t mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-4 text-center text-gray-400 text-sm">
          &copy; {new Date().getFullYear()} SMK Gajah Mada Banyuwangi. All rights reserved.
        </div>
      </footer>
    </div>
  );
}