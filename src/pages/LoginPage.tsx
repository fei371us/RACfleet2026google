import { useState, FormEvent } from 'react';
import { motion } from 'motion/react';
import { Shield, Lock, User, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(username, password);
      navigate('/');
    } catch {
      setError('Authorization Failed. Invalid Credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-surface-container-low flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-[420px] bg-surface-container-lowest rounded-[3rem] p-12 kinetic-shadow relative overflow-hidden"
      >
        {/* Aesthetic accents */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-8 shadow-inner">
            <Shield size={32} />
          </div>
          
          <h1 className="text-4xl font-black tracking-tight font-headline text-on-surface mb-2 uppercase underline decoration-primary/30 decoration-8 underline-offset-[-2px]">Gatekeeper</h1>
          <p className="text-on-surface-variant font-medium text-sm mb-10 italic">Secure Uplink Required. Enter personnel credentials to access the fleet network.</p>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-outline ml-4">Personnel ID</label>
              <div className="relative">
                <User size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-outline" />
                <input 
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Username"
                  className="w-full bg-surface-container-highest border-none rounded-[1.5rem] pl-14 pr-6 py-5 font-bold placeholder:text-outline/40 focus:ring-2 ring-primary/20 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-outline ml-4">Access Key</label>
              <div className="relative">
                <Lock size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-outline" />
                <input 
                  required
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-surface-container-highest border-none rounded-[1.5rem] pl-14 pr-6 py-5 font-bold placeholder:text-outline/40 focus:ring-2 ring-primary/20 transition-all"
                />
              </div>
            </div>

            {error && (
               <motion.div 
                 initial={{ opacity: 0, x: -10 }}
                 animate={{ opacity: 1, x: 0 }}
                 className="flex items-center gap-3 p-4 bg-error/10 border border-error/20 rounded-2xl text-error text-[10px] font-black uppercase tracking-widest"
               >
                 <AlertCircle size={14} />
                 {error}
               </motion.div>
            )}

            <button 
              disabled={loading}
              className="w-full gradient-btn py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-primary/20 mt-4 flex items-center justify-center gap-3 active:scale-95 transition-all group disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  Establish Connection
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="mt-12 text-center text-[9px] font-black uppercase tracking-[0.3em] text-outline/30">
            Encrypted by FleetHQ Security Protocol v4.2
          </p>
        </div>
      </motion.div>
    </div>
  );
}
