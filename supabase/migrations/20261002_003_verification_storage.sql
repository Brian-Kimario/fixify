-- MIGRATION 20261002_003: verification-documents storage bucket
-- Phase 8: Professional Verification
-- Creates a private Supabase Storage bucket for verification documents
-- with RLS policies that allow:
--   • Professionals to upload their own documents (INSERT)
--   • Professionals to read their own documents (SELECT)
--   • Admins and support to read any document (SELECT)
-- No public access — all reads go through signed URLs.

-- ────────────────────────────────────────────────────────────────────────────
-- 1. Create bucket (private, not public)
-- ────────────────────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'verification-documents',
  'verification-documents',
  false,                          -- private bucket
  10485760,                       -- 10 MB max per file
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- ────────────────────────────────────────────────────────────────────────────
-- 2. Storage RLS policies
-- ────────────────────────────────────────────────────────────────────────────

-- Professionals can INSERT objects whose path starts with their own user_id
CREATE POLICY "professionals_upload_own_verification_documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'verification-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'professional'
  )
);

-- Professionals can SELECT (read) their own documents
CREATE POLICY "professionals_read_own_verification_documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'verification-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Admins and support can SELECT any verification document
CREATE POLICY "admins_read_all_verification_documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'verification-documents'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'support')
  )
);

-- Admins can DELETE documents (e.g. during cleanup after rejection)
CREATE POLICY "admins_delete_verification_documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'verification-documents'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
