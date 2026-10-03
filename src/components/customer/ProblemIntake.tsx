'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Wrench, 
  Camera, 
  Video, 
  Mic, 
  MicOff, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles,
  Building,
  AlertCircle
} from 'lucide-react';
import { submitProblemIntakeAction } from '@/app/customer/actions';

interface PropertyOption {
  id: string;
  name: string;
  address?: string;
}

interface ProblemIntakeProps {
  properties?: PropertyOption[];
  onSubmitted?: (summary: string) => void;
  className?: string;
}

const COMMON_SYMPTOMS = [
  { label: 'Kitchen sink leak', category: 'Plumbing', icon: '💧' },
  { label: 'AC blowing warm air', category: 'HVAC', icon: '❄️' },
  { label: 'Breaker keeps tripping', category: 'Electrical', icon: '⚡' },
  { label: 'Running toilet', category: 'Plumbing', icon: '🚽' },
  { label: 'Oven won’t heat', category: 'Appliances', icon: '🔥' },
];

export function ProblemIntake({ properties = [], onSubmitted, className = '' }: ProblemIntakeProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [description, setDescription] = useState('');
  const [selectedPropertyId, setSelectedPropertyId] = useState(properties[0]?.id || '');
  const [photoCount, setPhotoCount] = useState(0);
  const [videoCount, setVideoCount] = useState(0);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceSeconds, setVoiceSeconds] = useState(0);
  const [detectedCategory, setDetectedCategory] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Dynamic symptom/intent detection
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setDescription(val);

    const lower = val.toLowerCase();
    if (lower.includes('leak') || lower.includes('water') || lower.includes('drain') || lower.includes('pipe') || lower.includes('toilet') || lower.includes('sink')) {
      setDetectedCategory('Plumbing');
    } else if (lower.includes('breaker') || lower.includes('spark') || lower.includes('wire') || lower.includes('outlet') || lower.includes('switch') || lower.includes('light')) {
      setDetectedCategory('Electrical');
    } else if (lower.includes('ac') || lower.includes('cold') || lower.includes('heat') || lower.includes('thermostat') || lower.includes('cooling') || lower.includes('fan')) {
      setDetectedCategory('HVAC & Cooling');
    } else if (lower.includes('fridge') || lower.includes('washer') || lower.includes('dryer') || lower.includes('oven') || lower.includes('dishwasher')) {
      setDetectedCategory('Appliances');
    } else {
      setDetectedCategory(null);
    }
  };

  const handleSymptomClick = (symptom: typeof COMMON_SYMPTOMS[0]) => {
    setDescription((prev) => (prev ? `${prev}. Also: ${symptom.label.toLowerCase()}` : symptom.label));
    setDetectedCategory(symptom.category);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setPhotoCount((prev) => prev + e.target.files!.length);
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setVideoCount((prev) => prev + e.target.files!.length);
    }
  };

  const toggleVoiceRecording = () => {
    if (isRecordingVoice) {
      setIsRecordingVoice(false);
    } else {
      setIsRecordingVoice(true);
      setVoiceSeconds(0);
      const interval = setInterval(() => {
        setVoiceSeconds((sec) => {
          if (sec >= 12) {
            clearInterval(interval);
            setIsRecordingVoice(false);
            return 12;
          }
          return sec + 1;
        });
      }, 1000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setStatusMessage({ type: 'error', text: 'Please describe what needs attention.' });
      return;
    }

    setStatusMessage(null);

    startTransition(async () => {
      try {
        const res = await submitProblemIntakeAction({
          inputText: description,
          propertyId: selectedPropertyId || undefined,
          detectedCategory: detectedCategory || undefined,
          hasMedia: photoCount > 0 || videoCount > 0 || voiceSeconds > 0,
        });

        if (res.success) {
          setStatusMessage({ type: 'success', text: 'Problem logged! Redirecting to expert confirmation...' });
          if (onSubmitted) {
            onSubmitted(description);
          }
          // Redirect to booking wizard with query
          const params = new URLSearchParams({
            problem: description,
            category: detectedCategory || 'General',
            ...(selectedPropertyId ? { propertyId: selectedPropertyId } : {}),
          });
          setTimeout(() => {
            router.push(`/customer/bookings/new?${params.toString()}`);
          }, 800);
        } else {
          setStatusMessage({ type: 'error', text: res.error || 'Failed to submit problem.' });
        }
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'An error occurred';
        setStatusMessage({ type: 'error', text: errorMsg });
      }
    });
  };

  return (
    <section 
      aria-labelledby="problem-intake-title"
      className={`bg-[#FFFEFA] border border-[#D9DED8] rounded-[20px] p-6 shadow-[0_4px_24px_rgba(24,33,31,0.03)] transition-all ${className}`}
    >
      {/* Visual Hook Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#7C8681] block mb-1">
            EXPRESS INTAKE · NO JARGON NEEDED
          </span>
          <h2 id="problem-intake-title" className="text-xl sm:text-2xl font-bold tracking-tight text-[#18211F]">
            Something needs fixing?
          </h2>
        </div>
        
        {detectedCategory && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#E2EEE9] text-[#176B5B] rounded-full text-xs font-semibold animate-in fade-in zoom-in-95 duration-200">
            <Sparkles className="w-3.5 h-3.5 text-[#176B5B]" />
            <span>AI matched: {detectedCategory}</span>
          </div>
        )}
      </div>

      <p className="text-sm text-[#5A6661] mb-5 leading-relaxed">
        Describe the symptom in everyday language. We diagnose the category, verify safety risks, and line up the right professional.
      </p>

      {/* Form Area */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Main Input Box */}
        <div className="relative border border-[#D9DED8] bg-[#F7F4EC] rounded-[16px] p-4 focus-within:border-[#176B5B] focus-within:ring-2 focus-within:ring-[#176B5B]/10 transition-all">
          <textarea
            value={description}
            onChange={handleDescriptionChange}
            rows={3}
            placeholder="e.g. Master shower water is draining very slowly, and there's a slight sulfur smell when cold water runs..."
            className="w-full bg-transparent border-0 outline-none text-[#18211F] placeholder-[#7C8681] text-sm leading-relaxed resize-none"
            aria-label="Describe what needs fixing"
          />

          {/* Media Attachments Strip */}
          <div className="flex items-center justify-between pt-3 mt-2 border-t border-[#D9DED8]/70 flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Photo Upload */}
              <label 
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-xs font-medium cursor-pointer border transition-colors ${
                  photoCount > 0 
                    ? 'bg-[#E2EEE9] text-[#176B5B] border-[#BCD4CC]' 
                    : 'bg-[#FFFEFA] text-[#5A6661] border-[#D9DED8] hover:border-[#BCD4CC] hover:text-[#18211F]'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>{photoCount > 0 ? `${photoCount} photo${photoCount > 1 ? 's' : ''}` : 'Add photo'}</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  multiple 
                  onChange={handlePhotoUpload} 
                  className="sr-only" 
                />
              </label>

              {/* Video Upload */}
              <label 
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-xs font-medium cursor-pointer border transition-colors ${
                  videoCount > 0 
                    ? 'bg-[#E2EEE9] text-[#176B5B] border-[#BCD4CC]' 
                    : 'bg-[#FFFEFA] text-[#5A6661] border-[#D9DED8] hover:border-[#BCD4CC] hover:text-[#18211F]'
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                <span>{videoCount > 0 ? `${videoCount} video` : 'Add video'}</span>
                <input 
                  type="file" 
                  accept="video/*" 
                  onChange={handleVideoUpload} 
                  className="sr-only" 
                />
              </label>

              {/* Voice Memo Button */}
              <button
                type="button"
                onClick={toggleVoiceRecording}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-xs font-medium border transition-colors ${
                  isRecordingVoice 
                    ? 'bg-[#FBE8E8] text-[#DC2626] border-[#F5B5B5] animate-pulse' 
                    : voiceSeconds > 0
                    ? 'bg-[#E2EEE9] text-[#176B5B] border-[#BCD4CC]'
                    : 'bg-[#FFFEFA] text-[#5A6661] border-[#D9DED8] hover:border-[#BCD4CC] hover:text-[#18211F]'
                }`}
              >
                {isRecordingVoice ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                <span>
                  {isRecordingVoice 
                    ? `Recording (${voiceSeconds}s)...` 
                    : voiceSeconds > 0 
                    ? `Voice note (${voiceSeconds}s)` 
                    : 'Voice memo'}
                </span>
              </button>
            </div>

            {/* Property Selector (if available) */}
            {properties.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-[#5A6661]">
                <Building className="w-3.5 h-3.5 text-[#7C8681]" />
                <select
                  value={selectedPropertyId}
                  onChange={(e) => setSelectedPropertyId(e.target.value)}
                  className="bg-transparent border-0 outline-none text-[#18211F] font-medium text-xs cursor-pointer hover:underline"
                  aria-label="Select property"
                >
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Quick-symptom Chips */}
        <div>
          <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#7C8681] block mb-2">
            COMMON IMMEDIATE ISSUES
          </span>
          <div className="flex flex-wrap gap-2">
            {COMMON_SYMPTOMS.map((sym, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSymptomClick(sym)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#D9DED8] bg-[#FFFEFA] hover:bg-[#F7F4EC] hover:border-[#176B5B]/40 text-xs text-[#18211F] transition-all"
              >
                <span>{sym.icon}</span>
                <span>{sym.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Status Alerts */}
        {statusMessage && (
          <div 
            className={`p-3 rounded-xl flex items-center gap-2.5 text-xs font-medium ${
              statusMessage.type === 'success'
                ? 'bg-[#E2EEE9] text-[#176B5B] border border-[#BCD4CC]'
                : 'bg-[#FBE8E8] text-[#DC2626] border border-[#F5B5B5]'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Primary Action Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isPending || !description.trim()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#176B5B] hover:bg-[#0D5144] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-[12px] shadow-[0_10px_24px_rgba(23,107,91,0.18)] hover:-translate-y-0.5 transition-all"
          >
            {isPending ? (
              <span>Reviewing your problem...</span>
            ) : (
              <>
                <span>Find verified expert</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  );
}
