import { MouseEvent, PointerEvent, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Camera, Image as ImageIcon, Plus, Search, Truck } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Job, InspectionPin } from '../types';
import { api } from '../lib/api';

type PinType = InspectionPin['type'];

interface UiPin {
  id: string;
  x: number;
  y: number;
  type: PinType;
  note: string;
  photo_url?: string;
  photo_view_url?: string;
}

interface ExteriorCheckPayload {
  checkedBy: string;
  checkedSignature: string;
  receivedBy: string;
  receivedSignature: string;
  gps?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
}

export default function VehicleExterior() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [job, setJob] = useState<Job | null>(null);
  const [pins, setPins] = useState<UiPin[]>([]);
  const [pinType, setPinType] = useState<PinType>('critical');
  const [saving, setSaving] = useState(false);
  const [busyPinId, setBusyPinId] = useState<string | null>(null);
  const [uploadingPinId, setUploadingPinId] = useState<string | null>(null);
  const [checkedBy, setCheckedBy] = useState('');
  const [receivedBy, setReceivedBy] = useState('');
  const [checkedSignature, setCheckedSignature] = useState('');
  const [receivedSignature, setReceivedSignature] = useState('');
  const [drawingTarget, setDrawingTarget] = useState<'checked' | 'received' | null>(null);
  const [submittingCheck, setSubmittingCheck] = useState(false);
  const [submitMsg, setSubmitMsg] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [photoError, setPhotoError] = useState('');
  const [signedGps, setSignedGps] = useState<{ latitude: number; longitude: number; accuracy?: number } | null>(null);
  const [currentGps, setCurrentGps] = useState<{ latitude: number; longitude: number; accuracy?: number } | null>(null);
  const [gpsError, setGpsError] = useState('');
  const checkedCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const receivedCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const hydratedExteriorCheckRef = useRef(false);

  const drawSignatureImage = (canvas: HTMLCanvasElement | null, dataUrl: string) => {
    if (!canvas || !dataUrl) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = dataUrl;
  };

  const parseExteriorCheckFromRemarks = (remarks?: string): ExteriorCheckPayload | null => {
    const marker = '[EXTERIOR_CHECK]';
    if (!remarks || !remarks.includes(marker)) return null;
    const line = remarks
      .split('\n')
      .find((entry) => entry.trim().startsWith(marker));
    if (!line) return null;
    const encoded = line.trim().slice(marker.length);
    if (!encoded) return null;
    try {
      const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
      const json = atob(padded);
      const parsed = JSON.parse(json) as Partial<ExteriorCheckPayload>;
      if (!parsed.checkedBy || !parsed.receivedBy) return null;
      return {
        checkedBy: parsed.checkedBy,
        checkedSignature: parsed.checkedSignature ?? '',
        receivedBy: parsed.receivedBy,
        receivedSignature: parsed.receivedSignature ?? '',
        gps:
          parsed.gps && typeof parsed.gps.latitude === 'number' && typeof parsed.gps.longitude === 'number'
            ? {
                latitude: parsed.gps.latitude,
                longitude: parsed.gps.longitude,
                accuracy: typeof parsed.gps.accuracy === 'number' ? parsed.gps.accuracy : undefined,
              }
            : undefined,
      };
    } catch {
      return null;
    }
  };

  useEffect(() => {
    let cancelled = false;
    const loadJobAndPhotos = async () => {
      const data = await api.get<Job>(`/api/jobs/${id}`);
      if (cancelled) return;
      setJob(data);
      const existingPins: UiPin[] = (data.pins || []).map((p: InspectionPin) => ({
        id: String(p.id ?? `${p.x}-${p.y}-${Math.random()}`),
        x: p.x,
        y: p.y,
        type: p.type,
        note: p.note || '',
        photo_url: p.photo_url ?? p.photoUrl,
      }));
      setPins(existingPins);
      const existingExteriorCheck = parseExteriorCheckFromRemarks(data.remarks);
      if (existingExteriorCheck) {
        hydratedExteriorCheckRef.current = true;
        setCheckedBy(existingExteriorCheck.checkedBy);
        setReceivedBy(existingExteriorCheck.receivedBy);
        setCheckedSignature(existingExteriorCheck.checkedSignature);
        setReceivedSignature(existingExteriorCheck.receivedSignature);
        if (existingExteriorCheck.gps) setSignedGps(existingExteriorCheck.gps);
      }
      const pinIds = existingPins
        .map((p) => Number(p.id))
        .filter((n) => Number.isFinite(n) && n > 0);
      if (pinIds.length > 0) {
        const photoResponse = await api.post<{ urls: Record<string, string> }>('/api/inspection/pins/photo-urls', { pinIds });
        if (cancelled) return;
        setPins((prev) => prev.map((pin) => ({
          ...pin,
          photo_view_url: photoResponse.urls[pin.id] || pin.photo_view_url,
        })));
      }
    };
    loadJobAndPhotos().catch((error) => {
      console.error('Failed to load job/pin photos:', error);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!hydratedExteriorCheckRef.current) return;
    drawSignatureImage(checkedCanvasRef.current, checkedSignature);
  }, [checkedSignature]);

  useEffect(() => {
    if (!hydratedExteriorCheckRef.current) return;
    drawSignatureImage(receivedCanvasRef.current, receivedSignature);
  }, [receivedSignature]);

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
      const saved = await api.post<{ id: number }>('/api/inspection/pins', {
        job_id: job.job_db_id || id,
        vehicle_id: job.vehicleId,
        x,
        y,
        type: pinType,
        note: '',
        photo_url: '',
      });
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
    const numericId = Number(pin.id);
    if (!Number.isFinite(numericId) || numericId <= 0) return;
    try {
      setBusyPinId(pin.id);
      await api.patch(`/api/inspection/pins/${numericId}`, {
        type: pin.type,
        note: pin.note,
        photo_url: pin.photo_url || '',
      });
    } catch (error) {
      console.error('Failed to save pin:', error);
    } finally {
      setBusyPinId(null);
    }
  };

  const handleDeletePin = async (pinId: string) => {
    const numericId = Number(pinId);
    if (!Number.isFinite(numericId) || numericId <= 0) {
      setPins((prev) => prev.filter((p) => p.id !== pinId));
      return;
    }
    try {
      setBusyPinId(pinId);
      await api.delete(`/api/inspection/pins/${numericId}`);
      setPins((prev) => prev.filter((p) => p.id !== pinId));
    } catch (error) {
      console.error('Failed to delete pin:', error);
    } finally {
      setBusyPinId(null);
    }
  };

  const handlePhotoPicked = async (pinId: string, file: File | null) => {
    if (!file) return;
    const numericId = Number(pinId);
    if (!Number.isFinite(numericId) || numericId <= 0) return;
    const asDataUrl = () =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Failed to read image file.'));
        reader.readAsDataURL(file);
      });
    try {
      setPhotoError('');
      setUploadingPinId(pinId);
      const upload = await api.post<{ uploadUrl: string; blobPath: string }>(
        `/api/inspection/pins/${pinId}/photo-upload-url`,
        { fileName: file.name || `pin-${pinId}.jpg` }
      );

      const uploadResult = await fetch(upload.uploadUrl, {
        method: 'PUT',
        headers: {
          'x-ms-blob-type': 'BlockBlob',
          'Content-Type': file.type || 'image/jpeg',
        },
        body: file,
      });
      if (!uploadResult.ok) throw new Error('Upload to blob failed');

      const finalized = await api.post<{ photo_url: string; photo_view_url: string }>(
        `/api/inspection/pins/${pinId}/photo-finalize`,
        { blobPath: upload.blobPath }
      );
      setPins((prev) => prev.map((p) => (
        p.id === pinId
          ? { ...p, photo_url: finalized.photo_url, photo_view_url: finalized.photo_view_url }
          : p
      )));
    } catch (error) {
      // Fallback: persist image directly into SQL as data URL so reopen still works.
      try {
        const dataUrl = await asDataUrl();
        await api.patch(`/api/inspection/pins/${numericId}`, { photo_url: dataUrl });
        setPins((prev) => prev.map((p) => (
          p.id === pinId
            ? { ...p, photo_url: dataUrl, photo_view_url: dataUrl }
            : p
        )));
        setPhotoError('Blob upload failed; saved photo in database fallback.');
      } catch (fallbackErr) {
        console.error('Failed to upload/store pin photo:', error, fallbackErr);
        setPhotoError('Photo save failed. Please try again.');
      }
    } finally {
      setUploadingPinId(null);
    }
  };

  const getCanvasForTarget = (target: 'checked' | 'received') => (
    target === 'checked' ? checkedCanvasRef.current : receivedCanvasRef.current
  );

  const drawLineTo = (target: 'checked' | 'received', e: PointerEvent<HTMLCanvasElement>, isStart = false) => {
    const canvas = getCanvasForTarget(target);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (isStart) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      return;
    }
    ctx.lineTo(x, y);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };

  const handleSignStart = (target: 'checked' | 'received', e: PointerEvent<HTMLCanvasElement>) => {
    const canvas = getCanvasForTarget(target);
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);
    setDrawingTarget(target);
    drawLineTo(target, e, true);
  };

  const handleSignMove = (target: 'checked' | 'received', e: PointerEvent<HTMLCanvasElement>) => {
    if (drawingTarget !== target) return;
    drawLineTo(target, e);
  };

  const handleSignEnd = (target: 'checked' | 'received') => {
    if (drawingTarget !== target) return;
    setDrawingTarget(null);
    const canvas = getCanvasForTarget(target);
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    if (target === 'checked') setCheckedSignature(dataUrl);
    else setReceivedSignature(dataUrl);
  };

  const clearSignature = (target: 'checked' | 'received') => {
    const canvas = getCanvasForTarget(target);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (target === 'checked') setCheckedSignature('');
    else setReceivedSignature('');
  };

  const getCurrentLocation = () => new Promise<{ latitude: number; longitude: number; accuracy?: number }>((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported on this device/browser.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      () => reject(new Error('Unable to get GPS location. Please enable location permission.')),
      { enableHighAccuracy: true, timeout: 15000 }
    );
  });

  useEffect(() => {
    let cancelled = false;
    getCurrentLocation()
      .then((gps) => {
        if (cancelled) return;
        setCurrentGps(gps);
      })
      .catch((error) => {
        if (cancelled) return;
        setGpsError(error instanceof Error ? error.message : 'Unable to read current location.');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmitExteriorCheck = async () => {
    setSubmitError('');
    setSubmitMsg('');
    if (!checkedBy.trim() || !receivedBy.trim()) {
      setSubmitError('Please enter both Checked By and Received By.');
      return;
    }
    if (!checkedSignature || !receivedSignature) {
      setSubmitError('Please provide both signatures before submitting.');
      return;
    }
    try {
      setSubmittingCheck(true);
      const gps = await getCurrentLocation();
      await api.post(`/api/inspection/jobs/${id}/exterior-check`, {
        checkedBy: checkedBy.trim(),
        checkedSignature,
        receivedBy: receivedBy.trim(),
        receivedSignature,
        gps,
      });
      setSignedGps(gps);
      setCurrentGps(gps);
      setSubmitMsg('Submitted successfully with GPS location.');
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to submit exterior check.');
    } finally {
      setSubmittingCheck(false);
    }
  };

  return (
    <div className="flex-1 pb-32">
      <header className="fixed top-0 z-50 w-full bg-surface-container-low/80 backdrop-blur-md flex justify-between items-center px-6 py-4 border-b border-outline-variant/10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="text-primary hover:bg-surface-container-highest transition-colors p-2 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-headline font-black text-lg tracking-tighter text-on-surface">C&P Rent-A-Car FLEET</h1>
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
                  <div className="text-xs font-bold text-primary uppercase tracking-tighter">Unit #{job?.vehicleId}</div>
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

                {pin.photo_view_url && (
                  <img
                    src={pin.photo_view_url}
                    alt={`Pin ${index + 1} damage`}
                    className="w-full h-40 object-cover rounded-xl border border-outline-variant/20"
                  />
                )}

                <div className="grid grid-cols-2 gap-2">
                  <label className="cursor-pointer bg-surface-container-high text-on-surface py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2">
                    <Camera className="w-4 h-4" />
                    Take Photo
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => handlePhotoPicked(pin.id, e.target.files?.[0] ?? null)}
                    />
                  </label>
                  <label className="cursor-pointer bg-surface-container-high text-on-surface py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    Photo Library
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handlePhotoPicked(pin.id, e.target.files?.[0] ?? null)}
                    />
                  </label>
                </div>
                {uploadingPinId === pin.id && (
                  <p className="text-xs text-on-surface-variant">Uploading photo...</p>
                )}
                {photoError && <p className="text-xs text-error">{photoError}</p>}

                <div className="flex gap-2">
                  <button
                    onClick={() => handleSavePin(pin)}
                    disabled={busyPinId === pin.id || !Number.isFinite(Number(pin.id))}
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

        <section className="mt-12 bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/10 space-y-4">
          <h3 className="font-headline font-bold text-lg">Handover Confirmation</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Checked By</label>
              <input
                value={checkedBy}
                onChange={(e) => setCheckedBy(e.target.value)}
                className="w-full bg-surface-container-highest border border-outline-variant/20 rounded-xl p-3 text-sm"
                placeholder="Name"
              />
              <canvas
                ref={checkedCanvasRef}
                width={500}
                height={160}
                onPointerDown={(e) => handleSignStart('checked', e)}
                onPointerMove={(e) => handleSignMove('checked', e)}
                onPointerUp={() => handleSignEnd('checked')}
                onPointerLeave={() => handleSignEnd('checked')}
                className="w-full h-36 rounded-xl bg-white border border-outline-variant/20 touch-none"
              />
              <button onClick={() => clearSignature('checked')} className="text-xs text-primary font-bold">Clear Signature</button>
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Signed Location</p>
                {(signedGps || currentGps) ? (
                  <>
                    <iframe
                      title="Checked by signed location map"
                      className="w-full h-36 rounded-xl border border-outline-variant/20"
                      loading="lazy"
                      src={`https://www.google.com/maps?q=${(signedGps || currentGps)!.latitude},${(signedGps || currentGps)!.longitude}&z=16&output=embed`}
                    />
                    <p className="text-[10px] text-on-surface-variant">
                      {(signedGps || currentGps)!.latitude.toFixed(6)}, {(signedGps || currentGps)!.longitude.toFixed(6)}
                      {typeof (signedGps || currentGps)!.accuracy === 'number' ? ` (±${Math.round((signedGps || currentGps)!.accuracy!)}m)` : ''}
                    </p>
                  </>
                ) : (
                  <p className="text-[10px] text-on-surface-variant">{gpsError || 'Reading current location...'}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Received By</label>
              <input
                value={receivedBy}
                onChange={(e) => setReceivedBy(e.target.value)}
                className="w-full bg-surface-container-highest border border-outline-variant/20 rounded-xl p-3 text-sm"
                placeholder="Name"
              />
              <canvas
                ref={receivedCanvasRef}
                width={500}
                height={160}
                onPointerDown={(e) => handleSignStart('received', e)}
                onPointerMove={(e) => handleSignMove('received', e)}
                onPointerUp={() => handleSignEnd('received')}
                onPointerLeave={() => handleSignEnd('received')}
                className="w-full h-36 rounded-xl bg-white border border-outline-variant/20 touch-none"
              />
              <button onClick={() => clearSignature('received')} className="text-xs text-primary font-bold">Clear Signature</button>
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Signed Location</p>
                {(signedGps || currentGps) ? (
                  <>
                    <iframe
                      title="Received by signed location map"
                      className="w-full h-36 rounded-xl border border-outline-variant/20"
                      loading="lazy"
                      src={`https://www.google.com/maps?q=${(signedGps || currentGps)!.latitude},${(signedGps || currentGps)!.longitude}&z=16&output=embed`}
                    />
                    <p className="text-[10px] text-on-surface-variant">
                      {(signedGps || currentGps)!.latitude.toFixed(6)}, {(signedGps || currentGps)!.longitude.toFixed(6)}
                      {typeof (signedGps || currentGps)!.accuracy === 'number' ? ` (±${Math.round((signedGps || currentGps)!.accuracy!)}m)` : ''}
                    </p>
                  </>
                ) : (
                  <p className="text-[10px] text-on-surface-variant">{gpsError || 'Reading current location...'}</p>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={handleSubmitExteriorCheck}
            disabled={submittingCheck}
            className="w-full bg-primary text-white py-3 rounded-xl font-bold text-xs uppercase tracking-widest disabled:opacity-60"
          >
            {submittingCheck ? 'Submitting with GPS...' : 'Submit Handover (Save GPS)'}
          </button>
          {submitMsg && <p className="text-xs text-green-700 font-semibold">{submitMsg}</p>}
          {submitError && <p className="text-xs text-error font-semibold">{submitError}</p>}
          <span className="text-xs font-medium text-on-surface-variant">{saving ? 'Saving pin...' : 'Pins are saved to job record.'}</span>
        </section>
      </main>
    </div>
  );
}
