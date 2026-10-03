'use client';

import { useState } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { IssueTypeSelector } from './IssueTypeSelector';
import {
  type IssueType,
  type SupportFormData,
  validateFormData,
  RESPONSE_TIMES,
  MAX_FILE_SIZE,
  ALLOWED_FILE_TYPES,
  MAX_FILES,
  generateReferenceNumber,
} from '@/lib/support';

interface SupportFormProps {
  userEmail?: string;
  onSuccess?: (referenceNumber: string) => void;
}

export function SupportForm({ userEmail = '', onSuccess }: SupportFormProps) {
  const [formData, setFormData] = useState<Partial<SupportFormData>>({
    type: undefined,
    subject: '',
    description: '',
    email: userEmail,
    attachments: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

  const handleTypeChange = (type: IssueType) => {
    setFormData((prev) => ({ ...prev, type }));
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.type;
      return newErrors;
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (files.length + attachedFiles.length > MAX_FILES) {
      setErrors((prev) => ({
        ...prev,
        attachments: `Maximum ${MAX_FILES} files allowed`,
      }));
      return;
    }

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        setErrors((prev) => ({
          ...prev,
          attachments: `File too large: ${file.name} (max 5MB)`,
        }));
        return;
      }

      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        setErrors((prev) => ({
          ...prev,
          attachments: `File type not allowed: ${file.name}. Allowed: JPEG, PNG, PDF, TXT`,
        }));
        return;
      }
    }

    const newFiles = [...attachedFiles, ...files];
    setAttachedFiles(newFiles);
    setFormData((prev) => ({ ...prev, attachments: newFiles }));
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.attachments;
      return newErrors;
    });
  };

  const removeFile = (index: number) => {
    const newFiles = attachedFiles.filter((_, i) => i !== index);
    setAttachedFiles(newFiles);
    setFormData((prev) => ({ ...prev, attachments: newFiles }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateFormData(formData);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Submit form data to API endpoint
      // For now, simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const referenceNumber = generateReferenceNumber();
      setFormData({
        type: undefined,
        subject: '',
        description: '',
        email: userEmail,
        attachments: [],
      });
      setAttachedFiles([]);
      setErrors({});

      if (onSuccess) {
        onSuccess(referenceNumber);
      }
    } catch (error) {
      setErrors({
        submit: 'Failed to submit form. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const responseTime = formData.type ? RESPONSE_TIMES[formData.type] : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Issue Type */}
      <IssueTypeSelector
        value={formData.type || ''}
        onChange={handleTypeChange}
        error={errors.type}
      />

      {/* Response Time */}
      {responseTime && (
        <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Expected Response:</span> {responseTime}
          </p>
        </div>
      )}

      {/* Subject */}
      <div>
        <label htmlFor="subject" className="block text-sm font-medium mb-2">
          Subject
        </label>
        <input
          type="text"
          id="subject"
          value={formData.subject || ''}
          onChange={(e) => handleInputChange('subject', e.target.value)}
          placeholder="Brief summary of your issue"
          maxLength={200}
          className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all ${
            errors.subject ? 'border-destructive' : 'border-border'
          }`}
        />
        <div className="flex justify-between mt-1">
          {errors.subject && <p className="text-sm text-destructive">{errors.subject}</p>}
          <p className="text-xs text-muted-foreground ml-auto">
            {(formData.subject || '').length}/200
          </p>
        </div>
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-2">
          Email Address
        </label>
        <input
          type="email"
          id="email"
          value={formData.email || ''}
          onChange={(e) => handleInputChange('email', e.target.value)}
          placeholder="your.email@example.com"
          className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all ${
            errors.email ? 'border-destructive' : 'border-border'
          }`}
        />
        {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-2">
          Description
        </label>
        <textarea
          id="description"
          value={formData.description || ''}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Please provide detailed information about your issue..."
          maxLength={5000}
          rows={6}
          className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none ${
            errors.description ? 'border-destructive' : 'border-border'
          }`}
        />
        <div className="flex justify-between mt-1">
          {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
          <p className="text-xs text-muted-foreground ml-auto">
            {(formData.description || '').length}/5000
          </p>
        </div>
      </div>

      {/* File Upload */}
      <div>
        <label className="block text-sm font-medium mb-2">Attachments (Optional)</label>
        <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
          <input
            type="file"
            multiple
            onChange={handleFileChange}
            disabled={isLoading}
            className="hidden"
            id="file-input"
            accept={ALLOWED_FILE_TYPES.join(',')}
          />
          <label htmlFor="file-input" className="cursor-pointer flex flex-col items-center gap-2">
            <Upload className="w-6 h-6 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Click to upload or drag and drop</p>
              <p className="text-xs text-muted-foreground mt-1">
                Max 5MB per file, up to {MAX_FILES} files (JPEG, PNG, PDF, TXT)
              </p>
            </div>
          </label>
        </div>

        {/* Attached Files */}
        {attachedFiles.length > 0 && (
          <div className="mt-4 space-y-2">
            {attachedFiles.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  disabled={isLoading}
                  className="ml-2 p-1 hover:bg-destructive/10 rounded transition-colors text-destructive"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {errors.attachments && <p className="text-sm text-destructive mt-2">{errors.attachments}</p>}
      </div>

      {/* Submit Error */}
      {errors.submit && (
        <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
          <p className="text-sm text-destructive">{errors.submit}</p>
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isLoading}
        className="w-full"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Submitting...
          </>
        ) : (
          'Submit Support Request'
        )}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        We will review your request and respond as soon as possible.
      </p>
    </form>
  );
}
