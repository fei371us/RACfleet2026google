import { MouseEvent, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, ChevronRight, Plus, Search, Truck } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Job, InspectionPin } from '../types';

type PinType = InspectionPin['type'];

interface UiPin {
  id: string;
  x: number;
  y: number;
  type: PinType;
  note: string;
  photo_url?: string;
}

export default function VehicleExterior() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [job, setJob] = useState<Job | null>(null);
  const [pins, setPins] = useState<UiPin[]>([]);
  const [pinType, setPinType] = useState<PinType>('critical');
  const [saving, setSaving] = useState(false);
  const [busyPinId, setBusyPinId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/jobs/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setJob(data);
        const existingPins: UiPin[] = (data.pins || []).map((p: InspectionPin) => ({
          id: String(p.id ?? `${p.x}-${p.y}-${Math.random()}`),
          x: p.x,
          y: p.y,
          type: p.type,
          note: p.note || '',
          photo_url: p.photo_url,
        }));
        setPins(existingPins);
      });
  }, [id]);

  const handleAddPin = async (e: MouseEvent<HTMLDivElement>) => {
    if (!job || !id) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const tempId = `temp-${Date.now()}`;
    const newPin: UiPin = { id: tempId, x, y, type: pinType, note: '' };
    setPins((prev) => [...prev, newPin]);

    try {
      setSaving(true);
      const res = await fetch('/api/inspection/pins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: id,
          vehicle_id: job.vehicle_id,
          x,
          y,
          type: pinType,
          note: '',
          photo_url: '',
        }),
      });
      const saved = await res.json();
      setPins((prev) => prev.map((p) => (p.id === tempId ? { ...p, id: String(saved.id) } : p)));
    } catch (error) {
      setPins((prev) => prev.filter((p) => p.id !== tempId));
      console.error('Failed to save pin:', error);
    } finally {
      setSaving(false);
    }
  };

  const handlePinFieldChange = (pinId: string, field: keyof UiPin, value: string) => {
    setPins((prev) =>
      prev.map((p) =>
        p.id === pinId
          ? {
              ...p,
              [field]: value,
            }
          : p
      )
    );
  };

  const handleSavePin = async (pin: UiPin) => {
    try {
      setBusyPinId(pin.id);
      await fetch(`/api/inspection/pins/${pin.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: pin.type,
          note: pin.note,
          photo_url: pin.photo_url || '',
        }),
      });
    } catch (error) {
      console.error('Failed to save pin:', error);
    } finally {
      setBusyPinId(null);
    }
  };

  const handleDeletePin = async (pinId: string) => {
    try {
      setBusyPinId(pinId);
      await fetch(`/api/inspection/pins/${pinId}`, { method: 'DELETE' });
      setPins((prev) => prev.filter((p) => p.id !== pinId));
    } catch (error) {
      console.error('Failed to delete pin:', error);
    } finally {
      setBusyPinId(null);
    }
  };

  return (
    <div className="flex-1 pb-32">
      <header className="fixed top-0 z-50 w-full bg-surface-container-low/80 backdrop-blur-md flex justify-between items-center px-6 py-4 border-b border-outline-variant/10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="text-primary hover:bg-surface-container-highest transition-colors p-2 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-headline font-black text-lg tracking-tighter text-on-surface">KINETIC FLEET</h1>
        </div>
        <span className="font-headline font-bold tracking-tight text-xs uppercase text-primary">Vehicle Exterior</span>
      </header>

      <main className="pt-24 pb-12 px-4 md:px-8 max-w-5xl mx-auto space-y-8">
        <section>
          <p className="font-label text-xs uppercase tracking-widest text-secondary font-semibold">Step 2 of 4</p>
          <h2 className="font-headline font-extrabold text-3xl text-on-surface tracking-tight">Vehicle Exterior</h2>
          <p className="text-on-surface-variant text-sm">Tap the diagram to mark damage locations.</p>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-surface-container-lowest rounded-full p-8 relative shadow-sm border-none overflow-hidden">
            <div className="mb-4 flex gap-2">
              <button
                onClick={() => setPinType('critical')}
                className={`px-3 py-1 rounded-lg text-xs font-bold ${pinType === 'critical' ? 'bg-error text-white' : 'bg-surface-container-high text-on-surface-variant'}`}
              >
                Critical
              </button>
              <button
                onClick={() => setPinType('cosmetic')}
                className={`px-3 py-1 rounded-lg text-xs font-bold ${pinType === 'cosmetic' ? 'bg-secondary text-white' : 'bg-surface-container-high text-on-surface-variant'}`}
              >
                Cosmetic
              </button>
              <button
                onClick={() => setPinType('preexisting')}
                className={`px-3 py-1 rounded-lg text-xs font-bold ${pinType === 'preexisting' ? 'bg-primary text-white' : 'bg-surface-container-high text-on-surface-variant'}`}
              >
                Pre-existing
              </button>
            </div>

            <div className="relative aspect-[4/3] w-full flex items-center justify-center cursor-crosshair" onClick={handleAddPin}>
              <img
                alt="Vehicle Blueprint"
                className="w-full h-full object-contain opacity-40 mix-blend-multiply"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBCPK8U4X3BO89DX5hpyMyD9yzT44tcVG56DPPAZbL1W5dKiAO5LZGB5tSleEFTn9jIc5sNVflWoi1yKOATDrIh_L5ZdK9dkxvnknBL2atAu4lSb3XEzOWwVnYganntSDJdWGRJJYxD1P2WUrgB2a6MNwG85uf1elarGE7z9s7T7VwD2p3wC8zk-S4Mn_fLjm1pjqRh07JhzA73Uhy3Da6MQa4F7CjqSVGa8CmJHk60U8Qd_eupPecg64c9TuRdfCER6pVNH6NIMszR"
              />

              {pins.map((pin, index) => (
                <div
                  key={pin.id}
                  className={`absolute w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold border-2 border-white pointer-events-none shadow-lg transform -translate-x-1/2 -translate-y-1/2 ${
                    pin.type === 'critical' ? 'bg-error' : pin.type === 'cosmetic' ? 'bg-secondary' : 'bg-primary'
                  }`}
                  style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                >
                  {index + 1}
                </div>
              ))}

              <div className="absolute inset-0 grid grid-cols-6 grid-rows-6 pointer-events-none opacity-5">
                {[...Array(36)].map((_, i) => (
                  <div key={i} className="border-r border-b border-on-surface" />
                ))}
              </div>
            </div>

            <div className="absolute bottom-6 left-12 flex gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-highest rounded-lg text-xs font-bold text-on-surface-variant backdrop-blur-sm">
                <Search className="w-3.5 h-3.5" />
                PIN MODE ACTIVE
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/10">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-primary-container rounded-lg text-white">
                  <Truck className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-bold text-primary uppercase tracking-tighter">Unit #{job?.vehicle_id}</div>
                  <div className="font-headline font-bold text-on-surface">{job?.vehicle_name}</div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-on-surface-variant">License Plate</span>
                  <span className="font-mono font-bold">{job?.vehicle_plate}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-on-surface-variant">Job</span>
                  <span className="font-medium">{job?.id}</span>
                </div>
              </div>
            </div>

            <div className="bg-surface-container-highest rounded-xl p-5">
              <h3 className="text-xs font-bold uppercase tracking-widest text-on-tertiary-fixed-variant mb-4">Inspection Key</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-error" />
                  <span className="text-sm font-medium">Critical Damage</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-secondary" />
                  <span className="text-sm font-medium">Cosmetic / Minor</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <span className="text-sm font-medium">Pre-existing</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <section className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-headline font-bold text-xl flex items-center gap-2">
              Recorded Damages
              <span className="bg-error-container text-on-error-container text-xs px-2 py-0.5 rounded-full">{pins.length} Pins</span>
            </h3>
          </div>
          <div className="space-y-4">
            {pins.map((pin, index) => (
              <motion.div key={pin.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold">Pin {index + 1}</div>
                  <div className="text-xs uppercase text-on-surface-variant">{pin.type}</div>
                </div>
                <p className="text-sm text-on-surface-variant">Position: x {pin.x.toFixed(1)}%, y {pin.y.toFixed(1)}%</p>

                <div className="flex gap-2">
                  <button
                    onClick={() => handlePinFieldChange(pin.id, 'type', 'critical')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold ${pin.type === 'critical' ? 'bg-error text-white' : 'bg-surface-container-high text-on-surface-variant'}`}
                  >
                    Critical
                  </button>
                  <button
                    onClick={() => handlePinFieldChange(pin.id, 'type', 'cosmetic')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold ${pin.type === 'cosmetic' ? 'bg-secondary text-white' : 'bg-surface-container-high text-on-surface-variant'}`}
                  >
                    Cosmetic
                  </button>
                  <button
                    onClick={() => handlePinFieldChange(pin.id, 'type', 'preexisting')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold ${pin.type === 'preexisting' ? 'bg-primary text-white' : 'bg-surface-container-high text-on-surface-variant'}`}
                  >
                    Pre-existing
                  </button>
                </div>

                <textarea
                  value={pin.note}
                  onChange={(e) => handlePinFieldChange(pin.id, 'note', e.target.value)}
                  placeholder="Damage note"
                  className="w-full bg-surface-container-highest border border-outline-variant/20 rounded-xl p-3 text-sm"
                />

                <input
                  value={pin.photo_url || ''}
                  onChange={(e) => handlePinFieldChange(pin.id, 'photo_url', e.target.value)}
                  placeholder="Photo URL (optional)"
                  className="w-full bg-surface-container-highest border border-outline-variant/20 rounded-xl p-3 text-sm"
                />

                <div className="flex gap-2">
                  <button
                    onClick={() => handleSavePin(pin)}
                    disabled={busyPinId === pin.id}
                    className="flex-1 bg-primary text-white py-2 rounded-lg text-xs font-bold uppercase tracking-wider disabled:opacity-60"
                  >
                    {busyPinId === pin.id ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => handleDeletePin(pin.id)}
                    disabled={busyPinId === pin.id}
                    className="flex-1 bg-error/90 text-white py-2 rounded-lg text-xs font-bold uppercase tracking-wider disabled:opacity-60"
                  >
                    Delete
                  </button>
                </div>
              </motion.div>
            ))}
            {pins.length === 0 && (
              <div className="py-12 text-center text-on-surface-variant border-2 border-dashed border-outline-variant rounded-xl flex flex-col items-center gap-3">
                <Plus className="w-8 h-8 opacity-20" />
                <p className="font-medium">No damages recorded yet. Tap the diagram to begin.</p>
              </div>
            )}
          </div>
        </section>

        <div className="mt-12 flex flex-col items-center gap-4">
          <button
            onClick={() => navigate(`/driver/inspection/${id}`)}
            className="w-full md:w-80 bg-gradient-to-br from-primary to-primary-container text-white py-5 rounded-xl font-bold text-sm tracking-widest uppercase shadow-xl hover:shadow-primary/20 active:scale-95 transition-all group flex items-center justify-center gap-2"
          >
            Continue to Visual Damage Map
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
          <span className="text-xs font-medium text-on-surface-variant">{saving ? 'Saving pin...' : 'Pins are saved to job record.'}</span>
        </div>
      </main>
    </div>
  );
}
