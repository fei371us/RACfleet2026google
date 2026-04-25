import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Truck, MapPin, Calendar, Clock, ChevronRight, X, ArrowRight, Settings, Fuel, Verified, Navigation } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { JobType, Vehicle } from '../types';
import { cn } from '../lib/utils';

export default function CreateJob() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [formData, setFormData] = useState({
    id: `KF-${Math.floor(Math.random() * 9000) + 1000}`,
    type: JobType.DELIVERY,
    vehicle_id: '',
    priority: 'standard',
    location: '',
    destination: '',
    pickup_time: '',
    instructions: '',
    // New fields
    job_date: new Date().toISOString().split('T')[0],
    job_scope: '',
    vehicle_number_out: '',
    vehicle_number_in: '',
    job_time: '',
    company: '',
    requester: '',
    contact_person: '',
    contact_number: '',
    address: '',
    remarks: ''
  });

  useEffect(() => {
    fetch('/api/vehicles')
      .then(res => res.json())
      .then(data => setVehicles(data));
  }, []);

  useEffect(() => {
    if (formData.vehicle_id) {
      const v = vehicles.find(v => v.id === formData.vehicle_id);
      if (v) {
        setFormData(prev => ({ ...prev, vehicle_number_out: v.plate }));
      }
    }
  }, [formData.vehicle_id, vehicles]);

  const handleSubmit = async () => {
    if (!formData.vehicle_id || !formData.company) return;
    
    await fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    navigate('/');
  };

  return (
    <div className="flex-1 pb-40 text-on-surface">
      <header className="sticky top-0 z-50 glass-panel border-b border-outline-variant/10 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-surface-container-high rounded-xl text-primary">
            <X size={24} />
          </button>
          <h1 className="font-headline font-black text-lg tracking-tighter text-on-surface uppercase">kinetic fleet</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-headline font-bold tracking-tight text-xs uppercase text-primary">New Job Request</span>
          <div className="w-10 h-10 rounded-full bg-surface-container-highest overflow-hidden border-2 border-primary/20">
            <img src="https://i.pravatar.cc/100?u=dispatcher" alt="Profile" />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-12 space-y-12 pb-24">
        {/* Progress Stepper */}
        <div className="flex items-end gap-2 mb-12">
          <div className="flex flex-col gap-1">
            <span className="text-primary font-headline font-extrabold text-4xl tracking-tighter">01</span>
            <div className="h-1.5 w-12 bg-primary rounded-full"></div>
          </div>
          <div className="flex flex-col gap-1 opacity-20">
            <span className="text-on-surface font-headline font-extrabold text-2xl tracking-tighter">02</span>
            <div className="h-1.5 w-8 bg-on-surface rounded-full"></div>
          </div>
          <div className="ml-auto text-right">
            <p className="text-on-surface-variant font-label text-[10px] uppercase tracking-[0.2em] font-bold">Current Phase</p>
            <p className="font-headline font-bold text-xl text-on-surface">Data Entry</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Form */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Core Job Info */}
            <section className="bg-surface-container-lowest rounded-[2.5rem] p-8 kinetic-shadow space-y-6">
              <h2 className="font-headline font-bold text-2xl flex items-center gap-3">
                <Calendar className="text-primary" />
                Job Basics
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block font-label text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant ml-1">Date</label>
                  <input 
                    type="date"
                    value={formData.job_date}
                    onChange={(e) => setFormData({...formData, job_date: e.target.value})}
                    className="w-full bg-surface-container-highest border-none rounded-2xl px-4 py-4 font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block font-label text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant ml-1">Time</label>
                  <input 
                    type="time"
                    value={formData.job_time}
                    onChange={(e) => setFormData({...formData, job_time: e.target.value})}
                    className="w-full bg-surface-container-highest border-none rounded-2xl px-4 py-4 font-medium"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block font-label text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant ml-1">Job Scope</label>
                <textarea 
                  value={formData.job_scope}
                  onChange={(e) => setFormData({...formData, job_scope: e.target.value})}
                  placeholder="Summarize the work to be performed..."
                  className="w-full bg-surface-container-highest border-none rounded-2xl px-4 py-4 font-medium h-24"
                />
              </div>
            </section>

            {/* Client Intelligence */}
            <section className="bg-surface-container-lowest rounded-[2.5rem] p-8 kinetic-shadow space-y-6">
              <h2 className="font-headline font-bold text-2xl flex items-center gap-3">
                <Navigation className="text-primary" />
                Company Details
              </h2>
              <div className="space-y-4">
                 <div className="space-y-2">
                    <label className="block font-label text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant ml-1">Company Name</label>
                    <input 
                      value={formData.company}
                      onChange={(e) => setFormData({...formData, company: e.target.value})}
                      placeholder="Enter company name..."
                      className="w-full bg-surface-container-highest border-none rounded-2xl px-4 py-4 font-medium"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="block font-label text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant ml-1">Requester</label>
                    <input 
                      value={formData.requester}
                      onChange={(e) => setFormData({...formData, requester: e.target.value})}
                      placeholder="Who is requesting this job?"
                      className="w-full bg-surface-container-highest border-none rounded-2xl px-4 py-4 font-medium"
                    />
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block font-label text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant ml-1">Contact Person</label>
                      <input 
                        value={formData.contact_person}
                        onChange={(e) => setFormData({...formData, contact_person: e.target.value})}
                        className="w-full bg-surface-container-highest border-none rounded-2xl px-4 py-4 font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block font-label text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant ml-1">Contact Number</label>
                      <input 
                        value={formData.contact_number}
                        onChange={(e) => setFormData({...formData, contact_number: e.target.value})}
                        className="w-full bg-surface-container-highest border-none rounded-2xl px-4 py-4 font-medium"
                      />
                    </div>
                 </div>
                 <div className="space-y-2">
                  <label className="block font-label text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant ml-1">Address</label>
                  <input 
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    placeholder="Physical address..."
                    className="w-full bg-surface-container-highest border-none rounded-2xl px-4 py-4 font-medium"
                  />
                </div>
              </div>
            </section>

            {/* Vehicle Intelligence */}
            <section className="bg-surface-container-lowest rounded-[2.5rem] p-8 kinetic-shadow relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Truck size={140} />
              </div>
              <div className="relative z-10">
                <h2 className="font-headline font-bold text-2xl mb-6 flex items-center gap-3">
                  <Truck className="text-primary" />
                  Vehicle Intelligence
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block font-label text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant ml-1">Select Unit</label>
                    <select 
                      value={formData.vehicle_id}
                      onChange={(e) => setFormData({...formData, vehicle_id: e.target.value})}
                      className="w-full bg-surface-container-highest border-none rounded-2xl px-4 py-4 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all font-headline font-bold text-lg appearance-none"
                    >
                      <option value="">Choose Vehicle...</option>
                      {vehicles.map(v => (
                        <option key={v.id} value={v.id}>{v.name} ({v.plate})</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block font-label text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant ml-1">Vehicle Out</label>
                    <input 
                      value={formData.vehicle_number_out}
                      onChange={(e) => setFormData({...formData, vehicle_number_out: e.target.value})}
                      placeholder="Plate number out..."
                      className="w-full bg-surface-container-highest border-none rounded-2xl px-4 py-4 font-headline font-bold"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Remarks */}
            <section className="bg-surface-container-lowest rounded-[2.5rem] p-8 kinetic-shadow space-y-2">
               <label className="block font-label text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant ml-1">Final Remarks</label>
               <textarea 
                  value={formData.remarks}
                  onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                  placeholder="Additional notes, special instructions, or observations..."
                  className="w-full bg-surface-container-highest border-none rounded-2xl px-4 py-4 font-medium h-32"
                />
            </section>
          </div>

          {/* Right Column: Summary Card */}
          <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-28">
            <div className="bg-primary text-white rounded-[2.5rem] p-8 shadow-xl overflow-hidden relative">
              <div className="absolute -right-10 -bottom-10 opacity-10">
                <Verified size={200} />
              </div>
              <p className="font-label text-[10px] uppercase tracking-[0.2em] font-bold opacity-60 mb-6">Request Preview</p>
              <div className="space-y-6">
                <div className="flex justify-between items-end border-b border-white/10 pb-3">
                  <span className="text-[10px] uppercase font-bold opacity-70">Company</span>
                  <span className="font-headline font-bold text-sm truncate max-w-[120px]">
                    {formData.company || '---'}
                  </span>
                </div>
                <div className="flex justify-between items-end border-b border-white/10 pb-3">
                  <span className="text-[10px] uppercase font-bold opacity-70">Date</span>
                  <span className="font-headline font-bold text-sm">{formData.job_date || '---'}</span>
                </div>
                <div className="flex justify-between items-end border-b border-white/10 pb-3">
                   <span className="text-[10px] uppercase font-bold opacity-70">Ref</span>
                   <span className="font-headline font-bold text-sm">{formData.id}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 w-full glass-panel border-t border-outline-variant/15 z-40 px-6 py-6 ring-1 ring-black/5">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-6">
           <button onClick={() => navigate(-1)} className="text-on-surface-variant font-label font-bold uppercase text-[10px] tracking-[0.2em] hover:text-primary transition-colors">
             Discard Request
           </button>
           <button 
             onClick={handleSubmit}
             className="flex-1 max-w-md gradient-btn py-5 rounded-2xl flex items-center justify-center gap-3"
           >
              <span className="font-label font-black uppercase tracking-[0.2em] text-sm">Create Job</span>
              <ArrowRight size={20} />
           </button>
        </div>
      </div>
    </div>
  );
}
