export type IssueType = 'booking' | 'payment' | 'professional' | 'account' | 'other';

export interface SupportTicket {
  id: string;
  type: IssueType;
  subject: string;
  description: string;
  email: string;
  attachments?: Array<{
    name: string;
    url: string;
  }>;
  status: 'submitted' | 'in-review' | 'resolved';
  createdAt: Date;
}

export interface SupportFormData {
  type: IssueType;
  subject: string;
  description: string;
  email: string;
  attachments?: File[];
}

export const ISSUE_TYPES: Record<IssueType, { label: string; description: string }> = {
  booking: {
    label: 'Booking Issue',
    description: 'Problems with scheduling or rescheduling appointments',
  },
  payment: {
    label: 'Payment Issue',
    description: 'Problems with billing, invoices, or payment processing',
  },
  professional: {
    label: 'Professional Concern',
    description: 'Issues with professional conduct or service quality',
  },
  account: {
    label: 'Account Issue',
    description: 'Problems with login, profile, or account settings',
  },
  other: {
    label: 'Other',
    description: 'Something else not listed above',
  },
};

export const RESPONSE_TIMES: Record<IssueType, string> = {
  booking: 'We will respond within 2 hours',
  payment: 'We will respond within 1 hour',
  professional: 'We will respond within 4 hours',
  account: 'We will respond within 2 hours',
  other: 'We will respond within 24 hours',
};

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf', 'text/plain'];
export const MAX_FILES = 3;

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
  return emailRegex.test(email);
};

export const validateFormData = (
  data: Partial<SupportFormData>,
): { valid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  if (!data.type || !ISSUE_TYPES[data.type]) {
    errors.type = 'Please select an issue type';
  }

  if (!data.subject || data.subject.trim().length === 0) {
    errors.subject = 'Subject is required';
  } else if (data.subject.length > 200) {
    errors.subject = 'Subject must be 200 characters or less';
  }

  if (!data.description || data.description.trim().length === 0) {
    errors.description = 'Description is required';
  } else if (data.description.length < 10) {
    errors.description = 'Description must be at least 10 characters';
  } else if (data.description.length > 5000) {
    errors.description = 'Description must be 5000 characters or less';
  }

  if (!data.email || !validateEmail(data.email)) {
    errors.email = 'Please provide a valid email address';
  }

  if (data.attachments) {
    if (data.attachments.length > MAX_FILES) {
      errors.attachments = `Maximum ${MAX_FILES} files allowed`;
    }

    for (const file of data.attachments) {
      if (file.size > MAX_FILE_SIZE) {
        errors.attachments = `File size must not exceed 5MB (${file.name})`;
        break;
      }

      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        errors.attachments = `File type not allowed (${file.name}). Allowed: JPEG, PNG, PDF, TXT`;
        break;
      }
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};

export const generateReferenceNumber = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `FX-${timestamp}-${random}`;
};
