'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Search } from 'lucide-react';
import { Symbol } from '@/components/brand/Symbol';

const FAQ_DATA = [
  {
    id: 1,
    q: 'Do I need to know which service I need?',
    a: 'No. You can describe the problem in your own words first. Fixify can help structure the request before a service category is confirmed.',
  },
  {
    id: 2,
    q: 'What happens when inspection finds extra work?',
    a: 'The additional scope should be shown clearly before extra work is approved where approval is required. The customer should be able to review what changed and why.',
  },
  {
    id: 3,
    q: 'Where can I see the current job state?',
    a: 'Open the active booking in your customer workspace. The job timeline is intended to make the current state and the next customer action visible.',
  },
  {
    id: 4,
    q: 'Can I ask for help about a specific job?',
    a: 'Yes. Use support from the relevant job when possible so the conversation can carry the request, property and job context.',
  },
  {
    id: 5,
    q: 'How does the property record work?',
    a: 'Completed work can become part of the property\'s maintenance history, helping you understand what was serviced, repaired or replaced over time.',
  },
];

const TOPICS = [
  { num: '01', title: 'Requests', desc: 'Starting a problem report, adding media, choosing a service and understanding the intake flow.' },
  { num: '02', title: 'Bookings & status', desc: 'Professional assignment, arrival, inspection, quote approval and completed work.' },
  { num: '03', title: 'Quotes & payments', desc: 'Inspection changes, customer approval, invoices and payment questions.' },
  { num: '04', title: 'Property record', desc: 'How completed work, parts, documents and maintenance history stay connected to a property.' },
  { num: '05', title: 'Account & access', desc: 'Sign-in, account details and accessing the right Fixify workspace.' },
  { num: '06', title: 'Safety & complaints', desc: 'When to stop work, how to raise a concern and what information helps Fixify respond.' },
];

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [openId, setOpenId] = useState<number>(1);

  return (
    <div className="min-h-screen bg-[#F7F4EC]">
      {/* Navigation */}
      <nav className="sticky top-0 z-40 py-3.75 bg-[rgba(247,244,236,0.84)] backdrop-blur-[16px] border-b border-transparent transition-all">
        <div style={{ width: 'min(1160px, calc(100% - 40px))' }} className="mx-auto flex items-center gap-5">
          <Link href="/" className="inline-flex items-center gap-2.5 text-sm font-bold tracking-[-0.04em] text-[#18211F] hover:text-[#176B5B]">
            <Symbol size="md" className="w-[30px] h-[30px]" />
            <span>Fixify</span>
          </Link>

          <div className="flex gap-6.25 ml-auto">
            <a href="#services" className="text-xs text-[#5A6661] hover:text-[#18211F] transition">Services</a>
            <a href="#how" className="text-xs text-[#5A6661] hover:text-[#18211F] transition">How it works</a>
            <a href="#property" className="text-xs text-[#5A6661] hover:text-[#18211F] transition">Property record</a>
            <a href="#faq" className="text-xs text-[#5A6661] hover:text-[#18211F] transition">FAQ</a>
          </div>

          <div className="flex gap-2">
            <a href="/auth/login" className="px-3.75 py-2.75 border border-[#D9DED8] bg-[#FFFEFA] rounded-[10px] text-xs font-bold text-[#18211F] hover:border-[#C7CEC8] transition">
              Sign in
            </a>
            <a href="#intake" className="px-3.75 py-2.75 bg-[#176B5B] text-white rounded-[10px] text-xs font-bold hover:bg-[#0D5144] transition shadow-[0_10px_22px_rgba(23,107,91,0.13)]">
              Describe a problem
            </a>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="py-[82px] relative overflow-hidden">
          <div style={{ width: 'min(1160px, calc(100% - 40px))' }} className="mx-auto">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.82fr', gap: '70px', alignItems: 'center' }}>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#7C8681]">FIXIFY HELP CENTRE</p>
                <h1 style={{ fontSize: 'clamp(52px, 7vw, 82px)' }} className="font-bold tracking-[-0.04em] max-w-[9ch] mt-4.25">
                  Clear answers when something needs <em className="text-[#176B5B] not-italic">fixing.</em>
                </h1>
                <p className="text-[17px] text-[#5A6661] max-w-[53ch] mt-5.75">
                  Get help with requests, bookings, quotes, payments and property records. Start with a search or open the area that matches your question.
                </p>

                {/* Search */}
                <div className="mt-7 flex items-center gap-2.5 bg-[#FFFEFA] border border-[#C7CEC8] p-1.75 rounded-[14px] shadow-[0_12px_30px_rgba(24,33,31,0.06)] max-w-[590px]">
                  <Search className="w-4.5 h-4.5 text-[#7C8681] flex-shrink-0 ml-2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search the Fixify help centre…"
                    className="flex-1 min-w-0 border-0 outline-0 bg-transparent px-0.5 py-3 text-sm text-[#18211F] placeholder-[#7C8681]"
                  />
                  <button className="border-0 bg-[#176B5B] text-white rounded-[10px] px-3.5 py-2.75 text-xs font-bold flex-shrink-0 mr-1">
                    Search
                  </button>
                </div>

                <div className="flex gap-2 flex-wrap mt-4.25">
                  <a href="#topics" className="px-3.75 py-2.75 border border-[#D9DED8] bg-[#FFFEFA] rounded-[10px] text-xs font-bold text-[#18211F] hover:border-[#C7CEC8] transition">
                    Browse topics
                  </a>
                  <a href="/support" className="px-3.75 py-2.75 border border-[#D9DED8] bg-[#FFFEFA] rounded-[10px] text-xs font-bold text-[#18211F] hover:border-[#C7CEC8] transition">
                    Contact support
                  </a>
                </div>
              </div>

              {/* Hero Visual */}
              <div className="relative min-h-[400px]">
                <div className="absolute inset-0 rounded-[28px] overflow-hidden bg-[#d7d2c6] shadow-[0_18px_50px_rgba(24,33,31,0.08)]" style={{ transform: 'rotate(1deg)' }}>
                  <Image
                    src="https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1100&q=84"
                    alt="Help center"
                    fill
                    priority
                    sizes="(max-width: 1200px) 100vw, 80vw"
                    className="w-full h-full object-cover"
                    style={{ filter: 'saturate(0.82) contrast(0.98)' }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-[rgba(24,33,31,0.02)] to-[rgba(24,33,31,0.5)]"></div>
                </div>

                {/* Signal Card */}
                <div className="absolute z-10 right-[-14px] top-[42px] bg-[#FFFEFA] border border-[#D9DED8] shadow-[0_18px_50px_rgba(24,33,31,0.08)] p-3.25 rounded-[13px] w-[190px]" style={{ animation: 'float 5s ease-in-out infinite' }}>
                  <strong className="text-xs">Need help with a live job?</strong>
                  <span className="block text-[10px] text-[#5A6661] mt-1">Open support from the job so the context travels with the conversation.</span>
                  <div className="h-1 rounded-full bg-[#E2EEE9] mt-2.75 overflow-hidden">
                    <i className="block w-2/3 h-full bg-[#176B5B] rounded-full"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Topics Section */}
        <section id="topics" className="py-21 border-t border-[#D9DED8]">
          <div style={{ width: 'min(1160px, calc(100% - 40px))' }} className="mx-auto">
            <div className="mb-[33px]">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#7C8681] mb-1">BROWSE BY TOPIC</p>
              <h2 style={{ fontSize: 'clamp(35px, 5vw, 54px)' }} className="font-bold tracking-[-0.04em] max-w-[12ch]">
                Find the part of Fixify you need.
              </h2>
              <p className="text-[#5A6661] max-w-[55ch] mt-1.75">
                Short answers first. Open support when the issue needs a person or job-level context.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {TOPICS.map((topic) => (
                <div
                  key={topic.num}
                  className="bg-[#FFFEFA] border border-[#D9DED8] rounded-[15px] p-5 hover:translate-y-[-3px] hover:border-[#BFD4CD] hover:shadow-[0_14px_30px_rgba(23,107,91,0.07)] transition-all"
                >
                  <p className="text-xs font-bold text-[#176B5B]">{topic.num}</p>
                  <h3 className="text-lg font-bold text-[#18211F] mt-2.5">{ topic.title}</h3>
                  <p className="text-[#5A6661] text-sm mt-1.75">{topic.desc}</p>
                  <a href="#faq" className="inline-flex text-xs font-bold text-[#176B5B] mt-4">
                    READ ANSWERS →
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-21 border-t border-[#D9DED8]">
          <div style={{ width: 'min(1160px, calc(100% - 40px))' }} className="mx-auto max-w-[820px]">
            <div className="mb-[33px]">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#7C8681] mb-1">COMMON QUESTIONS</p>
              <h2 className="text-[clamp(35px, 5vw, 54px)] font-bold tracking-[-0.04em]">
                Answers to the things people usually ask.
              </h2>
            </div>

            <div className="space-y-0">
              {FAQ_DATA.map((item) => (
                <div key={item.id} className={`border-t border-[#D9DED8] ${item.id === FAQ_DATA.length ? 'border-b' : ''}`}>
                  <button
                    onClick={() => setOpenId(openId === item.id ? -1 : item.id)}
                    className="w-full flex justify-between items-center gap-4 py-5 text-left font-bold text-[#18211F] hover:text-[#176B5B] transition"
                  >
                    <span className="pr-4">{item.q}</span>
                    <span className={`text-[#176B5B] font-bold flex-shrink-0 transition-transform ${openId === item.id ? 'rotate-45' : ''}`}>
                      ＋
                    </span>
                  </button>
                  {openId === item.id && (
                    <div style={{ maxHeight: '120px', overflow: 'hidden', transition: 'max-height 0.36s cubic-bezier(0.22, 1, 0.36, 1)' }}>
                      <p className="text-sm text-[#5A6661] pb-5 max-w-[72ch]">{item.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Dark Section */}
        <section className="bg-[#1C2724] text-white py-21 border-t border-[#D9DED8]">
          <div style={{ width: 'min(1160px, calc(100% - 40px))' }} className="mx-auto">
            <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 0.95fr', gap: '7xl', alignItems: 'center' }}>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-[rgba(255,255,255,0.4)]">NEED A PERSON?</p>
                <h2 style={{ fontSize: 'clamp(36px, 5vw, 55px)' }} className="font-bold tracking-[-0.04em] max-w-[11ch] mt-4.25">
                  Bring the context with you.
                </h2>
                <p className="text-[rgba(255,255,255,0.56)] max-w-[52ch] mt-3.25">
                  For a live booking, payment issue or complaint, opening support from the job is the fastest way to give the support team the information they need.
                </p>
              </div>

              <div className="border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.04)] rounded-[22px] p-5.75">
                <strong className="block text-[20px]">Open Fixify support</strong>
                <p className="mt-2">Choose a topic, attach useful evidence and keep the conversation connected to your request.</p>
                <div className="flex gap-2 flex-wrap mt-4.25">
                  <a href="/support" className="px-3.75 py-2.75 bg-[#F7F4EC] text-[#18211F] rounded-[10px] text-xs font-bold hover:bg-white transition">
                    Go to support
                  </a>
                  <a href="/auth/login" className="px-3.75 py-2.75 bg-transparent text-white border border-[rgba(255,255,255,0.18)] rounded-[10px] text-xs font-bold hover:bg-[rgba(255,255,255,0.06)] transition">
                    Sign in
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#D9DED8] bg-[#F7F4EC] py-12">
        <div style={{ width: 'min(1160px, calc(100% - 40px))' }} className="mx-auto">
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '7.5xl', marginBottom: '6xl' }}>
            <div>
              <Link href="/" className="inline-flex items-center gap-2.5 text-sm font-bold tracking-[-0.04em] text-[#18211F] mb-2">
                <Symbol size="md" className="w-[30px] h-[30px]" />
                <span>Fixify</span>
              </Link>
              <p className="text-xs text-[#5A6661] max-w-[33ch]">
                Property maintenance, structured from the first message to the final record.
              </p>
            </div>
            <div>
              <h4 className="text-xs text-[#7C8681] font-bold mb-2.5">EXPLORE</h4>
              <div className="space-y-1">
                <a href="#services" className="block text-xs text-[#5A6661] hover:text-[#18211F]">Services</a>
                <a href="#how" className="block text-xs text-[#5A6661] hover:text-[#18211F]">How it works</a>
                <a href="#property" className="block text-xs text-[#5A6661] hover:text-[#18211F]">Property record</a>
              </div>
            </div>
            <div>
              <h4 className="text-xs text-[#7C8681] font-bold mb-2.5">SUPPORT</h4>
              <div className="space-y-1">
                <a href="#topics" className="block text-xs text-[#5A6661] hover:text-[#18211F]">Help centre</a>
                <a href="/support" className="block text-xs text-[#5A6661] hover:text-[#18211F]">Contact support</a>
                <a href="/auth/login" className="block text-xs text-[#5A6661] hover:text-[#18211F]">Sign in</a>
              </div>
            </div>
          </div>

          <div className="flex justify-between gap-4 py-5 border-t border-[#D9DED8] text-xs text-[#7C8681] font-bold tracking-[0.08em] uppercase">
            <span>FIXIFY / HELP</span>
            <span>V1 REFERENCE</span>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes float {
          50% { transform: translateY(-7px); }
        }
      `}</style>
    </div>
  );
}
