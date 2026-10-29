'use client';

import { useId, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Upload } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  addJobMediaAction,
  createJobMediaUploadAction,
  discardJobMediaUploadAction,
} from '@/app/professional/actions';
import {
  JOB_MEDIA_KINDS,
  JOB_MEDIA_KIND_LABEL,
  JOB_MEDIA_MAX_BYTES,
  JOB_MEDIA_TYPES,
  type JobMediaKind,
} from '@/validators';

/**
 * Upload a photo or receipt to the private job-media bucket through a URL the server signs for
 * this job's professional, then attach it with add_job_media, which checks the object.
 */
export function JobMediaUploader({ jobId }: { jobId: string }) {
  const router = useRouter();
  const inputId = useId();
  const groupId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState<JobMediaKind | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function pick(next: File | null) {
    setError(null);
    if (next && !JOB_MEDIA_TYPES[next.type]) {
      setError('Use a JPG, PNG or WebP photo, or a PDF.');
      setFile(null);
      return;
    }
    if (next && next.size > JOB_MEDIA_MAX_BYTES) {
      setError('Files can be up to 10 MB.');
      setFile(null);
      return;
    }
    setFile(next);
  }

  function submit() {
    if (!kind) return setError('Choose what the file shows.');
    if (!file) return setError('Choose a file.');
    if (!JOB_MEDIA_TYPES[file.type]) return setError('Use a JPG, PNG or WebP photo, or a PDF.');
    setError(null);

    startTransition(async () => {
      const signed = await createJobMediaUploadAction({ jobId, contentType: file.type });
      if (signed.success === false) {
        setError(signed.error);
        return;
      }
      const { path, token } = signed.data;
      const { error: uploadError } = await createClient()
        .storage.from('job-media')
        .uploadToSignedUrl(path, token, file, { contentType: file.type });
      if (uploadError) {
        setError('The upload failed. Check your connection and try again.');
        return;
      }
      const result = await addJobMediaAction({ jobId, kind, storagePath: path });
      if (result.success === false) {
        // Best effort: an unattached upload is otherwise left for the job-media sweep.
        await discardJobMediaUploadAction({ jobId, storagePath: path });
        setError(result.error);
        return;
      }
      setFile(null);
      setKind(null);
      if (fileRef.current) fileRef.current.value = '';
      router.refresh();
    });
  }

  return (
    <div className="rounded-xl border border-dashed border-line-strong bg-porcelain p-4">
      <p id={groupId} className="text-xs text-ink-4">
        What does it show?
      </p>
      <div role="radiogroup" aria-labelledby={groupId} className="mt-2 flex flex-wrap gap-2">
        {JOB_MEDIA_KINDS.map((k) => (
          <button
            key={k}
            type="button"
            role="radio"
            aria-checked={kind === k}
            disabled={pending}
            onClick={() => setKind(k)}
            className={`min-h-11 rounded-full border px-3.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal disabled:opacity-50 ${
              kind === k ? 'border-teal bg-teal-soft font-semibold text-teal-deep' : 'border-line bg-paper text-ink-2 hover:border-line-strong'
            }`}
          >
            {JOB_MEDIA_KIND_LABEL[k]}
          </button>
        ))}
      </div>
      <label htmlFor={inputId} className="mt-3 block text-xs text-ink-4">
        Photo or PDF, up to 10 MB
      </label>
      <input
        id={inputId}
        ref={fileRef}
        type="file"
        accept={Object.keys(JOB_MEDIA_TYPES).join(',')}
        disabled={pending}
        onChange={(e) => pick(e.target.files?.[0] ?? null)}
        className="mt-1 block w-full text-sm text-ink-2 file:mr-3 file:min-h-11 file:rounded-xl file:border-0 file:bg-paper file:px-4 file:text-sm file:font-semibold file:text-teal"
      />
      <button
        type="button"
        onClick={submit}
        disabled={pending}
        aria-busy={pending}
        className="mt-3 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-teal px-4 text-sm font-semibold text-paper transition-colors hover:bg-teal-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 disabled:opacity-50"
      >
        <Upload className="h-4 w-4" aria-hidden="true" />
        {pending ? 'Uploading…' : 'Add to job'}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
