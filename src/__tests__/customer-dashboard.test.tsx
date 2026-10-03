import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { 
  ProblemIntake, 
  ActiveJobPanel, 
  PropertyMaintenanceTimeline, 
  QuoteApprovalPanel, 
  RecentActivityList 
} from '@/components/customer';
import { CustomerDashboardClient } from '@/components/customer/CustomerDashboardClient';

// Mock animejs
vi.mock('animejs', () => ({
  animate: vi.fn(() => ({
    pause: vi.fn(),
    play: vi.fn(),
    restart: vi.fn(),
  })),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/customer',
  redirect: vi.fn(),
}));

describe('Customer Dashboard Modernized Components', () => {
  it('renders ProblemIntake with visual hook and symptom options', () => {
    const html = renderToString(
      <ProblemIntake 
        properties={[{ id: 'prop-1', name: 'Oakwood Residence' }]} 
      />
    );
    expect(html).toContain('Something needs fixing?');
    expect(html).toContain('EXPRESS INTAKE');
    expect(html).toContain('Kitchen sink leak');
    expect(html).toContain('Find verified expert');
  });

  it('renders ActiveJobPanel with horizontal state rail and pro details', () => {
    const sampleJob = {
      id: 'job-1',
      referenceNumber: 'FX-4821',
      serviceTitle: 'Quarter-Turn Valve Replacement',
      category: 'Plumbing',
      propertyName: 'Oakwood Residence',
      propertyAddress: '1428 Elm Creek Road',
      currentState: 'IN_PROGRESS',
      professional: {
        id: 'pro-1',
        name: 'Dario Venn',
        rating: 4.95,
        completedJobs: 84,
        verificationStatus: 'verified' as const,
      },
    };

    const html = renderToString(<ActiveJobPanel job={sampleJob} />);
    expect(html).toContain('FX-4821');
    expect(html).toContain('Quarter-Turn Valve Replacement');
    expect(html).toContain('Dario Venn');
    expect(html).toContain('Request');
    expect(html).toContain('Complete');
  });

  it('renders PropertyMaintenanceTimeline with category filters and events', () => {
    const html = renderToString(<PropertyMaintenanceTimeline />);
    expect(html).toContain('Property Maintenance Timeline');
    expect(html).toContain('VERIFIED ASSET HISTORY');
    expect(html).toContain('All');
    expect(html).toContain('Plumbing');
    expect(html).toContain('Electrical');
  });

  it('renders QuoteApprovalPanel drawer structure with clear total', () => {
    const html = renderToString(
      <QuoteApprovalPanel 
        isOpen={true} 
        onClose={vi.fn()} 
        quote={null} 
      />
    );
    expect(html).toContain('Quote for Additional Work');
    expect(html).toContain('ITEMIZED BREAKDOWN');
    expect(html).toContain('Approve work');
    expect(html).toContain('Decline quote');
  });

  it('renders RecentActivityList with real event status badges', () => {
    const html = renderToString(<RecentActivityList />);
    expect(html).toContain('Recent Activity');
    expect(html).toContain('LOGGED EVENTS');
    expect(html).toContain('All history');
  });

  it('renders unified CustomerDashboardClient orchestration', () => {
    const html = renderToString(
      <CustomerDashboardClient
        displayName="Alex"
        greeting="Good morning"
        activeJob={null}
        pendingQuote={null}
        properties={[{ id: 'p1', name: 'Oakwood Residence', propertyType: 'House' }]}
        timelineEvents={[]}
        recentActivities={[]}
      />
    );
    expect(html).toContain('Good morning, Alex');
    expect(html).toContain('Something needs fixing?');
    expect(html).toContain('Property Maintenance Timeline');
  });
});
