'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
 loadImage,
 processImage,
 generateThumbnail,
 canvasToBlob,
 uploadToS3,
 type CropRect,
} from '@/lib/image-processing';
import { MAX_FILE_SIZE_BYTES, ACCEPTED_IMAGE_TYPES } from '@/lib/constants';
import {
 computeCalibration,
 SCANNER_PRESETS,
 type CalibrationMethod,
 type ScannerPreset,
} from '@/lib/fabric-calibration';

interface FabricUploadDialogProps {
 isOpen: boolean;
 onClose: () => void;
 onUploaded: () => void;
}

type UploadStep = 'pick' | 'process' | 'calibrate' | 'uploading';

export function FabricUploadDialog({ isOpen, onClose, onUploaded }: FabricUploadDialogProps) {
 const [step, setStep] = useState<UploadStep>('pick');
 const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
 const [fileName, setFileName] = useState('');
 const [fabricName, setFabricName] = useState('');
 const [manufacturer, setManufacturer] = useState('');
 const [scale, setScale] = useState(1.0);
 const [rotation, setRotation] = useState(0);
 const [crop, setCrop] = useState<CropRect | null>(null);
 const [error, setError] = useState('');
 const [uploadProgress, setUploadProgress] = useState('');
 const [calibrationMethod, setCalibrationMethod] = useState<CalibrationMethod>('scanner-preset');
 const [manualDpi, setManualDpi] = useState(300);
 const [rulerPixels, setRulerPixels] = useState(0);
 const [rulerInches, setRulerInches] = useState(0);
 const [scannerPreset, setScannerPreset] = useState<ScannerPreset>('300');
 const [calibratedPpi, setCalibratedPpi] = useState<number | null>(null);

 const canvasRef = useRef<HTMLCanvasElement>(null);
 const imgRef = useRef<HTMLImageElement | null>(null);

 const reset = useCallback(() => {
 setStep('pick');
 setImageDataUrl(null);
 setFileName('');
 setFabricName('');
 setManufacturer('');
 setScale(1.0);
 setRotation(0);
 setCrop(null);
 setError('');
 setUploadProgress('');
 setCalibrationMethod('scanner-preset');
 setManualDpi(300);
 setRulerPixels(0);
 setRulerInches(0);
 setScannerPreset('300');
 setCalibratedPpi(null);
 imgRef.current = null;
 }, []);

 useEffect(() => {
 if (!isOpen) reset();
 }, [isOpen, reset]);

 // Draw preview whenever params change
 useEffect(() => {
 if (!canvasRef.current || !imgRef.current || step !== 'process') return;

 const canvas = canvasRef.current;
 const ctx = canvas.getContext('2d');
 if (!ctx) return;

 const img = imgRef.current;
 const processed = processImage(img, { crop, scale, rotation });

 canvas.width = Math.min(processed.width, 400);
 canvas.height = Math.min(processed.height, 400);

 const drawScale = Math.min(canvas.width / processed.width, canvas.height / processed.height);
 const drawW = processed.width * drawScale;
 const drawH = processed.height * drawScale;

 ctx.clearRect(0, 0, canvas.width, canvas.height);
 ctx.drawImage(processed, (canvas.width - drawW) / 2, (canvas.height - drawH) / 2, drawW, drawH);
 }, [crop, scale, rotation, step]);

 const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
 setError('');
 const file = e.target.files?.[0];
 if (!file) return;

 if (!ACCEPTED_IMAGE_TYPES.includes(file.type as (typeof ACCEPTED_IMAGE_TYPES)[number])) {
 setError('Accepted file types: JPEG, PNG, WebP.');
 return;
 }

 if (file.size > MAX_FILE_SIZE_BYTES) {
 setError('File must be under 10MB.');
 return;
 }

 const reader = new FileReader();
 reader.onload = async () => {
 const dataUrl = reader.result as string;
 setImageDataUrl(dataUrl);
 setFileName(file.name);
 setFabricName(file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '));

 try {
 const img = await loadImage(dataUrl);
 imgRef.current = img;
 setStep('process');
 } catch {
 setError('Failed to load image.');
 }
 };
 reader.readAsDataURL(file);
 }, []);

 const handleUpload = useCallback(async () => {
 if (!imgRef.current || !fabricName.trim()) {
 setError('Please enter a fabric name.');
 return;
 }

 setStep('uploading');
 setError('');

 try {
 const img = imgRef.current;

 // Process the image
 setUploadProgress('Processing image...');
 const processed = processImage(img, { crop, scale, rotation });

 // Generate thumbnail
 setUploadProgress('Generating thumbnail...');
 const thumbnail = generateThumbnail(processed);

 // Get blobs
 const [imageBlob, thumbBlob] = await Promise.all([
 canvasToBlob(processed, 'image/jpeg', 0.85),
 canvasToBlob(thumbnail, 'image/jpeg', 0.8),
 ]);

 // Get presigned URLs
 setUploadProgress('Preparing upload...');
 const [imageUrlRes, thumbUrlRes] = await Promise.all([
 fetch('/api/upload/presigned-url', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 filename: fileName,
 contentType: 'image/jpeg',
 purpose: 'fabric',
 }),
 }),
 fetch('/api/upload/presigned-url', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 filename: `thumb-${fileName}`,
 contentType: 'image/jpeg',
 purpose: 'thumbnail',
 }),
 }),
 ]);

 const imageUrlData = await imageUrlRes.json();
 const thumbUrlData = await thumbUrlRes.json();

 if (!imageUrlRes.ok || !thumbUrlRes.ok) {
 throw new Error(imageUrlData.error ?? thumbUrlData.error ?? 'Failed to get upload URLs');
 }

 // Upload to S3
 setUploadProgress('Uploading fabric image...');
 await uploadToS3(imageUrlData.data.uploadUrl, imageBlob, 'image/jpeg');

 setUploadProgress('Uploading thumbnail...');
 await uploadToS3(thumbUrlData.data.uploadUrl, thumbBlob, 'image/jpeg');

 // Save fabric record
 setUploadProgress('Saving fabric...');
 const saveRes = await fetch('/api/fabrics', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 name: fabricName.trim(),
 imageUrl: imageUrlData.data.publicUrl,
 thumbnailUrl: thumbUrlData.data.publicUrl,
 manufacturer: manufacturer.trim() || undefined,
 scaleX: scale,
 scaleY: scale,
 rotation,
 ...(calibratedPpi != null ? { ppi: calibratedPpi, calibrated: true } : {}),
 }),
 });

 if (!saveRes.ok) {
 const saveData = await saveRes.json();
 throw new Error(saveData.error ?? 'Failed to save fabric');
 }

 onUploaded();
 onClose();
 } catch (err) {
 setError(err instanceof Error ? err.message : 'Upload failed');
 setStep('process');
 }
 }, [
 crop,
 scale,
 rotation,
 fabricName,
 manufacturer,
 fileName,
 calibratedPpi,
 onUploaded,
 onClose,
 ]);

 if (!isOpen) return null;

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2d2a26]/40">
 <div className="w-full max-w-lg rounded-lg bg-[#fdfaf7] p-6 shadow-[0_1px_2px_rgba(45,42,38,0.08)] border border-[#e8e1da]">
 <div className="flex items-center justify-between mb-4">
 <h2 className="text-lg font-semibold text-[#2d2a26]">Import Fabric</h2>
 <button type="button" onClick={onClose} className="text-[#6b655e] hover:text-[#2d2a26]">
 ✕
 </button>
 </div>

 {error && (
 <div className="mb-3 rounded-lg bg-[#ffc7c7]/5 px-3 py-2 text-sm text-[#ffc7c7]">{error}</div>
 )}

 {step === 'pick' && (
 <div className="text-center py-8">
 <p className="text-sm text-[#6b655e] mb-4">
 Select a fabric image (JPEG, PNG, or WebP, max 10MB)
 </p>
 <label className="inline-block rounded-lg bg-[#2d2a26] px-4 py-2 text-sm font-medium text-[#2d2a26] hover:opacity-90 cursor-pointer">
 Choose File
 <input
 type="file"
 accept=".jpg,.jpeg,.png,.webp"
 onChange={handleFileSelect}
 className="hidden"
 />
 </label>
 </div>
 )}

 {step === 'process' && imageDataUrl && (
 <div>
 {/* Preview */}
 <div className="mb-4 flex justify-center bg-[#fdfaf7] rounded-lg p-2">
 <canvas ref={canvasRef} className="max-h-[300px] max-w-full" />
 </div>

 {/* Controls */}
 <div className="space-y-3 mb-4">
 <div>
 <label className="block text-xs font-medium text-[#6b655e] mb-1">
 Fabric Name *
 </label>
 <input
 type="text"
 value={fabricName}
 onChange={(e) => setFabricName(e.target.value)}
 maxLength={255}
 className="w-full rounded-lg border border-[#e8e1da] bg-[#fdfaf7] px-3 py-1.5 text-sm text-[#2d2a26] focus:border-[#ff8d49] focus:outline-none"
 />
 </div>

 <div>
 <label className="block text-xs font-medium text-[#6b655e] mb-1">
 Manufacturer
 </label>
 <input
 type="text"
 value={manufacturer}
 onChange={(e) => setManufacturer(e.target.value)}
 maxLength={255}
 placeholder="e.g. Robert Kaufman"
 className="w-full rounded-lg border border-[#e8e1da] bg-[#fdfaf7] px-3 py-1.5 text-sm text-[#2d2a26] placeholder:text-[#6b655e] focus:border-[#ff8d49] focus:outline-none"
 />
 </div>

 <div>
 <label className="block text-xs font-medium text-[#6b655e] mb-1">
 Scale: {Math.round(scale * 100)}%
 </label>
 <input
 type="range"
 min={50}
 max={200}
 value={scale * 100}
 onChange={(e) => setScale(Number(e.target.value) / 100)}
 className="w-full accent-[#ff8d49]"
 />
 </div>

 <div>
 <label className="block text-xs font-medium text-[#6b655e] mb-1">
 Straighten: {rotation}°
 </label>
 <input
 type="range"
 min={-45}
 max={45}
 value={rotation}
 onChange={(e) => setRotation(Number(e.target.value))}
 className="w-full accent-[#ff8d49]"
 />
 </div>

 <div>
 <label className="block text-xs font-medium text-[#6b655e] mb-1">Crop</label>
 <div className="flex gap-2">
 <button
 type="button"
 onClick={() => setCrop(null)}
 className={`rounded-lg px-3 py-1 text-xs ${crop === null
 ? 'bg-[#2d2a26] text-[#2d2a26]'
 : 'bg-[#fdfaf7] text-[#6b655e] hover:bg-[#e8e1da]'
 }`}
 >
 Full Image
 </button>
 <button
 type="button"
 onClick={() => {
 if (!imgRef.current) return;
 const img = imgRef.current;
 const size = Math.min(img.naturalWidth, img.naturalHeight);
 const x = (img.naturalWidth - size) / 2;
 const y = (img.naturalHeight - size) / 2;
 setCrop({ x, y, width: size, height: size });
 }}
 className={`rounded-lg px-3 py-1 text-xs ${crop !== null
 ? 'bg-[#2d2a26] text-[#2d2a26]'
 : 'bg-[#fdfaf7] text-[#6b655e] hover:bg-[#e8e1da]'
 }`}
 >
 Square Crop
 </button>
 </div>
 </div>
 </div>

 {/* Actions */}
 <div className="flex gap-2 justify-end">
 <button
 type="button"
 onClick={reset}
 className="rounded-lg px-4 py-2 text-sm text-[#6b655e] hover:bg-[#fdfaf7]"
 >
 Back
 </button>
 <button
 type="button"
 onClick={() => setStep('calibrate')}
 disabled={!fabricName.trim()}
 className="rounded-lg bg-[#2d2a26] px-4 py-2 text-sm font-medium text-[#2d2a26] hover:opacity-90 disabled:opacity-50"
 >
 Next: Calibrate
 </button>
 </div>
 </div>
 )}

 {step === 'calibrate' && (
 <div className="space-y-4">
 <p className="text-sm text-[#6b655e]">
 Calibrate the scale so fabric prints at the correct physical size.
 </p>

 <div className="space-y-2">
 {[
 { value: 'scanner-preset' as const, label: 'Standard Scanner DPI' },
 { value: 'manual-dpi' as const, label: 'I Know the DPI' },
 { value: 'ruler-reference' as const, label: 'Use Ruler Reference' },
 ].map((opt) => (
 <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
 <input
 type="radio"
 name="calibration-method"
 value={opt.value}
 checked={calibrationMethod === opt.value}
 onChange={() => setCalibrationMethod(opt.value)}
 className="accent-[#ff8d49]"
 />
 <span className="text-sm text-[#2d2a26]">{opt.label}</span>
 </label>
 ))}
 </div>

 {calibrationMethod === 'scanner-preset' && (
 <div>
 <label className="block text-xs font-medium text-[#6b655e] mb-1">
 Scanner Resolution
 </label>
 <select
 value={scannerPreset}
 onChange={(e) => setScannerPreset(e.target.value as ScannerPreset)}
 className="w-full rounded-lg border border-[#e8e1da] bg-[#fdfaf7] px-3 py-1.5 text-sm text-[#2d2a26]"
 >
 {SCANNER_PRESETS.map((p) => (
 <option key={p} value={p}>
 {p} DPI
 </option>
 ))}
 </select>
 </div>
 )}

 {calibrationMethod === 'manual-dpi' && (
 <div>
 <label className="block text-xs font-medium text-[#6b655e] mb-1">
 DPI (72-1200)
 </label>
 <input
 type="number"
 min={72}
 max={1200}
 value={manualDpi}
 onChange={(e) => setManualDpi(Number(e.target.value))}
 className="w-full rounded-lg border border-[#e8e1da] bg-[#fdfaf7] px-3 py-1.5 text-sm text-[#2d2a26]"
 />
 </div>
 )}

 {calibrationMethod === 'ruler-reference' && (
 <div className="space-y-2">
 <div>
 <label className="block text-xs font-medium text-[#6b655e] mb-1">
 Ruler length in pixels
 </label>
 <input
 type="number"
 min={1}
 value={rulerPixels}
 onChange={(e) => setRulerPixels(Number(e.target.value))}
 className="w-full rounded-lg border border-[#e8e1da] bg-[#fdfaf7] px-3 py-1.5 text-sm text-[#2d2a26]"
 />
 </div>
 <div>
 <label className="block text-xs font-medium text-[#6b655e] mb-1">
 Ruler length in inches
 </label>
 <input
 type="number"
 min={0.1}
 step={0.1}
 value={rulerInches}
 onChange={(e) => setRulerInches(Number(e.target.value))}
 className="w-full rounded-lg border border-[#e8e1da] bg-[#fdfaf7] px-3 py-1.5 text-sm text-[#2d2a26]"
 />
 </div>
 </div>
 )}

 <div className="flex gap-2 justify-end pt-2">
 <button
 type="button"
 onClick={() => setStep('process')}
 className="rounded-lg px-4 py-2 text-sm text-[#6b655e] hover:bg-[#fdfaf7]"
 >
 Back
 </button>
 <button
 type="button"
 onClick={() => {
 setCalibratedPpi(null);
 handleUpload();
 }}
 className="rounded-lg px-4 py-2 text-sm text-[#6b655e] hover:bg-[#fdfaf7]"
 >
 Skip Calibration
 </button>
 <button
 type="button"
 onClick={() => {
 const result = computeCalibration({
 method: calibrationMethod,
 manualDpi: calibrationMethod === 'manual-dpi' ? manualDpi : undefined,
 rulerLengthPixels:
 calibrationMethod === 'ruler-reference' ? rulerPixels : undefined,
 rulerLengthInches:
 calibrationMethod === 'ruler-reference' ? rulerInches : undefined,
 scannerPreset:
 calibrationMethod === 'scanner-preset' ? scannerPreset : undefined,
 });
 if (result) {
 setCalibratedPpi(result.ppi);
 handleUpload();
 } else {
 setError('Invalid calibration input. Check your values.');
 }
 }}
 className="rounded-lg bg-[#2d2a26] px-4 py-2 text-sm font-medium text-[#2d2a26] hover:opacity-90"
 >
 Calibrate & Upload
 </button>
 </div>
 </div>
 )}

 {step === 'uploading' && (
 <div className="py-8 text-center">
 <div className="w-8 h-8 border-2 border-[#ff8d49] border-t-transparent rounded-full animation-spinner mx-auto mb-3" />
 <p className="text-sm text-[#6b655e]">{uploadProgress}</p>
 </div>
 )}
 </div>
 </div>
 );
}
