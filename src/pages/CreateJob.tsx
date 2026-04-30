import { useEffect, useState } from 'react';
import { Truck, MapPin, Calendar, X, ArrowRight, Settings, Navigation, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { api } from '../lib/api';
import { ShuttlerSubType } from '../types';
import { useVehicles } from '../hooks/useVehicles';

const FIELD = "w-full bg-surface-container-highest border-none rounded-2xl px-4 py-4 font-medium";

interface CreatedJob {
  reference: string;
  createdAt: string;
  company: string;
  type: string;
}

interface NewJobMeta {
  reference: string;
  createdAt: string;
}

export default function CreateJob() {
  const navigate = useNavigate();
  const { vehicles } = useVehicles();
  const [jobType, setJobType] = useState<'SHUTTLER' | 'WORKSHOP'>('SHUTTLER');
  const [submitting, setSubmitting] = useState(false);
  const [createdJob, setCreatedJob] = useState<CreatedJob | null>(null);
  const [jobMeta, setJobMeta] = useState<NewJobMeta | null>(null);
  const [form, setForm] = useState({
    priority:            'STANDARD',
    vehicle_id:          '',
    company:             '',
    contact_person:      '',
    contact_number:      '',
    address:             '',
    job_date:            new Date().toISOString().split('T')[0],
    job_time:            '',
    location:            '',
    destination:         '',
    job_scope:           '',
    remarks:             '',
    shuttlerSubType:     '',
    vehicle_number_out:  '',
    vehicle_number_in:   '',
    sales_person:        '',
  });

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));
  const vehiclePlate = vehicles.find(v => v.id === form.vehicle_id)?.plate ?? '';

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const meta = await api.get<NewJobMeta>('/api/jobs/new/meta');
        if (mounted) setJobMeta(meta);
      } catch {
        if (mounted) {
          setJobMeta({
            reference: 'AUTO-ON-SUBMIT',
            createdAt: new Date().toISOString(),
          });
        }
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleSubmit = async () => {
    if (!form.vehicle_id || !form.company) return;
    if (jobType === 'SHUTTLER' && !form.shuttlerSubType) return;
    setSubmitting(true);
    try {
      const response = await api.post<{ id: string; reference: string; createdAt: string }>('/api/jobs', {
        reference:            jobMeta?.reference && jobMeta.reference !== 'AUTO-ON-SUBMIT' ? jobMeta.reference : undefined,
        createdAt:            jobMeta?.createdAt,
        type:                 jobType,
        shuttlerSubType:      jobType === 'SHUTTLER' ? form.shuttlerSubType : undefined,
        priority:             form.priority,
        vehicle_id:           form.vehicle_id,
        company:              form.company,
        contact_person:       form.sales_person || form.contact_person,
        contact_number:       form.contact_number,
        address:              form.address,
        job_date:             form.job_date,
        job_time:             form.job_time,
        location:             jobType === 'SHUTTLER' ? form.location    : undefined,
        destination:          jobType === 'SHUTTLER' ? form.destination : undefined,
        job_scope:            jobType === 'WORKSHOP'  ? form.job_scope  : undefined,
        vehicle_number_out:   form.vehicle_number_out,
        vehicle_number_in:    form.vehicle_number_in,
        remarks:              form.remarks,
      });
      setCreatedJob({
        reference: response.reference,
        createdAt: response.createdAt,
        company: form.company,
        type: jobType,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirm = () => {
    navigate('/requester');
  };

  if (createdJob) {
    return (
      <div className="flex-1 pb-40 text-on-surface flex flex-col">
        <header className="sticky top-0 z-50 glass-panel border-b border-outline-variant/10 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="font-headline font-black text-lg tracking-tighter text-on-surface uppercase">Job Created Successfully</h1>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-md w-full space-y-6">
            <div className="bg-surface-container-lowest rounded-[2.5rem] p-8 kinetic-shadow text-center space-y-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full">
                <CheckCircle2 className="text-primary" size={40} />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-black font-headline text-on-surface">Success!</h2>
                <p className="text-on-surface-variant text-sm">Your job request has been created and is ready for assignment.</p>
              </div>

              <div className="bg-surface-container rounded-2xl p-6 space-y-4">
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Job Number</p>
                  <p className="text-2xl font-black font-headline text-primary">{createdJob.reference}</p>
                </div>
                <div className="h-px bg-outline-variant/10"></div>
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Created Date & Time</p>
                  <p className="text-sm font-bold text-on-surface">{new Date(createdJob.createdAt).toLocaleDateString()}</p>
                  <p className="text-xs text-on-surface-variant">{new Date(createdJob.createdAt).toLocaleTimeString()}</p>
                </div>
                <div className="h-px bg-outline-variant/10"></div>
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Company</p>
                  <p className="text-sm font-bold text-on-surface">{createdJob.company}</p>
                </div>
                <div className="h-px bg-outline-variant/10"></div>
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Job Type</p>
                  <p className="text-sm font-bold text-on-surface">{createdJob.type}</p>
                </div>
              </div>

              <button
                onClick={handleConfirm}
                className="w-full gradient-btn py-4 rounded-2xl font-label font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 mt-4"
              >
                <CheckCircle2 size={20} />
                Done
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 pb-44 text-on-surface">
      <header className="sticky top-0 z-50 glass-panel border-b border-outline-variant/10 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-surface-container-high rounded-xl text-primary">
            <X size={24} />
          </button>
          <h1 className="font-headline font-black text-lg tracking-tighter text-on-surface uppercase">New Job Request</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-8 space-y-10 pb-24">

        {/* Job Type Toggle */}
        <section className="bg-surface-container-lowest rounded-[2.5rem] p-8 kinetic-shadow space-y-4">
          <h2 className="font-headline font-bold text-2xl flex items-center gap-3">
            <Truck className="text-primary" />
            Job Type
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {(['SHUTTLER', 'WORKSHOP'] as const).map(t => (
              <button
                key={t}
                onClick={() => setJobType(t)}
                className={cn(
                  "flex items-center justify-center gap-3 py-6 rounded-[2rem] font-black text-sm uppercase tracking-widest border-2 transition-all",
                  jobType === t
                    ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                    : "bg-surface-container border-outline-variant/20 text-on-surface-variant hover:border-primary/30"
                )}
              >
                {t === 'SHUTTLER' ? <Truck size={20} /> : <Settings size={20} />}
                {t}
              </button>
            ))}
          </div>
        </section>

        <section className="bg-surface-container-lowest rounded-[2.5rem] p-8 kinetic-shadow space-y-4">
          <h2 className="font-headline font-bold text-2xl">Job Info</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-surface-container rounded-2xl p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Job Number</p>
              <p className="text-lg font-black font-headline text-primary">{jobMeta?.reference ?? 'Generating...'}</p>
            </div>
            <div className="bg-surface-container rounded-2xl p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Job Creation Date</p>
              <p className="text-sm font-bold text-on-surface">{jobMeta ? new Date(jobMeta.createdAt).toLocaleDateString() : 'Generating...'}</p>
              <p className="text-xs text-on-surface-variant">{jobMeta ? new Date(jobMeta.createdAt).toLocaleTimeString() : ''}</p>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-8">

            {/* Shuttler sub-type selection - RIGHT AFTER JOB TYPE */}
            {jobType === 'SHUTTLER' && (
              <section className="bg-surface-container-lowest rounded-[2.5rem] p-8 kinetic-shadow space-y-6">
                <h2 className="font-headline font-bold text-2xl flex items-center gap-3">
                  <Truck className="text-primary" />
                  Service Type
                </h2>
                <div className="space-y-2">
                  <label className="block font-label text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant ml-1">Shuttler Service</label>
                  <select value={form.shuttlerSubType} onChange={e => set('shuttlerSubType', e.target.value)} className={cn(FIELD, "appearance-none font-bold")}>
                    <option value="">Select service type...</option>
                    {Object.values(ShuttlerSubType).map(subType => (
                      <option key={subType} value={subType}>{subType}</option>
                    ))}
                  </select>
                </div>
              </section>
            )}

            {/* Vehicle */}
            <section className="bg-surface-container-lowest rounded-[2.5rem] p-8 kinetic-shadow space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><Truck size={140} /></div>
              <h2 className="font-headline font-bold text-2xl flex items-center gap-3 relative z-10">
                <Truck className="text-primary" />
                Vehicle
              </h2>
              <select value={form.vehicle_id} onChange={e => set('vehicle_id', e.target.value)} className={cn(FIELD, "appearance-none font-headline font-bold text-lg relative z-10")}>
                <option value="">Choose Vehicle...</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.name} ({v.plate})</option>)}
              </select>
            </section>

            {/* Vehicle Numbers & Sales Person */}
            <section className="bg-surface-container-lowest rounded-[2.5rem] p-8 kinetic-shadow space-y-6">
              <h2 className="font-headline font-bold text-2xl">Vehicle Details & Staff</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block font-label text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant ml-1">Vehicle No (Out)</label>
                  <input value={form.vehicle_number_out} onChange={e => set('vehicle_number_out', e.target.value)} placeholder="e.g. ABC-1234" className={FIELD} />
                </div>
                <div className="space-y-2">
                  <label className="block font-label text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant ml-1">Vehicle No (Return)</label>
                  <input value={form.vehicle_number_in} onChange={e => set('vehicle_number_in', e.target.value)} placeholder="e.g. ABC-1234" className={FIELD} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block font-label text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant ml-1">Sales Person/Coordinator</label>
                <input value={form.sales_person} onChange={e => set('sales_person', e.target.value)} placeholder="Name of sales representative..." className={FIELD} />
              </div>
            </section>

            {/* Schedule */}
            <section className="bg-surface-container-lowest rounded-[2.5rem] p-8 kinetic-shadow space-y-6">
              <h2 className="font-headline font-bold text-2xl flex items-center gap-3">
                <Calendar className="text-primary" />
                Schedule &amp; Priority
              </h2>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block font-label text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant ml-1">Date</label>
                  <input type="date" value={form.job_date} onChange={e => set('job_date', e.target.value)} className={FIELD} />
                </div>
                <div className="space-y-2">
                  <label className="block font-label text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant ml-1">Time</label>
                  <input type="time" value={form.job_time} onChange={e => set('job_time', e.target.value)} className={FIELD} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block font-label text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant ml-1">Priority</label>
                <select value={form.priority} onChange={e => set('priority', e.target.value)} className={cn(FIELD, "appearance-none font-bold")}>
                  {['LOW', 'STANDARD', 'HIGH', 'CRITICAL'].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </section>

            {/* Company */}
            <section className="bg-surface-container-lowest rounded-[2.5rem] p-8 kinetic-shadow space-y-6">
              <h2 className="font-headline font-bold text-2xl flex items-center gap-3">
                <Navigation className="text-primary" />
                Company Details
              </h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block font-label text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant ml-1">Company Name</label>
                  <input value={form.company} onChange={e => set('company', e.target.value)} placeholder="Enter company name..." className={FIELD} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block font-label text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant ml-1">Contact Person</label>
                    <input value={form.contact_person} onChange={e => set('contact_person', e.target.value)} className={FIELD} />
                  </div>
                  <div className="space-y-2">
                    <label className="block font-label text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant ml-1">Contact Number</label>
                    <input value={form.contact_number} onChange={e => set('contact_number', e.target.value)} className={FIELD} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block font-label text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant ml-1">Address</label>
                  <input value={form.address} onChange={e => set('address', e.target.value)} placeholder="Physical address..." className={FIELD} />
                </div>
              </div>
            </section>

            {/* Shuttler route fields */}
            {jobType === 'SHUTTLER' && (
              <section className="bg-surface-container-lowest rounded-[2.5rem] p-8 kinetic-shadow space-y-6">
                <h2 className="font-headline font-bold text-2xl flex items-center gap-3">
                  <MapPin className="text-primary" />
                  Route Details
                </h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block font-label text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant ml-1">Pickup Location</label>
                    <input value={form.location} onChange={e => set('location', e.target.value)} placeholder="e.g. North Cargo Gate, Zone 7" className={FIELD} />
                  </div>
                  <div className="space-y-2">
                    <label className="block font-label text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant ml-1">Destination</label>
                    <input value={form.destination} onChange={e => set('destination', e.target.value)} placeholder="e.g. Central Distribution Center" className={FIELD} />
                  </div>
                </div>
              </section>
            )}

            {/* Workshop scope fields */}
            {jobType === 'WORKSHOP' && (
              <section className="bg-surface-container-lowest rounded-[2.5rem] p-8 kinetic-shadow space-y-6">
                <h2 className="font-headline font-bold text-2xl flex items-center gap-3">
                  <Settings className="text-primary" />
                  Workshop Scope
                </h2>
                <div className="space-y-2">
                  <label className="block font-label text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant ml-1">Work Scope</label>
                  <textarea value={form.job_scope} onChange={e => set('job_scope', e.target.value)} placeholder="Describe the maintenance or repair work required..." className={cn(FIELD, "h-32")} />
                </div>
              </section>
            )}

            {/* Remarks */}
            <section className="bg-surface-container-lowest rounded-[2.5rem] p-8 kinetic-shadow space-y-2">
              <label className="block font-label text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant ml-1">Remarks</label>
              <textarea value={form.remarks} onChange={e => set('remarks', e.target.value)} placeholder="Additional notes or instructions..." className={cn(FIELD, "h-28")} />
            </section>

            {/* Important Note */}
            <section className="bg-error-container rounded-[2.5rem] p-8 kinetic-shadow border-l-4 border-error space-y-3">
              <p className="font-label text-[10px] font-bold uppercase tracking-[0.2em] text-on-error-container">Important Reminder</p>
              <p className="text-on-error-container italic leading-relaxed">
                For switching of car / car return for good, remember to return ALL customer's personal belongings when checking in. Take care to check the vehicle over so nothing is left behind.
              </p>
            </section>
          </div>

          {/* Preview card */}
          <aside className="lg:col-span-4 lg:sticky lg:top-28">
            <div className="bg-primary text-white rounded-[2.5rem] p-8 shadow-xl overflow-hidden relative">
              <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none"><Truck size={200} /></div>
              <p className="font-label text-[10px] uppercase tracking-[0.2em] font-bold opacity-60 mb-6">Preview</p>
              <div className="space-y-4">
                {[
                  { label: 'Job Number', value: jobMeta?.reference ?? 'Generating...' },
                  { label: 'Created', value: jobMeta ? new Date(jobMeta.createdAt).toLocaleDateString() : 'Generating...' },
                  { label: 'Type',     value: jobType },
                  { label: 'Company',  value: form.company || '---' },
                  { label: 'Date',     value: form.job_date || '---' },
                  { label: 'Vehicle',  value: vehiclePlate || '---' },
                  { label: 'Priority', value: form.priority },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-end border-b border-white/10 pb-3">
                    <span className="text-[10px] uppercase font-bold opacity-70">{label}</span>
                    <span className="font-headline font-bold text-sm truncate max-w-[130px]">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 w-full glass-panel border-t border-outline-variant/15 z-[70] px-6 py-4 md:py-5 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-6">
          <button onClick={() => navigate(-1)} className="text-on-surface-variant font-label font-bold uppercase text-[10px] tracking-[0.2em] hover:text-primary transition-colors">
            Discard
          </button>
          <button
            disabled={!form.vehicle_id || !form.company || (jobType === 'SHUTTLER' && !form.shuttlerSubType) || submitting}
            onClick={handleSubmit}
            className="flex-1 max-w-md gradient-btn py-5 rounded-2xl flex items-center justify-center gap-3 disabled:opacity-50"
          >
            <span className="font-label font-black uppercase tracking-[0.2em] text-sm">{submitting ? 'Submitting...' : 'Submit'}</span>
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
