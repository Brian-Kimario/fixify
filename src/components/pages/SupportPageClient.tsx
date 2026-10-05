'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, ArrowLeft } from 'lucide-react';
import { SupportForm } from '@/components/shared/SupportForm';
import { Symbol } from '@/components/brand/Symbol';

export function SupportPageClient() {
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
      // Message added to thread
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F4EC]">
      {/* Sidebar */}
      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', minHeight: '100vh' }}>
        <aside className="bg-[#FFFEFA] border-r border-[#D9DED8] sticky top-0 h-screen flex flex-col">
          <div className="p-5.5 pb-4.25">
            <Link href="/" className="inline-flex items-center gap-2.5 text-sm font-bold tracking-[-0.035em] text-[#18211F]">
              <Symbol size="sm" className="w-[29px] h-[29px]" />
              <span>Fixify</span>
            </Link>
          </div>

          <nav className="px-3 py-1.75 flex-1 space-y-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.11em] text-[#7C8681] px-2.5 pb-2.25">Customer space</p>
              <div className="space-y-0.5">
                <a href="/customer" className="flex items-center gap-2.5 px-2.75 py-2.5 rounded-[10px] text-[#5A6661] hover:bg-[#F1EEE5] hover:text-[#18211F] transition">
                  <svg viewBox="0 0 24 24" className="w-4.25 h-4.25" fill="none" stroke="currentColor" strokeWidth="1.65">
                    <rect x="4" y="4" width="6" height="6"/><rect x="14" y="4" width="6" height="6"/><rect x="4" y="14" width="6" height="6"/><rect x="14" y="14" width="6" height="6"/>
                  </svg>
                  Overview
                </a>
                <a href="/support" className="flex items-center gap-2.5 px-2.75 py-2.5 rounded-[10px] bg-[#E2EEE9] text-[#0D5144] font-bold transition">
                  <svg viewBox="0 0 24 24" className="w-4.25 h-4.25" fill="none" stroke="currentColor" strokeWidth="1.65">
                    <path d="M5 6h14v10H9l-4 4z"/>
                  </svg>
                  Help & support
                </a>
                <a href="/help" className="flex items-center gap-2.5 px-2.75 py-2.5 rounded-[10px] text-[#5A6661] hover:bg-[#F1EEE5] hover:text-[#18211F] transition">
                  <svg viewBox="0 0 24 24" className="w-4.25 h-4.25" fill="none" stroke="currentColor" strokeWidth="1.65">
                    <circle cx="12" cy="12" r="8"/><path d="M9.5 9a2.5 2.5 0 1 1 4 2c-.9.65-1.5 1.1-1.5 2.4M12 17h.01"/>
                  </svg>
                  Help centre
                </a>
              </div>
            </div>
          </nav>

          <div className="px-5 py-3.5 border-t border-[#D9DED8] text-xs text-[#7C8681]">
            Support V1 · job context preserved
          </div>
        </aside>

        {/* Main */}
        <div className="min-w-0">
          {/* Header */}
          <header className="sticky top-0 z-30 bg-[rgba(247,244,236,0.9)] backdrop-blur-[15px] border-b border-transparent">
            <div className="flex items-center px-8 py-3 min-h-[74px] gap-4">
              <div className="flex-1">
                <p className="text-xs font-bold uppercase tracking-[0.11em] text-[#7C8681]">HELP & SUPPORT</p>
                <h1 className="text-[22px] font-bold tracking-[-0.03em] text-[#18211F] mt-1.5">
                  How can we help with your Fixify experience?
                </h1>
              </div>
              <a href="/customer/profile" className="w-9 h-9 rounded-full bg-[#18211F] text-white flex items-center justify-center text-xs font-bold">
                AB
              </a>
            </div>
          </header>

          {/* Content */}
          <main style={{ width: 'min(1120px, calc(100% - 64px))' }} className="mx-auto py-7">
            {referenceNumber ? (
              /* Success State */
              <div className="space-y-8">
                <div className="text-center space-y-1">
                  <div className="flex justify-center mb-1">
                    <div className="w-12 h-12 bg-[#E2EEE9] rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-7 h-7 text-[#176B5B]" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-[#18211F]">Thank You!</h2>
                  <p className="text-[#5A6661] max-w-md mx-auto mt-1">
                    Your support request has been submitted successfully.
                  </p>
                </div>

                <div className="bg-[#F1EEE5] border border-[#D9DED8] rounded-[16px] p-6">
                  <p className="text-xs text-[#7C8681] mb-0.5">Reference Number</p>
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-lg font-bold text-[#176B5B]">{referenceNumber}</p>
                    <button className="text-xs text-[#176B5B] font-bold hover:text-[#0D5144]">Copy</button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleNewRequest}
                    className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-[#FFFEFA] border border-[#D9DED8] text-[#18211F] rounded-[10px] text-xs font-bold hover:border-[#C7CEC8] transition"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Submit Another Request
                  </button>
                  <a href="/help" className="flex-1 flex items-center justify-center px-5 py-2.5 bg-[#FFFEFA] border border-[#D9DED8] text-[#18211F] rounded-[10px] text-xs font-bold hover:border-[#C7CEC8] transition">
                    Browse FAQ
                  </a>
                </div>
              </div>
            ) : (
              /* Form State */
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(310px, 0.8fr)', gap: '18px' }}>
                {/* Left Column */}
                <div className="space-y-[18px]">
                  {/* Intro */}
                  <div className="mb-5.25">
                    <div className="flex justify-between items-end gap-6">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.11em] text-[#7C8681] mb-1">CURRENT CONTEXT</p>
                        <h2 style={{ fontSize: '28px' }} className="font-bold tracking-[-0.032em] text-[#18211F] mt-1.5">
                          Kitchen sink leak · FX-4790
                        </h2>
                        <p className="text-[#5A6661] max-w-[58ch] mt-1.75">
                          Start here because your support request stays connected to the active job and property.
                        </p>
                      </div>
                      <a href="/customer" className="text-xs font-bold text-[#176B5B] tracking-[0.05em] flex-shrink-0 whitespace-nowrap">
                        ← BACK TO CUSTOMER SPACE
                      </a>
                    </div>
                  </div>

                  {/* Ticket Hero */}
                  <section className="bg-[#18211F] text-white rounded-[21px] p-5.5 relative overflow-hidden shadow-[0_18px_50px_rgba(24,33,31,0.08)]">
                    <div className="absolute w-[330px] h-[330px] right-[-130px] bottom-[-160px] rounded-full border border-[rgba(255,255,255,0.08)]"></div>

                    <div className="relative z-10 flex justify-between gap-4 mb-4.75">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.11em] text-[rgba(255,255,255,0.4)] mb-1">ACTIVE SUPPORT CONTEXT</p>
                        <h3 className="text-2xl text-white font-bold mt-1.75">Kitchen sink leak</h3>
                        <div className="text-xs text-[rgba(255,255,255,0.55)] mt-1.25">Inspection · Meridian Court, Flat 3B · Dario Venn</div>
                      </div>
                      <span className="px-2 py-1.5 border border-[rgba(114,208,183,0.24)] bg-[rgba(114,208,183,0.08)] text-[#72D0B7] rounded-full text-xs font-bold whitespace-nowrap h-fit">
                        OPEN JOB
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2.25', marginTop: '4.75' }} className="relative z-10">
                      <div className="border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.035)] rounded-[12px] p-3">
                        <small className="block text-[rgba(255,255,255,0.38)] text-xs font-bold">JOB</small>
                        <strong className="block text-white text-xs mt-1.25">FX-4790</strong>
                      </div>
                      <div className="border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.035)] rounded-[12px] p-3">
                        <small className="block text-[rgba(255,255,255,0.38)] text-xs font-bold">SERVICE</small>
                        <strong className="block text-white text-xs mt-1.25">Plumbing</strong>
                      </div>
                      <div className="border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.035)] rounded-[12px] p-3">
                        <small className="block text-[rgba(255,255,255,0.38)] text-xs font-bold">STATE</small>
                        <strong className="block text-white text-xs mt-1.25">Inspection</strong>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4.5 relative z-10">
                      <button className="flex-1 px-3.5 py-2.5 bg-[#176B5B] text-white rounded-[10px] text-xs font-bold hover:bg-[#0D5144] transition">
                        Continue this support request
                      </button>
                      <button className="flex-1 px-3.5 py-2.5 bg-transparent border border-[rgba(255,255,255,0.16)] text-white rounded-[10px] text-xs font-bold hover:bg-[rgba(255,255,255,0.06)] transition">
                        View job details
                      </button>
                    </div>
                  </section>

                  {/* Options */}
                  <section className="bg-[#FFFEFA] border border-[#D9DED8] rounded-[16px] p-5 shadow-[0_2px_15px_rgba(24,33,31,0.025)]">
                    <div className="mb-4">
                      <p className="text-xs font-bold uppercase tracking-[0.11em] text-[#7C8681] mb-1">WHAT IS WRONG?</p>
                      <h3 className="text-base font-bold text-[#18211F] mt-1.5">Choose the closest match.</h3>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2.25' }}>
                      {[
                        { id: 'problem-present', title: 'Problem is still present', desc: 'The issue has not been resolved.' },
                        { id: 'no-arrival', title: 'Professional has not arrived', desc: 'Arrival or no-show issue.' },
                        { id: 'quote-clarify', title: 'Quote needs clarification', desc: 'Something unclear.' },
                        { id: 'after-job', title: 'Something went wrong after the job', desc: 'Concern about work.' },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => setSelectedOption(opt.id)}
                          className={`p-3.5 border rounded-[12px] text-left transition-all ${
                            selectedOption === opt.id
                              ? 'bg-[#E2EEE9] border-[#BFD4CD]'
                              : 'bg-[#FFFEFA] border-[#D9DED8] hover:translate-y-[-2px] hover:shadow-[0_10px_22px_rgba(23,107,91,0.06)] hover:border-[#BFD4CD]'
                          }`}
                        >
                          <strong className={`block text-xs ${selectedOption === opt.id ? 'text-[#0D5144]' : 'text-[#18211F]'}`}>{opt.title}</strong>
                          <span className="block text-[10.5px] text-[#5A6661] mt-0.75">{opt.desc}</span>
                        </button>
                      ))}
                    </div>
                  </section>

                  {/* Thread */}
                  <section className="bg-[#FFFEFA] border border-[#D9DED8] rounded-[16px] p-5 shadow-[0_2px_15px_rgba(24,33,31,0.025)]">
                    <div className="mb-3.5">
                      <p className="text-xs font-bold uppercase tracking-[0.11em] text-[#7C8681] mb-1">SUPPORT THREAD</p>
                      <h3 className="text-base font-bold text-[#18211F] mt-1.5">Keep the conversation together.</h3>
                    </div>

                    <div className="space-y-3 mb-3.5">
                      <div className="flex gap-2.5">
                        <div className="max-w-lg px-3.25 py-3 border border-[#D9DED8] bg-[#F7F4EC] rounded-[13px]">
                          <p className="text-sm text-[#18211F]">Hi. I can see the plumbing inspection is still open.</p>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <div className="max-w-lg px-3.25 py-3 bg-[#176B5B] text-white rounded-[13px]">
                          <p className="text-sm">The leak is still happening and I'm not sure if the inspection captured it.</p>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '2' }}>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Write a message…"
                        className="min-h-[52px] resize-none border border-[#D9DED8] rounded-[11px] bg-[#FFFEFA] p-2.75 outline-0 text-sm text-[#18211F] placeholder-[#7C8681] focus:border-[#BFD4CD] focus:shadow-[0_0_0_3px_rgba(23,107,91,0.08)]"
                      ></textarea>
                      <button
                        onClick={handleSendMessage}
                        className="px-3.25 py-2.5 bg-[#176B5B] text-white rounded-[10px] text-xs font-bold hover:bg-[#0D5144] transition h-fit"
                      >
                        Send
                      </button>
                    </div>
                  </section>
                </div>

                {/* Right Column */}
                <div className="space-y-[18px]">
                  {/* Details */}
                  <section className="bg-[#FFFEFA] border border-[#D9DED8] rounded-[16px] p-5 shadow-[0_2px_15px_rgba(24,33,31,0.025)]">
                    <h3 className="font-bold text-[#18211F] mb-2">Job context</h3>
                    <div className="space-y-3">
                      {[
                        { label: 'Customer', value: 'Alex Brown' },
                        { label: 'Property', value: 'Meridian Court · Flat 3B' },
                        { label: 'Professional', value: 'Dario Venn' },
                        { label: 'Current state', value: 'Inspection' },
                        { label: 'Request started', value: 'Today · 08:12' },
                      ].map((row, idx) => (
                        <div key={idx} className={`flex justify-between gap-4 py-3 ${idx !== 4 ? 'border-b border-[#D9DED8]' : ''}`}>
                          <span className="text-xs text-[#5A6661]">{row.label}</span>
                          <strong className="text-xs text-[#18211F]">{row.value}</strong>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Warning */}
                  <div className="p-4 rounded-[14px] bg-[#F5EBD7] border border-[#E2D5BA]">
                    <strong className="block text-xs text-[#18211F]">Safety first</strong>
                    <p className="text-xs text-[#5A6661] mt-1">For immediate danger such as exposed live wiring or gas leaks, follow local emergency procedures first.</p>
                  </div>

                  {/* Quick Help */}
                  <section className="bg-[#FFFEFA] border border-[#D9DED8] rounded-[16px] p-5 shadow-[0_2px_15px_rgba(24,33,31,0.025)]">
                    <h3 className="font-bold text-[#18211F] text-sm mb-2.5">Quick help</h3>
                    <div className="space-y-2">
                      <a href="/help" className="block px-2.75 py-2.5 border border-[#D9DED8] bg-[#FFFEFA] rounded-[10px] text-xs text-[#5A6661] hover:text-[#18211F] hover:bg-[#F1EEE5] transition">
                        How do quotes work?
                      </a>
                      <a href="/help" className="block px-2.75 py-2.5 border border-[#D9DED8] bg-[#FFFEFA] rounded-[10px] text-xs text-[#5A6661] hover:text-[#18211F] hover:bg-[#F1EEE5] transition">
                        Where can I see job status?
                      </a>
                      <a href="/help" className="block px-2.75 py-2.5 border border-[#D9DED8] bg-[#FFFEFA] rounded-[10px] text-xs text-[#5A6661] hover:text-[#18211F] hover:bg-[#F1EEE5] transition">
                        How does the property record work?
                      </a>
                    </div>
                  </section>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
