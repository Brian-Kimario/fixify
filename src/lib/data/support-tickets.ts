/**
 * Support Ticket System Data & Types
 * Internal support team workspace for managing customer issues
 */

export type TicketStatus = 'open' | 'in-progress' | 'waiting-customer' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'normal' | 'high' | 'critical';
export type TicketCategory = 'booking' | 'payment' | 'professional' | 'account' | 'technical' | 'other';

export interface SupportTicket {
  id: string;
  ticketNumber: string; // e.g., "TKT-001234"
  customerId: string;
  customerName: string;
  customerEmail: string;
  category: TicketCategory;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  relatedJobId?: string;
  relatedRequestId?: string;
  createdAt: Date;
  updatedAt: Date;
  assignedTo?: string; // Support team member name
  responses: TicketResponse[];
  notes: InternalNote[];
  tags: string[];
}

export interface TicketResponse {
  id: string;
  authorId: string; // Support team member
  authorName: string;
  message: string;
  attachments?: string[];
  isInternal: boolean; // Only visible to support team if true
  createdAt: Date;
}

export interface InternalNote {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: Date;
}

export interface SupportMetrics {
  openTickets: number;
  avgResponseTime: number; // minutes
  avgResolutionTime: number; // minutes
  resolutionRate: number; // percentage
  escalationRate: number; // percentage
}

// Mock data for demonstration
export const MOCK_SUPPORT_TICKETS: SupportTicket[] = [
  {
    id: 'ticket-001',
    ticketNumber: 'TKT-001001',
    customerId: 'cust-001',
    customerName: 'Alex Johnson',
    customerEmail: 'alex@example.com',
    category: 'booking',
    subject: 'Professional did not arrive at scheduled time',
    description:
      'I had a booking for plumbing service scheduled for yesterday at 2:00 PM. The professional (Sarah Chen) never arrived or contacted me. I tried calling the support number but got no response.',
    status: 'open',
    priority: 'high',
    relatedJobId: 'FX-8492',
    createdAt: new Date('2026-09-26T10:30:00'),
    updatedAt: new Date('2026-09-26T10:30:00'),
    assignedTo: 'Support Team A',
    responses: [
      {
        id: 'resp-001',
        authorId: 'support-001',
        authorName: 'Jamie Chen',
        message:
          'Thank you for reporting this issue. I apologize for the inconvenience. I\'ve checked with Sarah Chen and there was a miscommunication about the appointment time. We\'re arranging an alternative time that works for you. Can you confirm your availability for today at 4:00 PM?',
        isInternal: false,
        createdAt: new Date('2026-09-26T11:15:00'),
      },
    ],
    notes: [
      {
        id: 'note-001',
        authorId: 'support-001',
        authorName: 'Jamie Chen',
        content: 'Professional confirmed different time slot. Need customer confirmation.',
        createdAt: new Date('2026-09-26T11:15:00'),
      },
    ],
    tags: ['no-show', 'professional-issue', 'rescheduling'],
  },
  {
    id: 'ticket-002',
    ticketNumber: 'TKT-001002',
    customerId: 'cust-002',
    customerName: 'Jordan Lee',
    customerEmail: 'jordan@example.com',
    category: 'payment',
    subject: 'Payment processing error - charged twice',
    description:
      'I was charged twice for the same electrical service. I received two separate invoices for job FX-8495 completed on Sept 25. First charge was £450, second charge was also £450. Please refund the duplicate charge.',
    status: 'in-progress',
    priority: 'critical',
    relatedJobId: 'FX-8495',
    createdAt: new Date('2026-09-25T14:20:00'),
    updatedAt: new Date('2026-09-26T09:45:00'),
    assignedTo: 'Support Team B',
    responses: [
      {
        id: 'resp-002',
        authorId: 'support-002',
        authorName: 'Alex Shah',
        message:
          'I sincerely apologize for this error. I\'ve identified a system glitch that caused duplicate charges. I\'m processing an immediate refund of £450 to your original payment method. You should see it within 2-3 business days.',
        isInternal: false,
        createdAt: new Date('2026-09-26T09:45:00'),
      },
    ],
    notes: [
      {
        id: 'note-002',
        authorId: 'support-002',
        authorName: 'Alex Shah',
        content: 'Refund initiated. Ticket #REF-0925-001. Monitor for customer confirmation.',
        createdAt: new Date('2026-09-26T09:45:00'),
      },
      {
        id: 'note-003',
        authorId: 'support-002',
        authorName: 'Alex Shah',
        content: 'Flag to engineering: Check payment processing logs for Sept 25 window.',
        createdAt: new Date('2026-09-26T09:50:00'),
      },
    ],
    tags: ['billing-error', 'refund', 'urgent', 'system-issue'],
  },
  {
    id: 'ticket-003',
    ticketNumber: 'TKT-001003',
    customerId: 'cust-003',
    customerName: 'Pat Martinez',
    customerEmail: 'pat@example.com',
    category: 'professional',
    subject: 'Dispute over material charges in quote',
    description:
      'The professional (Priya Patel) added a material charge of £85 for "additional fittings" without prior discussion. This was not in the initial quote. The work was completed but I believe this charge is unjustified.',
    status: 'waiting-customer',
    priority: 'normal',
    relatedJobId: 'FX-8480',
    createdAt: new Date('2026-09-24T16:10:00'),
    updatedAt: new Date('2026-09-26T08:20:00'),
    assignedTo: 'Support Team C',
    responses: [
      {
        id: 'resp-003',
        authorId: 'support-003',
        authorName: 'Casey Wong',
        message:
          'Thank you for bringing this to our attention. I\'ve reviewed the quote and job details. While the additional fittings were necessary for proper installation, they should have been approved first. I\'m requesting that the professional provide itemized documentation of materials used.',
        isInternal: false,
        createdAt: new Date('2026-09-25T10:30:00'),
      },
    ],
    notes: [
      {
        id: 'note-004',
        authorId: 'support-003',
        authorName: 'Casey Wong',
        content: 'Awaiting customer approval of solution. Professional to provide material invoice.',
        createdAt: new Date('2026-09-25T10:30:00'),
      },
    ],
    tags: ['quote-dispute', 'material-charge', 'waiting-customer'],
  },
  {
    id: 'ticket-004',
    ticketNumber: 'TKT-001004',
    customerId: 'cust-004',
    customerName: 'Elena Rostova',
    customerEmail: 'elena@example.com',
    category: 'account',
    subject: 'Unable to reset password - locked account',
    description:
      'I attempted to reset my password after forgetting it, but I\'m not receiving the reset email. I\'ve checked spam, and I\'ve tried multiple times. My account appears to be locked after the failed login attempts.',
    status: 'resolved',
    priority: 'normal',
    createdAt: new Date('2026-09-23T13:40:00'),
    updatedAt: new Date('2026-09-24T09:15:00'),
    assignedTo: 'Support Team A',
    responses: [
      {
        id: 'resp-004',
        authorId: 'support-001',
        authorName: 'Jamie Chen',
        message:
          'I\'ve manually reset your account access and sent a new password reset link to your email. Please check again and let me know if you receive it. Your account should be unlocked within 5 minutes.',
        isInternal: false,
        createdAt: new Date('2026-09-24T09:15:00'),
      },
    ],
    notes: [
      {
        id: 'note-005',
        authorId: 'support-001',
        authorName: 'Jamie Chen',
        content: 'Account manually unlocked. New reset link sent.',
        createdAt: new Date('2026-09-24T09:15:00'),
      },
    ],
    tags: ['account-access', 'password-reset', 'resolved'],
  },
];

