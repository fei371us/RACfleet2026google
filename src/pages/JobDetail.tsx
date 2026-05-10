import { useState, useEffect } from 'react';
import { Truck, ArrowLeft, Check, Edit3, ShieldAlert, ChevronRight, Clock, Fingerprint, Loader2 } from 'lucide-react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Job, ChecklistItem } from '../types';
import { cn } from '../lib/utils';
import { api } from '../lib/api';

const DEFAULT_CHECKLIST: ChecklistItem[] = [
  { id: 1, task: 'Pre-trip vehicle inspection', verified: false },
  { id: 2, task: 'Fuel level check',            verified: false },
  { id: 3, task: 'Tyre pressure check',         verified: false },
  { id: 4, task: 'Lights & signals check',      verified: false },
];

export default function JobDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [job, setJob]                     = useState<Job | null>(null);
  const [checklist, setChecklist]         = useState<ChecklistItem[]>(DEFAULT_CHECKLIST);
  const [workPerformed, setWorkPerformed] = useState('');
  const [vehicleNumberIn, setVehicleIn]  = useState('');
  const [petrolOut, setPetrolOut]        = useState('');
  const [petrolIn, setPetrolIn]          = useState('');
  const [mileageOut, setMileageOut]      = useState('');
  const [mileageIn, setMileageIn]        = useState('');
  const [saving, setSaving]               = useState(false);
  const [completing, setCompleting]       = useState(false);

  useEffect(() => {
    if (!id) return;
    api.get<Job>(`/api/jobs/${id}`).then(data => {
      setJob(data);
      if (Array.isArray(data.checklist) && data.checklist.length > 0) setChecklist(data.checklist);
      if (data.vehicle_number_in) setVehicleIn(data.vehicle_number_in);
      if (data.petrol_out) setPetrolOut(data.petrol_out);
      if (data.petrol_in) setPetrolIn(data.petrol_in);
      if (data.mileage_out) setMileageOut(data.mileage_out);
      if (data.mileage_in) setMileageIn(data.mileage_in);
      if (data.workPerformed)     setWorkPerformed(data.workPerformed);
    });
  }, [id]);

  const toggleCheck = async (cid: number) => {
    const updated = checklist.map(item => item.id === cid ? { ...item, verified: !item.verified } : item);
    setChecklist(updated);
    api.patch(`/api/jobs/${id}/checklist`, { checklist: updated }).catch(() => {});
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all([
        api.patch(`/api/jobs/${id}`, {
          vehicle_number_in: vehicleNumberIn,
          petrol_out: petrolOut,
          petrol_in: petrolIn,
          mileage_out: mileageOut,
          mileage_in: mileageIn,
        }),
        api.patch(`/api/jobs/${id}/checklist`, { checklist }),
      ]);
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async () => {
    setCompleting(true);
    try {
      await api.post(`/api/jobs/${id}/complete`, {
        workPerformed,
        vehicleNumberIn,
        petrol_out: petrolOut,
        petrol_in: petrolIn,
        mileage_out: mileageOut,
        mileage_in: mileageIn,
      });
      navigate(-1);
    } finally {
      setCompleting(false);
    }
  };

  return (
    <div className="flex-1 pb-44">
      <header className="sticky top-0 z-50 glass-panel border-b border-outline-variant/10 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-surface-container-high rounded-xl text-primary">
            <ArrowLeft size={24} />
          </button>
          <h1 className="font-headline font-black text-lg tracking-tighter text-on-surface uppercase">Job Intelligence</h1>
        </div>
      </header>

      <main className="px-4 py-8 max-w-2xl mx-auto space-y-8">
        {!job ? (
          <div className="h-40 flex items-center justify-center font-headline font-bold text-outline animate-pulse">Retrieving Mission Data...</div>
        ) : (
          <>
            <section className="bg-surface-container-lowest rounded-[2.5rem] p-8 kinetic-shadow relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4">
                <span className={cn(
                  "text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full shadow-sm",
                  job.priority === 'CRITICAL' ? 'bg-error text-white' : 'bg-secondary-container text-on-secondary-container'
                )}>{job.priority} Priority</span>
              </div>
              <div className="flex items-start gap-6">
                <div className="p-4 bg-surface-container-low rounded-2xl text-primary"><Truck size={40} /></div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-on-surface font-headline uppercase">{job.company || 'Private Mission'}</h2>
                  <p className="text-xs font-black text-outline/60 flex items-center gap-1 mt-2 tracking-widest uppercase">
                    <Fingerprint size={14} className="text-primary" />
                    {job.id} • {job.type}
                  </p>
                </div>
              </div>
            </section>

            <section className="grid grid-cols-2 gap-4">
              <div className="bg-surface-container-low rounded-[2rem] p-6 space-y-4">
                <div className="flex items-center gap-2"><Clock className="text-primary" size={16} /><h3 className="font-black text-[9px] uppercase tracking-[0.2em] text-on-surface-variant">Temporal Data</h3></div>
                <div>
                  <p className="text-[10px] font-bold text-outline uppercase mb-1">Created</p>
                  <p className="font-headline font-bold text-on-surface">{job.created_at ? new Date(job.created_at).toLocaleDateString() : '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-outline uppercase mb-1">Job Date</p>
                  <p className="font-headline font-bold text-on-surface">{job.job_date ? new Date(job.job_date).toLocaleDateString() : '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-outline uppercase mb-1">Job Time</p>
                  <p className="font-headline font-bold text-on-surface">{job.job_time || job.pickup_time || '—'}</p>
                </div>
              </div>
              <div className="bg-surface-container-low rounded-[2rem] p-6 space-y-4">
                <div className="flex items-center gap-2"><ShieldAlert className="text-primary" size={16} /><h3 className="font-black text-[9px] uppercase tracking-[0.2em] text-on-surface-variant">Vehicle Custody</h3></div>
                <div>
                  <p className="text-[10px] font-bold text-outline uppercase mb-1">Vehicle Out</p>
                  <p className="font-headline font-bold text-on-surface">{job.vehicle_number_out || job.vehicle_plate || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-outline uppercase mb-1">Vehicle In</p>
                  <input
                    value={vehicleNumberIn}
                    onChange={e => setVehicleIn(e.target.value)}
                    placeholder="Enter on return"
                    className="w-full bg-surface-container-highest/60 rounded-xl px-3 py-2 text-sm font-bold border-none focus:ring-1 ring-primary/20"
                  />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-outline uppercase mb-1">Petrol Out</p>
                  <input
                    value={petrolOut}
                    onChange={e => setPetrolOut(e.target.value)}
                    placeholder="e.g. 3/4"
                    className="w-full bg-surface-container-highest/60 rounded-xl px-3 py-2 text-sm font-bold border-none focus:ring-1 ring-primary/20"
                  />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-outline uppercase mb-1">Petrol In</p>
                  <input
                    value={petrolIn}
                    onChange={e => setPetrolIn(e.target.value)}
                    placeholder="e.g. 1/2"
                    className="w-full bg-surface-container-highest/60 rounded-xl px-3 py-2 text-sm font-bold border-none focus:ring-1 ring-primary/20"
                  />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-outline uppercase mb-1">Mileage Out</p>
                  <input
                    value={mileageOut}
                    onChange={e => setMileageOut(e.target.value)}
                    placeholder="e.g. 128450"
                    className="w-full bg-surface-container-highest/60 rounded-xl px-3 py-2 text-sm font-bold border-none focus:ring-1 ring-primary/20"
                  />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-outline uppercase mb-1">Mileage In</p>
                  <input
                    value={mileageIn}
                    onChange={e => setMileageIn(e.target.value)}
                    placeholder="e.g. 128512"
                    className="w-full bg-surface-container-highest/60 rounded-xl px-3 py-2 text-sm font-bold border-none focus:ring-1 ring-primary/20"
                  />
                </div>
              </div>
            </section>

            <section className="bg-surface-container-highest/20 border border-outline-variant/10 rounded-[2.5rem] p-8 space-y-6">
              <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-on-surface-variant">Client & Personnel Intelligence</h3>
              <div className="grid grid-cols-2 gap-y-6 gap-x-12">
                {[
                  ['Company',        job.company],
                  ['Contact Person', job.contact_person],
                  ['Contact Number', job.contact_number],
                  ['Assigned Driver', job.driver_name || 'Unassigned'],
                  ['Status',         job.status?.replace('_', ' ')],
                ].map(([label, value]) => (
                  <div key={label as string}>
                    <p className="text-[9px] font-black uppercase text-outline mb-1">{label}</p>
                    <p className="font-bold text-on-surface">{value || 'N/A'}</p>
                  </div>
                ))}
                <div className="col-span-2">
                  <p className="text-[9px] font-black uppercase text-outline mb-1">Address</p>
                  <p className="font-bold text-on-surface">{job.address || 'N/A'}</p>
                </div>
              </div>
            </section>

            {(job.job_scope || job.instructions) && (
              <section className="bg-surface-container-low rounded-[2.5rem] p-8 space-y-4">
                <div className="flex items-center gap-2"><Edit3 className="text-primary" size={20} /><h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-on-surface-variant">Job Scope</h3></div>
                <p className="text-on-surface text-base leading-relaxed bg-white/50 p-6 rounded-[1.5rem] border-l-8 border-primary italic font-medium">
                  {job.job_scope || job.instructions}
                </p>
              </section>
            )}

            <Link to={`/driver/job/${id}/vehicle-exterior`} className="flex items-center justify-between bg-surface-container-high p-6 rounded-[2rem] group hover:bg-surface-container transition-all">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm"><Truck size={20} /></div>
                <div><h4 className="font-headline font-bold text-sm">Vehicle Exterior</h4><p className="text-[10px] font-bold text-on-surface-variant/60 uppercase">Pin Damage On Diagram</p></div>
              </div>
              <ChevronRight className="text-on-surface-variant/40 group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </Link>

            <section className="bg-surface-container-lowest rounded-[2.5rem] p-8 kinetic-shadow">
              <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-on-surface-variant mb-6">Maintenance Checklist</h3>
              <div className="space-y-2">
                {checklist.map(item => (
                  <div key={item.id} onClick={() => toggleCheck(item.id)}
                    className="flex items-center justify-between p-4 rounded-2xl hover:bg-surface-container-low transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn("w-6 h-6 border-2 rounded-lg flex items-center justify-center transition-all",
                        item.verified ? "bg-primary border-primary text-white" : "border-outline-variant/30"
                      )}>
                        {item.verified && <Check size={14} />}
                      </div>
                      <span className={cn("font-bold text-sm", item.verified ? "text-on-surface line-through opacity-40" : "text-on-surface")}>{item.task}</span>
                    </div>
                    {item.verified && <span className="text-[8px] font-black uppercase text-primary/60 tracking-widest">Verified</span>}
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <label className="font-black text-[10px] uppercase tracking-[0.2em] text-outline px-4">Work Performed / Remarks</label>
              <div className="relative">
                <textarea
                  value={workPerformed}
                  onChange={e => setWorkPerformed(e.target.value)}
                  className="w-full bg-surface-container-highest border-none rounded-[2rem] p-6 text-on-surface placeholder:text-outline-variant/60 focus:ring-0 focus:bg-white transition-all min-h-[160px] font-medium"
                  placeholder="Describe work performed, parts used, or future recommendations..."
                />
                <div className="absolute bottom-6 right-6 opacity-10 pointer-events-none"><Edit3 size={48} /></div>
              </div>
            </section>

            {job.remarks && (
              <section className="bg-surface-container-lowest rounded-[2.5rem] p-8 border border-primary/10">
                <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-on-surface-variant mb-4">Dispatcher Remarks</h3>
                <p className="text-sm font-medium text-on-surface-variant leading-relaxed">{job.remarks}</p>
              </section>
            )}
          </>
        )}
      </main>

      <div className="fixed bottom-0 left-0 w-full glass-panel border-t border-outline-variant/15 z-40 px-6 py-8">
        <div className="max-w-2xl mx-auto w-full flex gap-4">
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-5 bg-surface-container-low text-primary font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving && <Loader2 className="animate-spin" size={16} />}
            Save Progress
          </button>
          <button onClick={handleComplete} disabled={completing}
            className="flex-[2] py-5 gradient-btn font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {completing && <Loader2 className="animate-spin" size={16} />}
            Mark as Complete
          </button>
        </div>
      </div>
    </div>
  );
}
