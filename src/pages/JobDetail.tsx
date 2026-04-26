import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Truck, ArrowLeft, MoreVertical, Check, AlertCircle, Clock, Fingerprint, Edit3, ShieldAlert, ChevronRight } from 'lucide-react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Job, JobStatus } from '../types';
import { cn } from '../lib/utils';

export default function JobDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [job, setJob] = useState<Job | null>(null);
  const [checklist, setChecklist] = useState([
    { id: 1, task: 'Oil Change', verified: true },
    { id: 2, task: 'Brake Inspection', verified: false },
    { id: 3, task: 'Tyre Rotation', verified: false },
  ]);

  useEffect(() => {
    fetch(`/api/jobs/${id}`)
      .then(res => res.json())
      .then(data => setJob(data));
  }, [id]);

  const toggleCheck = (cid: number) => {
    setChecklist(checklist.map(item => item.id === cid ? { ...item, verified: !item.verified } : item));
  };

  return (
    <div className="flex-1 pb-44">
      <header className="sticky top-0 z-50 glass-panel border-b border-outline-variant/10 px-6 py-4 flex justify-between items-center transition-colors">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-surface-container-high rounded-xl text-primary">
            <ArrowLeft size={24} />
          </button>
          <h1 className="font-headline font-black text-lg tracking-tighter text-on-surface uppercase">job intelligence</h1>
        </div>
        <div className="w-10 h-10 rounded-full bg-surface-container-highest overflow-hidden border-2 border-primary-container">
          <img src="https://i.pravatar.cc/100?u=mechanic" alt="Mechanic" className="w-full h-full object-cover" />
        </div>
      </header>

      <main className="px-4 py-8 max-w-2xl mx-auto space-y-8">
        {!job ? (
          <div className="h-40 flex items-center justify-center font-headline font-bold text-outline animate-pulse">Retrieving Mission Data...</div>
        ) : (
          <>
            {/* Job Header */}
            <section className="bg-surface-container-lowest rounded-[2.5rem] p-8 kinetic-shadow relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4">
                <span className={cn(
                  "text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full shadow-sm",
                  job.priority === 'critical' ? 'bg-error text-white' : 'bg-secondary-container text-on-secondary-container'
                )}>
                  {job.priority} Priority
                </span>
              </div>
              <div className="flex items-start gap-6">
                <div className="p-4 bg-surface-container-low rounded-2xl text-primary">
                  <Truck size={40} />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-on-surface font-headline uppercase">{job.company || 'Private Mission'}</h2>
                  <p className="text-xs font-black text-outline/60 flex items-center gap-1 mt-2 tracking-widest uppercase">
                    <Fingerprint size={14} className="text-primary" />
                    {job.id}-ALPHA
                  </p>
                </div>
              </div>
            </section>

            {/* Mission Details Grid */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-surface-container-low rounded-[2rem] p-6 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="text-primary" size={16} />
                  <h3 className="font-black text-[9px] uppercase tracking-[0.2em] text-on-surface-variant">Temporal Data</h3>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-1">Job Date</p>
                  <p className="font-headline font-bold text-on-surface">{job.job_date || job.created_at.split('T')[0]}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-1">Job Time</p>
                  <p className="font-headline font-bold text-on-surface">{job.job_time || job.pickup_time}</p>
                </div>
              </div>

              <div className="bg-surface-container-low rounded-[2rem] p-6 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldAlert className="text-primary" size={16} />
                  <h3 className="font-black text-[9px] uppercase tracking-[0.2em] text-on-surface-variant">Vehicle Custody</h3>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-1">Vehicle Number Out</p>
                  <p className="font-headline font-bold text-on-surface">{job.vehicle_number_out || job.vehicle_plate}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-1">Vehicle Number In</p>
                  <p className="font-headline font-bold text-on-surface">{job.vehicle_number_in || '---'}</p>
                </div>
              </div>
            </section>

            {/* Core Intelligence */}
            <section className="bg-surface-container-highest/20 border border-outline-variant/10 rounded-[2.5rem] p-8 space-y-6">
              <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-on-surface-variant">Client & Personnel Intelligence</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                 <div>
                    <p className="text-[9px] font-black uppercase text-outline mb-1">Company</p>
                    <p className="font-bold text-on-surface">{job.company || 'N/A'}</p>
                 </div>
                 <div>
                    <p className="text-[9px] font-black uppercase text-outline mb-1">Requester</p>
                    <p className="font-bold text-on-surface">{job.requester || 'N/A'}</p>
                 </div>
                 <div>
                    <p className="text-[9px] font-black uppercase text-outline mb-1">Contact Person</p>
                    <p className="font-bold text-on-surface">{job.contact_person || 'N/A'}</p>
                 </div>
                 <div>
                    <p className="text-[9px] font-black uppercase text-outline mb-1">Contact Number</p>
                    <p className="font-bold text-primary">{job.contact_number || 'N/A'}</p>
                 </div>
                 <div>
                    <p className="text-[9px] font-black uppercase text-outline mb-1">Assigned Driver</p>
                    <p className="font-bold text-on-surface">{job.driver_name || 'Unassigned'}</p>
                 </div>
                 <div>
                    <p className="text-[9px] font-black uppercase text-outline mb-1">Current Status</p>
                    <p className="font-black text-xs uppercase text-primary">{job.status}</p>
                 </div>
                 <div className="col-span-1 md:col-span-2">
                    <p className="text-[9px] font-black uppercase text-outline mb-1">Service Address</p>
                    <p className="font-bold text-on-surface">{job.address || 'N/A'}</p>
                 </div>
                 <div>
                    <p className="text-[9px] font-black uppercase text-outline mb-1">Pickup Point</p>
                    <p className="text-xs font-medium text-on-surface-variant">{job.location || 'N/A'}</p>
                 </div>
                 <div>
                    <p className="text-[9px] font-black uppercase text-outline mb-1">Destination</p>
                    <p className="text-xs font-medium text-on-surface-variant">{job.destination || 'N/A'}</p>
                 </div>
              </div>
            </section>

            {/* Job Scope */}
            <section className="bg-surface-container-low rounded-[2.5rem] p-8 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Edit3 className="text-primary" size={20} />
                <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-on-surface-variant">Job Scope</h3>
              </div>
              <p className="text-on-surface text-base leading-relaxed bg-white/50 p-6 rounded-[1.5rem] border-l-8 border-primary italic font-medium">
                {job.job_scope || job.instructions || 'No detailed scope provided.'}
              </p>
            </section>

            {/* Status Control */}
            <section className="space-y-4">
              <label className="font-black text-[10px] uppercase tracking-[0.2em] text-outline px-4">Operational Status</label>
              <div className="bg-surface-container-highest p-1.5 rounded-[1.5rem] flex w-full ring-1 ring-black/5">
                {['pending', 'in_transit', 'completed'].map(s => (
                  <button 
                    key={s}
                    className={cn(
                      "flex-1 py-4 text-[10px] font-black uppercase tracking-[0.1em] rounded-2xl transition-all",
                      job.status === s ? "bg-white text-primary shadow-lg" : "text-on-surface-variant/40 hover:text-primary"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </section>

            {/* Remarks */}
            {job.remarks && (
              <section className="bg-surface-container-lowest rounded-[2.5rem] p-8 border border-primary/10">
                <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-on-surface-variant mb-4">Dispatcher Remarks</h3>
                <p className="text-sm font-medium text-on-surface-variant leading-relaxed">
                  {job.remarks}
                </p>
              </section>
            )}

            {/* Inspection Direct Link */}
            <Link 
              to={`/driver/job/${id}/vehicle-exterior`}
              className="flex items-center justify-between bg-surface-container-high p-6 rounded-[2rem] group hover:bg-surface-container transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm">
                  <Truck size={20} />
                </div>
                <div>
                  <h4 className="font-headline font-bold text-sm">Vehicle Exterior</h4>
                  <p className="text-[10px] font-bold text-on-surface-variant/60 uppercase">Pin Damage On Diagram</p>
                </div>
              </div>
              <ChevronRight className="text-on-surface-variant/40 group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </Link>

            <Link 
              to={`/driver/inspection/${id}`}
              className="flex items-center justify-between bg-surface-container-high p-6 rounded-[2rem] group hover:bg-surface-container transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm">
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <h4 className="font-headline font-bold text-sm">Visual Damage Map</h4>
                  <p className="text-[10px] font-bold text-on-surface-variant/60 uppercase">Unit Status Verification</p>
                </div>
              </div>
              <ChevronRight className="text-on-surface-variant/40 group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </Link>
            
            {/* Checklist */}
            <section className="bg-surface-container-lowest rounded-[2.5rem] p-8 kinetic-shadow">
              <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-on-surface-variant mb-6">Maintenance Checklist</h3>
              <div className="space-y-2">
                {checklist.map(item => (
                  <div 
                    key={item.id}
                    onClick={() => toggleCheck(item.id)}
                    className="flex items-center justify-between p-4 rounded-2xl hover:bg-surface-container-low transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-6 h-6 border-2 rounded-lg flex items-center justify-center transition-all",
                        item.verified ? "bg-primary border-primary text-white" : "border-outline-variant/30"
                      )}>
                        {item.verified && <Check size={14} />}
                      </div>
                      <span className={cn("font-bold text-sm", item.verified ? "text-on-surface line-through opacity-40" : "text-on-surface")}>
                        {item.task}
                      </span>
                    </div>
                    {item.verified && <span className="text-[8px] font-black uppercase text-primary/60 tracking-widest">Verified</span>}
                  </div>
                ))}
              </div>
            </section>

            {/* Final Mechanic Remarks */}
            <section className="space-y-4">
              <label className="font-black text-[10px] uppercase tracking-[0.2em] text-outline px-4">Workshop Remarks</label>
              <div className="relative">
                 <textarea 
                   className="w-full bg-surface-container-highest border-none rounded-[2rem] p-6 text-on-surface placeholder:text-outline-variant/60 focus:ring-0 focus:bg-white transition-all min-h-[160px] font-medium"
                   placeholder="Describe work performed, parts used, or future recommendations..."
                 />
                 <div className="absolute bottom-6 right-6 opacity-10 pointer-events-none">
                   <Edit3 size={48} />
                 </div>
              </div>
            </section>

            {/* Telemetry Visual */}
            <section className="rounded-[2.5rem] overflow-hidden h-40 relative group">
               <img 
                 src="https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=600" 
                 alt="Telemetry" 
                 className="w-full h-full object-cover grayscale brightness-50 group-hover:grayscale-0 group-hover:brightness-100 transition-all duration-1000"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-on-surface/90 to-transparent flex items-end p-8">
                 <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 bg-secondary rounded-full animate-pulse shadow-[0_0_12px_#855300]" />
                    <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Live Telemetry Link Established</span>
                 </div>
               </div>
            </section>
          </>
        )}
      </main>

      {/* Footer Actions */}
      <div className="fixed bottom-0 left-0 w-full glass-panel border-t border-outline-variant/15 z-40 px-6 py-8 flex flex-col gap-4">
         <div className="max-w-2xl mx-auto w-full flex gap-4">
            <button className="flex-1 py-5 bg-surface-container-low text-primary font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl active:scale-95 transition-all">
              Save Progress
            </button>
            <button 
              onClick={() => navigate(-1)}
              className="flex-[2] py-5 gradient-btn font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl"
            >
              Mark as Complete
            </button>
         </div>
      </div>
    </div>
  );
}
