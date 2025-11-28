import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Button } from '../components/Button';
import { ShieldCheck, HardHat, Eye, EyeOff, Briefcase, UserPlus, LogIn } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const { addUser, joinCode } = useData();
  
  const [view, setView] = useState<'login' | 'register'>('login');
  const [role, setRole] = useState<'admin' | 'worker'>('worker');
  
  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Register State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regCode, setRegCode] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleRoleSwitch = (r: 'admin' | 'worker') => {
    setRole(r);
    const demoEmail = r === 'admin' ? 'admin@as.service' : 'john@worker.com';
    setEmail(demoEmail);
    setPassword(r === 'admin' ? 'password' : demoEmail);
    setError('');
    setSuccessMsg('');
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      await login(email, password, role);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Invalid credentials. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    // Simulate Network Delay
    await new Promise(resolve => setTimeout(resolve, 600));

    if (regCode.toUpperCase() !== joinCode.toUpperCase()) {
        setError("Invalid Join Code. Please ask your manager for the correct code.");
        setLoading(false);
        return;
    }

    // Create User
    addUser({
        name: regName,
        email: regEmail,
        role: 'worker', // Only workers can self-register
        phone: regPhone,
        address: regAddress,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(regName)}&background=random`
    });

    setSuccessMsg("Registration successful! You can now login.");
    setView('login');
    setRole('worker');
    setEmail(regEmail);
    setPassword(regEmail);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-8">
      <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
        
        {/* LOGO SECTION */}
        <div className="flex flex-col items-center justify-center text-center pb-2">
             <div className="relative group mb-5">
                <div className="absolute -inset-2 bg-gradient-to-tr from-blue-400 via-indigo-500 to-purple-500 rounded-full blur opacity-30 group-hover:opacity-50 transition duration-500"></div>
                <div className="relative flex items-center justify-center h-16 w-16 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-xl border border-white/10">
                  <Briefcase className="h-8 w-8 text-blue-400" strokeWidth={2} />
                </div>
              </div>
              <h1 className="text-3xl font-black tracking-tighter text-slate-900">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-700">A.S.</span>
                  <span className="text-slate-800">Service</span>
              </h1>
              <p className="mt-2 text-xs font-bold text-indigo-500 uppercase tracking-[0.2em]">Supply Service</p>
        </div>

        {/* VIEW TABS */}
        <div className="flex border-b border-slate-200">
            <button 
                onClick={() => { setView('login'); setError(''); }}
                className={`flex-1 pb-3 text-sm font-medium text-center transition-colors relative ${view === 'login' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
                Login
                {view === 'login' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full"></span>}
            </button>
            <button 
                onClick={() => { setView('register'); setError(''); }}
                className={`flex-1 pb-3 text-sm font-medium text-center transition-colors relative ${view === 'register' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
                Join Team (Register)
                {view === 'register' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full"></span>}
            </button>
        </div>

        {view === 'login' && (
            <>
                {/* Role Toggle */}
                <div className="grid grid-cols-2 gap-4 p-1 bg-slate-100 rounded-xl">
                <button
                    onClick={() => handleRoleSwitch('admin')}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    role === 'admin' ? 'bg-white text-blue-700 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    <ShieldCheck size={18} />
                    Major Login
                </button>
                <button
                    onClick={() => handleRoleSwitch('worker')}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    role === 'worker' ? 'bg-white text-blue-700 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    <HardHat size={18} />
                    Work Login
                </button>
                </div>

                <form className="space-y-6 mt-4" onSubmit={handleLoginSubmit}>
                    {successMsg && <div className="p-3 bg-green-50 text-green-700 text-sm rounded-lg border border-green-100">{successMsg}</div>}
                    <div className="space-y-4">
                        <div>
                        <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                        <input
                            id="email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="appearance-none block w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
                            placeholder="name@example.com"
                        />
                        </div>
                        
                        <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                        <div className="relative">
                            <input
                            type={showPassword ? "text" : "password"}
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder={role === 'worker' ? "Use email as password" : "Enter password"}
                            className="appearance-none block w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
                            />
                            <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                            >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {role === 'worker' && <p className="mt-1.5 text-xs text-slate-500 flex items-center gap-1">ℹ️ Your password is your email address.</p>}
                        </div>
                    </div>

                    {error && <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg border border-red-100 font-medium">{error}</div>}

                    <Button type="submit" className="w-full justify-center py-3 text-base shadow-lg shadow-blue-200" loading={loading} size="lg">
                        <LogIn className="w-5 h-5 mr-2" />
                        {role === 'admin' ? 'Login as Manager' : 'Login to Work'}
                    </Button>
                </form>
            </>
        )}

        {view === 'register' && (
            <form className="space-y-4 mt-4" onSubmit={handleRegisterSubmit}>
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <label className="block text-sm font-bold text-blue-900 mb-1">Team Join Code</label>
                    <input
                        type="text"
                        required
                        value={regCode}
                        onChange={(e) => setRegCode(e.target.value)}
                        className="block w-full px-4 py-2 border border-blue-200 rounded-lg text-center font-mono text-lg tracking-widest uppercase placeholder-blue-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="ENTER CODE"
                    />
                    <p className="text-xs text-blue-600 mt-2 text-center">Ask your manager for the Join Code.</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                    <input required type="text" value={regName} onChange={(e) => setRegName(e.target.value)} className="w-full px-4 py-2.5 border border-slate-300 rounded-xl" placeholder="John Doe" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                    <input required type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} className="w-full px-4 py-2.5 border border-slate-300 rounded-xl" placeholder="john@example.com" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                    <input required type="tel" value={regPhone} onChange={(e) => setRegPhone(e.target.value)} className="w-full px-4 py-2.5 border border-slate-300 rounded-xl" placeholder="555-0123" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Home Address</label>
                    <input required type="text" value={regAddress} onChange={(e) => setRegAddress(e.target.value)} className="w-full px-4 py-2.5 border border-slate-300 rounded-xl" placeholder="123 Main St" />
                </div>

                {error && <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg border border-red-100 font-medium">{error}</div>}

                <Button type="submit" className="w-full justify-center py-3 text-base" loading={loading} size="lg">
                    <UserPlus className="w-5 h-5 mr-2" />
                    Register & Join
                </Button>
            </form>
        )}

      </div>
    </div>
  );
};