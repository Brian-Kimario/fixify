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
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      setMessage('');
    }
  };

  // Mock FAQs
  const faqs = [
    {
      question: 'How do I book a service?',
      answer: 'Use the Dashboard to describe your issue, and our AI will help classify it. Then browse available professionals and schedule a time.',
    },
    {
      question: 'What happens during the inspection?',
      answer: 'A professional will visit your property to assess the issue and provide a quote for any additional work needed.',
    },
    {
      question: 'Can I cancel a booking?',
      answer: 'Yes, you can cancel up to 24 hours before the scheduled appointment. Cancellations within 24 hours may incur a fee.',
    },
    {
      question: 'How are prices calculated?',
      answer: 'Pricing depends on the service type, complexity, and your location. A quote is provided before any work begins.',
    },
  ];

  return (
    <div className="pb-20 md:pb-0">
      {/* Header */}
      <div className="px-4 md:px-6 py-8 md:py-10">
        <div className="text-xs font-bold uppercase tracking-[0.11em] text-[#7C8681] mb-2">HELP & SUPPORT</div>
        <h1 className="text-3xl md:text-4xl font-bold text-[#18211F] mb-2">How can we help?</h1>
        <p className="text-[#5A6661] max-w-2xl">Browse our FAQ or submit a support request. We're here to help you resolve any issues quickly.</p>
      </div>

      {referenceNumber ? (
        /* Success State */
        <div className="px-4 md:px-6">
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center space-y-2">
              <div className="flex justify-center mb-3">
                <div className="w-12 h-12 bg-[#E2EEE9] rounded-full flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-7 h-7 text-[#176B5B]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4l-7.07 7.07M15.93 13.93l7.07-7.07"/>
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-[#18211F]">Thank You!</h2>
              <p className="text-[#5A6661]">Your support request has been submitted successfully.</p>
            </div>

            <div className="bg-[#F1EEE5] border border-[#D9DED8] rounded-lg p-5">
              <p className="text-xs text-[#7C8681] font-bold uppercase tracking-[0.05em] mb-1">Reference Number</p>
              <div className="flex items-center justify-between">
                <p className="font-mono text-lg font-bold text-[#176B5B]">{referenceNumber}</p>
                <button className="text-xs text-[#176B5B] font-bold hover:text-[#0D5144]">Copy</button>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-[#5A6661]">We'll review your request and get back to you within 24 hours. You can check the status anytime using your reference number.</p>
              <div className="flex gap-2 flex-col sm:flex-row">
                <button
                  onClick={handleNewRequest}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-[#FFFEFA] border border-[#D9DED8] text-[#176B5B] rounded-lg text-sm font-bold hover:bg-[#F1EEE5] transition"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
                  </svg>
                  Submit Another Request
                </button>
                <Link href="/customer" className="flex-1 flex items-center justify-center px-5 py-2.5 bg-[#176B5B] text-white rounded-lg text-sm font-bold hover:bg-[#0D5144] transition">
                  Back to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Form & FAQ State */
        <div className="px-4 md:px-6">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Support Form */}
            <div className="bg-[#FFFEFA] border border-[#D9DED8] rounded-lg p-6 md:p-8">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-[#18211F] mb-1">Submit a Support Request</h2>
                <p className="text-[#5A6661]">Describe your issue and we'll help resolve it as quickly as possible.</p>
              </div>

              <div className="space-y-5">
                {/* What is wrong? */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.11em] text-[#7C8681] mb-3">What is the issue?</p>
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
                        className={`p-3.5 border rounded-lg text-left transition-all ${
                          selectedOption === opt.id
                            ? 'bg-[#E2EEE9] border-[#BFD4CD]'
                            : 'bg-[#FFFEFA] border-[#D9DED8] hover:border-[#BFD4CD]'
                        }`}
                      >
                        <strong className={`block text-xs ${selectedOption === opt.id ? 'text-[#0D5144]' : 'text-[#18211F]'}`}>
                          {opt.title}
                        </strong>
                        <span className="block text-xs text-[#5A6661] mt-0.5">{opt.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-[0.11em] text-[#7C8681] mb-2 block">Your Message</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Please describe your issue in detail..."
                    className="w-full min-h-[120px] resize-none border border-[#D9DED8] rounded-lg bg-[#FFFEFA] p-3.5 outline-0 text-sm text-[#18211F] placeholder-[#7C8681] focus:border-[#BFD4CD] focus:shadow-[0_0_0_3px_rgba(23,107,91,0.08)]"
                  />
                </div>

                {/* Submit */}
                <button
                  onClick={() => handleSuccess(`SUP-${Date.now()}`)}
                  className="w-full px-5 py-3 bg-[#176B5B] text-white rounded-lg text-sm font-bold hover:bg-[#0D5144] transition"
                >
                  Submit Support Request
                </button>
              </div>
            </div>

            {/* FAQ Section */}
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-[#18211F] mb-1">Frequently Asked Questions</h2>
                <p className="text-[#5A6661]">Find quick answers to common questions.</p>
              </div>

              <div className="space-y-3">
                {faqs.map((faq, idx) => (
                  <details
                    key={idx}
                    className="bg-[#FFFEFA] border border-[#D9DED8] rounded-lg p-5 hover:border-[#176B5B] transition cursor-pointer group"
                  >
                    <summary className="flex items-center justify-between font-semibold text-[#18211F] select-none">
                      <span className="flex items-center gap-3">
                        <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#176B5B] flex-shrink-0 group-open:hidden" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                        </svg>
                        {faq.question}
                      </span>
                      <svg
                        className="w-5 h-5 text-[#7C8681] transition-transform group-open:rotate-180"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </summary>
                    <p className="text-[#5A6661] mt-4 ml-7">{faq.answer}</p>
                  </details>
                ))}
              </div>
            </div>

            {/* Quick Help */}
            <div className="bg-gradient-to-br from-[#E2EEE9] to-[#E8F4F0] border border-[#BFD4CD] rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#176B5B] rounded-full flex items-center justify-center flex-shrink-0">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-[#18211F] mb-1">Response Time</h3>
                  <p className="text-sm text-[#5A6661]">Most support requests are answered within 24 hours during business days. For urgent issues, please call our support line.</p>
                </div>
              </div>
            </div>

            {/* Emergency Notice */}
            <div className="bg-[#F5EBD7] border border-[#E2D5BA] rounded-lg p-5 flex gap-3">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-[#9B6A1E] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <div>
                <strong className="block text-sm text-[#18211F]">Emergency?</strong>
                <p className="text-xs text-[#5A6661] mt-1">For emergencies like gas leaks or exposed wiring, follow local emergency procedures immediately. Don't wait for support.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
