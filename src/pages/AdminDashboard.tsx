import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, UserPlus, Trash2, Key, User, CarFront, Pencil, X } from 'lucide-react';
import { User as UserType, UserRole, Vehicle } from '../types';
import { cn } from '../lib/utils';
import { api } from '../lib/api';

export default function AdminDashboard() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [vehicleSaving, setVehicleSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [vehicleForm, setVehicleForm] = useState({
    id: '',
    name: '',
    plate: '',
    status: 'active',
  });
  const [vehicleError, setVehicleError] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    role: UserRole.REQUESTER
  });

  useEffect(() => {
    api.get<UserType[]>('/api/users')
      .then(data => {
        setUsers(data);
        setLoading(false);
      });
    api.get<Vehicle[]>('/api/vehicles')
      .then(data => {
        setVehicles(data);
        setVehiclesLoading(false);
      });
  }, []);

  const resetVehicleForm = () => {
    setVehicleForm({ id: '', name: '', plate: '', status: 'active' });
    setVehicleError('');
  };

  const handleSaveVehicle = async (e: FormEvent) => {
    e.preventDefault();
    if (!vehicleForm.name.trim() || !vehicleForm.plate.trim()) {
      setVehicleError('Vehicle name and vehicle no are required.');
      return;
    }
    try {
      setVehicleSaving(true);
      setVehicleError('');
      if (vehicleForm.id) {
        const updated = await api.patch<Vehicle>(`/api/vehicles/${vehicleForm.id}`, {
          name: vehicleForm.name.trim(),
          plate: vehicleForm.plate.trim(),
          status: vehicleForm.status,
        });
        setVehicles(prev => prev.map(v => v.id === updated.id ? updated : v));
      } else {
        const created = await api.post<Vehicle>('/api/vehicles', {
          name: vehicleForm.name.trim(),
          plate: vehicleForm.plate.trim(),
          status: vehicleForm.status,
        });
        setVehicles(prev => [...prev, created]);
      }
      resetVehicleForm();
    } catch (error) {
      setVehicleError(error instanceof Error ? error.message : 'Failed to save vehicle');
    } finally {
      setVehicleSaving(false);
    }
  };

  const handleEditVehicle = (v: Vehicle) => {
    setVehicleForm({
      id: v.id,
      name: v.name ?? '',
      plate: v.plate ?? '',
      status: v.status ?? 'active',
    });
    setVehicleError('');
  };

  const handleDeleteVehicle = async (id: string) => {
    if (!confirm('Delete this vehicle number from master table?')) return;
    try {
      await api.delete(`/api/vehicles/${id}`);
      setVehicles(prev => prev.filter(v => v.id !== id));
      if (vehicleForm.id === id) resetVehicleForm();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete vehicle');
    }
  };

  const handleCreateUser = async (e: FormEvent) => {
    e.preventDefault();
    const newUser = {
      id: `U-${Math.floor(Math.random() * 10000)}`,
      ...formData
    };

    try {
      await api.post('/api/users', newUser);
      setUsers([...users, { ...newUser, created_at: new Date().toISOString() }]);
      setIsModalOpen(false);
      setFormData({ username: '', password: '', name: '', role: UserRole.REQUESTER });
    } catch (error) {
      console.error('Failed to create user:', error);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (confirm('Are you sure you want to delete this user? Access will be immediately revoked.')) {
      try {
        await api.delete(`/api/users/${id}`);
        setUsers(users.filter(u => u.id !== id));
      } catch (error) {
        console.error('Failed to delete user:', error);
      }
    }
  };

  const roleColors: Record<UserRole, string> = {
    [UserRole.ADMIN]: 'bg-error/10 text-error',
    [UserRole.FLEET_CONTROL]: 'bg-primary/10 text-primary',
    [UserRole.FLEET_CONTROL_SUPERVISOR]: 'bg-primary/20 text-primary font-black',
    [UserRole.WORKSHOP_ADVISER]: 'bg-secondary/10 text-secondary',
    [UserRole.REQUESTER]: 'bg-surface-container-highest text-on-surface-variant',
    [UserRole.DRIVER]: 'bg-green-500/10 text-green-600'
  };

  return (
    <div className="flex-1 pb-32">
      <header className="sticky top-0 z-50 glass-panel border-b border-outline-variant/10 px-6 py-4 flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-error/10 rounded-lg text-error">
            <Shield size={24} />
          </div>
          <h1 className="font-headline font-black text-lg tracking-tighter text-on-surface uppercase">Control Tier Alpha</h1>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="gradient-btn px-6 py-3 rounded-xl flex items-center gap-2 font-black text-[10px] uppercase tracking-widest"
        >
          <UserPlus size={16} />
          Provision User
        </button>
      </header>

      <main className="max-w-6xl mx-auto px-6">
        <section className="bg-surface-container-lowest rounded-[2.5rem] p-1 kinetic-shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-outline-variant/10">
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-outline">Identity</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-outline">Clearance Role</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-outline text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/5">
                {loading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={3} className="px-8 py-6 h-20 bg-surface-container-high/20" />
                    </tr>
                  ))
                ) : users.map(user => (
                  <tr key={user.id} className="group hover:bg-surface-bright transition-all">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-outline">
                          <User size={20} />
                        </div>
                        <div>
                          <p className="font-black text-sm text-on-surface uppercase tracking-tight">{user.name}</p>
                          <p className="text-[10px] font-bold text-outline uppercase">{user.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                       <span className={cn(
                         "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                         roleColors[user.role] || 'bg-surface-container-high text-on-surface'
                       )}>
                         {user.role.replace(/_/g, ' ')}
                       </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                       <div className="flex justify-end gap-2">
                         <button className="p-3 bg-surface-container-high rounded-xl text-outline hover:text-primary transition-colors">
                            <Key size={16} />
                         </button>
                         <button 
                           onClick={() => handleDeleteUser(user.id)}
                           className="p-3 bg-error/10 rounded-xl text-error hover:bg-error hover:text-white transition-all"
                         >
                            <Trash2 size={16} />
                         </button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-8 bg-surface-container-lowest rounded-[2.5rem] p-8 kinetic-shadow">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-headline font-black text-xl tracking-tight flex items-center gap-2">
              <CarFront size={20} className="text-primary" />
              Vehicle No Master
            </h2>
            {vehicleForm.id && (
              <button
                onClick={resetVehicleForm}
                className="text-xs font-black uppercase tracking-wider text-on-surface-variant hover:text-primary"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSaveVehicle} className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
            <input
              value={vehicleForm.name}
              onChange={(e) => setVehicleForm({ ...vehicleForm, name: e.target.value })}
              placeholder="Vehicle Name"
              className="bg-surface-container-highest rounded-xl px-4 py-3 text-sm font-bold border-none"
            />
            <input
              value={vehicleForm.plate}
              onChange={(e) => setVehicleForm({ ...vehicleForm, plate: e.target.value })}
              placeholder="Vehicle No / Plate"
              className="bg-surface-container-highest rounded-xl px-4 py-3 text-sm font-bold border-none"
            />
            <select
              value={vehicleForm.status}
              onChange={(e) => setVehicleForm({ ...vehicleForm, status: e.target.value })}
              className="bg-surface-container-highest rounded-xl px-4 py-3 text-sm font-bold border-none"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="maintenance">Maintenance</option>
            </select>
            <button
              type="submit"
              disabled={vehicleSaving}
              className="gradient-btn rounded-xl px-4 py-3 text-[10px] font-black uppercase tracking-widest disabled:opacity-60"
            >
              {vehicleSaving ? 'Saving...' : (vehicleForm.id ? 'Update Vehicle' : 'Add Vehicle')}
            </button>
          </form>
          {vehicleError && <p className="text-error text-xs font-bold mb-4">{vehicleError}</p>}

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-outline-variant/10">
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-outline">Vehicle Name</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-outline">Vehicle No</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-outline">Status</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-outline text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/5">
                {vehiclesLoading ? (
                  <tr><td className="px-4 py-5 text-sm text-outline" colSpan={4}>Loading vehicles...</td></tr>
                ) : vehicles.length === 0 ? (
                  <tr><td className="px-4 py-5 text-sm text-outline" colSpan={4}>No vehicle master records yet.</td></tr>
                ) : vehicles.map(v => (
                  <tr key={v.id} className="hover:bg-surface-bright transition-colors">
                    <td className="px-4 py-4 text-sm font-bold">{v.name}</td>
                    <td className="px-4 py-4 text-sm font-mono font-bold">{v.plate}</td>
                    <td className="px-4 py-4 text-xs uppercase font-black tracking-wider text-on-surface-variant">{v.status}</td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEditVehicle(v)}
                          className="p-2 rounded-lg bg-surface-container-high text-on-surface-variant hover:text-primary"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteVehicle(v.id)}
                          className="p-2 rounded-lg bg-error/10 text-error hover:bg-error hover:text-white"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-on-surface/40 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-surface-container-lowest rounded-[3rem] p-10 kinetic-shadow"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black tracking-tight font-headline uppercase italic underline decoration-primary/30 decoration-4">Provision User</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-surface-container-high rounded-full transition-colors">
                  <X />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-outline ml-4">Full Legal Name</label>
                  <input 
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="Enter full name"
                    className="w-full bg-surface-container-highest border-none rounded-[1.5rem] px-6 py-4 font-bold placeholder:text-outline/40"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-outline ml-4">Login ID</label>
                    <input 
                      required
                      value={formData.username}
                      onChange={e => setFormData({...formData, username: e.target.value})}
                      placeholder="Username"
                      className="w-full bg-surface-container-highest border-none rounded-[1.5rem] px-6 py-4 font-bold placeholder:text-outline/40"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-outline ml-4">Pass-key</label>
                    <input 
                      required
                      type="password"
                      value={formData.password}
                      onChange={e => setFormData({...formData, password: e.target.value})}
                      placeholder="••••••••"
                      className="w-full bg-surface-container-highest border-none rounded-[1.5rem] px-6 py-4 font-bold placeholder:text-outline/40"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-outline ml-4">Clearance Role</label>
                  <select 
                    value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value as UserRole})}
                    className="w-full bg-surface-container-highest border-none rounded-[1.5rem] px-6 py-4 font-bold appearance-none cursor-pointer"
                  >
                    {Object.values(UserRole).map(role => (
                      <option key={role} value={role}>{role.replace(/_/g, ' ').toUpperCase()}</option>
                    ))}
                  </select>
                </div>

                <button className="w-full gradient-btn py-5 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-primary/20 mt-4">
                  Confirm Provisioning
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
