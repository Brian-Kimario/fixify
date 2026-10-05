'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function CustomerSupportPage() {
  const [referenceNumber, setReferenceNumber] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>('problem-present');
  const [message, setMessage] = useState('');

  const handleSuccess = (refNum: string) => {
    setReferenceNumber(refNum);
  };

  const handleNewRequest = () => {
    setReferenceNumber(null);
    setSelectedOption('problem-present');
    setMessage('');
  };

  // Mock FAQs
  const faqs = [
    {
      question: 'How do I book a service?',
      answer: 'Use the Dashboard to describe your issue, and our AI will help classify it. Then browse available professionals and schedule a time that works for you.',
    },
    {
      question: 'What happens during the inspection?',
      answer: 'A qualified professional will visit your property to assess the issue and provide a quote for any additional work needed. No obligation until you approve.',
    },
    {
      question: 'Can I cancel a booking?',
      answer: 'Yes, you can cancel up to 24 hours before the scheduled appointment. Cancellations within 24 hours may incur a fee based on the service type.',
    },
    {
      question: 'How are prices calculated?',
      answer: 'Pricing depends on the service type, complexity, and your location. A detailed quote is provided before any work begins, with no surprises.',
    },
    {
      question: 'What if the professional is late?',
      answer: 'Professionals have a time window for arrival. If they\'re delayed, we\'ll notify you immediately with an updated ETA. We compensate delays.',
    },
  ];

  return (
    <div className="pb-20 md:pb-0 min-h-screen bg-paper">
      {/* Header */}
      <div className="px-4 md:px-6 py-8 md:py-12 bg-gradient-to-br from-teal-soft to-paper border-b border-teal/20">
        <div className="max-w-4xl mx-auto">
          <div className="text-xs font-bold uppercase tracking-[0.11em] text-teal mb-2 flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zm-11-1a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
            </svg>
            Support Center
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-ink mb-2">How can we help?</h1>
          <p className="text-ink-3 max-w-2xl">Browse our FAQ or submit a support request. We're here 24/7 to help you.</p>
        </div>
      </div>

      {referenceNumber ? (
        /* Success State */
        <div className="px-4 md:px-6 py-12">
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center space-y-3">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-teal text-paper rounded-full flex items-center justify-center animate-pulse">
                  <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4l-7.07 7.07M15.93 13.93l7.07-7.07"/>
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-ink">Request Received!</h2>
              <p className="text-ink-3">Thank you for contacting us. We'll review your request promptly.</p>
            </div>

            <div className="bg-teal/5 border-2 border-teal/30 rounded-lg p-6">
              <p className="text-xs text-teal font-bold uppercase tracking-wider mb-2">Reference Number</p>
              <div className="flex items-center justify-between gap-4">
                <p className="font-mono text-lg font-bold text-teal break-all">{referenceNumber}</p>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(referenceNumber);
                  }}
                  className="text-xs text-teal font-bold hover:text-teal-dark transition whitespace-nowrap px-3 py-1 hover:bg-teal/10 rounded"
                >
                  📋 Copy
                </button>
              </div>
            </div>

            <div className="space-y-3 bg-porcelain p-4 rounded-lg border border-line">
              <p className="text-sm text-ink-3 font-medium">What's next?</p>
              <ul className="text-sm text-ink-3 space-y-2">
                <li className="flex gap-2">
                  <span className="text-teal font-bold flex-shrink-0">✓</span>
                  <span>We'll review your request within 24 hours</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-teal font-bold flex-shrink-0">✓</span>
                  <span>You can track progress using your reference number above</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-teal font-bold flex-shrink-0">✓</span>
                  <span>We'll contact you at the email address on file</span>
                </li>
              </ul>
            </div>

            <div className="flex gap-3 flex-col sm:flex-row">
              <button
                onClick={handleNewRequest}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-paper border-2 border-line text-ink rounded-lg text-sm font-bold hover:bg-porcelain transition"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
                </svg>
                New Request
              </button>
              <Link href="/customer" className="flex-1 flex items-center justify-center px-5 py-3 bg-teal text-paper rounded-lg text-sm font-bold hover:bg-teal-dark transition">
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      ) : (
        /* Form & FAQ State */
        <div className="px-4 md:px-6 py-8">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Support Form */}
            <div className="bg-paper border-2 border-line rounded-lg p-6 md:p-8 shadow-sm">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-ink mb-2 flex items-center gap-2">
                  <svg className="w-6 h-6 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Submit a Support Request
                </h2>
                <p className="text-ink-3">Describe your issue and we'll get back to you quickly.</p>
              </div>

              <div className="space-y-6">
                {/* What is wrong? */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-ink-4 mb-3">What is the issue?</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { id: 'problem-present', title: 'Problem with my booking', desc: 'Issue with a scheduled service' },
                      { id: 'quote-issue', title: 'Question about a quote', desc: 'Need clarification on pricing' },
                      { id: 'billing', title: 'Billing inquiry', desc: 'Question about charges or refunds' },
                      { id: 'other', title: 'Something else', desc: 'Other issue or question' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setSelectedOption(opt.id)}
                        className={`p-4 border-2 rounded-lg text-left transition-all font-medium ${
                          selectedOption === opt.id
                            ? 'bg-teal/10 border-teal text-ink'
                            : 'bg-paper border-line text-ink-3 hover:border-teal/50 hover:text-ink'
                        }`}
                      >
                        <div className={`text-sm font-bold ${selectedOption === opt.id ? 'text-teal' : ''}`}>
                          {opt.title}
                        </div>
                        <span className="block text-xs text-ink-4 mt-1">{opt.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-ink-4 mb-2 block">Your Message</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Please describe your issue in detail. Include any relevant booking numbers, dates, or other details that might help us resolve this faster..."
                    className="w-full min-h-[140px] resize-none border-2 border-line rounded-lg bg-porcelain p-4 text-sm text-ink placeholder-ink-4 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20 transition"
                  />
                  <p className="text-xs text-ink-4 mt-2">{message.length} / 1000 characters</p>
                </div>

                {/* Submit */}
                <button
                  onClick={() => handleSuccess(`SUP-${Date.now()}`)}
                  disabled={!message.trim()}
                  className="w-full px-5 py-3 bg-teal text-paper rounded-lg text-sm font-bold hover:bg-teal-dark transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8m0 8H3m6-8h6" />
                  </svg>
                  Submit Support Request
                </button>
              </div>
            </div>

            {/* FAQ Section */}
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-ink mb-2 flex items-center gap-2">
                  <svg className="w-6 h-6 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Frequently Asked Questions
                </h2>
                <p className="text-ink-3">Find quick answers to common questions.</p>
              </div>

              <div className="space-y-3">
                {faqs.map((faq, idx) => (
                  <details
                    key={idx}
                    className="bg-paper border-2 border-line rounded-lg p-4 hover:border-teal transition cursor-pointer group"
                  >
                    <summary className="flex items-center justify-between font-semibold text-ink select-none">
                      <span className="flex items-center gap-3 text-sm md:text-base">
                        <svg viewBox="0 0 24 24" className="w-5 h-5 text-teal flex-shrink-0 group-open:hidden" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                        </svg>
                        {faq.question}
                      </span>
                      <svg
                        className="w-5 h-5 text-ink-4 transition-transform group-open:rotate-180 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </summary>
                    <p className="text-ink-3 mt-3 ml-8 text-sm">{faq.answer}</p>
                  </details>
                ))}
              </div>
            </div>

            {/* Quick Help */}
            <div className="bg-gradient-to-br from-teal/10 to-paper border-2 border-teal/30 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-teal text-paper rounded-full flex items-center justify-center flex-shrink-0">
                  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-ink mb-1">Response Time</h3>
                  <p className="text-sm text-ink-3">Most support requests are answered within 24 hours during business days. For urgent issues, mark your request as 'urgent' in the details.</p>
                </div>
              </div>
            </div>

            {/* Emergency Notice */}
            <div className="bg-yellow/10 border-2 border-yellow/30 rounded-lg p-5 flex gap-3">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-yellow-dark flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <div>
                <strong className="block text-sm text-ink">Emergency Situations</strong>
                <p className="text-xs text-ink-3 mt-1">For emergencies like gas leaks, exposed wiring, or flooding, follow local emergency procedures immediately (call 911). Do not wait for support.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