export const SUPPORT_CATEGORIES = {
  booking: { label: 'Booking & Scheduling', icon: '📅', color: 'blue' },
  payment: { label: 'Payments & Billing', icon: '💰', color: 'info' },
  professional: { label: 'Professional Issues', icon: '🔧', color: 'success' },
  account: { label: 'Account & Access', icon: '👤', color: 'warning' },
  technical: { label: 'Technical Issues', icon: '⚙️', color: 'danger' },
  other: { label: 'Other', icon: '📝', color: 'neutral' },
} as const;

export const PRIORITY_COLORS = {
  low: 'text-ink-3 bg-porcelain',
  normal: 'text-teal bg-teal-soft',
  high: 'text-ochre bg-ochre-soft',
  critical: 'text-danger bg-danger-soft',
} as const;

export const STATUS_COLORS = {
  open: 'text-danger bg-danger-soft',
  'in-progress': 'text-ochre bg-ochre-soft',
  'waiting-customer': 'text-blue bg-blue-soft',
  resolved: 'text-success bg-success-soft',
  closed: 'text-ink-3 bg-porcelain',
} as const;

// Utility functions
export function getTicketsByStatus(status: TicketStatus): SupportTicket[] {
  return MOCK_SUPPORT_TICKETS.filter((ticket) => ticket.status === status);
}

export function getTicketsByPriority(priority: TicketPriority): SupportTicket[] {
  return MOCK_SUPPORT_TICKETS.filter((ticket) => ticket.priority === priority);
}

export function getTicketsByCategory(category: TicketCategory): SupportTicket[] {
  return MOCK_SUPPORT_TICKETS.filter((ticket) => ticket.category === category);
}

export function getOpenTickets(): SupportTicket[] {
  return MOCK_SUPPORT_TICKETS.filter((ticket) => ticket.status !== 'closed');
}

export function getEscalations(): SupportTicket[] {
  return MOCK_SUPPORT_TICKETS.filter((ticket) => ticket.priority === 'critical' || ticket.priority === 'high');
}

export function calculateMetrics(): SupportMetrics {
  const tickets = MOCK_SUPPORT_TICKETS;
  const openTickets = tickets.filter((t) => t.status !== 'closed').length;
  const resolvedTickets = tickets.filter((t) => t.status === 'resolved' || t.status === 'closed').length;

  return {
    openTickets,
    avgResponseTime: 45, // Mock: 45 minutes
    avgResolutionTime: 1440, // Mock: 24 hours
    resolutionRate: resolvedTickets > 0 ? Math.round((resolvedTickets / tickets.length) * 100) : 0,
    escalationRate: Math.round(
      (tickets.filter((t) => t.priority === 'critical' || t.priority === 'high').length / tickets.length) * 100
    ),
  };
}
