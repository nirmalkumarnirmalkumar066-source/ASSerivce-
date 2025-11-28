import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User as UserIcon, Briefcase } from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navbar */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-slate-200 sticky top-0 z-50 supports-[backdrop-filter]:bg-white/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* BRANDING */}
            <div className="flex items-center gap-3 select-none group">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-tr from-blue-400 via-indigo-500 to-purple-500 rounded-full blur opacity-40 group-hover:opacity-60 transition duration-500"></div>
                <div className="relative flex items-center justify-center h-10 w-10 bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl shadow-inner ring-1 ring-white/20">
                  <Briefcase className="h-5 w-5 text-blue-400" strokeWidth={2.5} />
                </div>
              </div>
              <div className="flex flex-col">
                <h1 className="text-xl font-black tracking-tighter text-slate-900 leading-none flex items-center gap-1">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-700">A.S.</span>
                  <span className="text-slate-800">Service</span>
                </h1>
                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 mt-0.5">
                  Supply Service
                </span>
              </div>
            </div>
            
            {user && (
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-sm font-medium text-slate-900">{user.name}</span>
                  <span className="text-xs text-slate-500 capitalize">{user.role === 'admin' ? 'Manager' : 'Employee'}</span>
                </div>
                <div className="h-9 w-9 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border border-slate-300 ring-2 ring-white shadow-sm">
                   {user.avatar ? <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" /> : <UserIcon className="h-5 w-5 text-slate-500" />}
                </div>
                <button 
                  onClick={logout}
                  className="p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-red-600 transition-colors"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};