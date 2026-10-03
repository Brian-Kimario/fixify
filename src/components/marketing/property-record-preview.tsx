/**
 * PropertyRecordPreview Component
 *
 * Light section showing property maintenance records with:
 * - Left copy: benefits of property history
 * - Right card: passport-style property record with service history
 *
 * Reference: index.html .property section
 */

const propertyRecords = [
  { date: '12 Sep 2026', service: 'Kitchen plumbing', action: 'Trap replaced' },
  { date: '21 Aug 2026', service: 'Split AC', action: 'Service completed' },
  { date: '06 Jul 2026', service: 'Fuse board', action: 'Safety check logged' },
  { date: '18 Apr 2026', service: 'Boiler', action: 'Routine service' },
];

export function PropertyRecordPreview() {
  return (
    <section id="property" className="py-20 sm:py-28 bg-[#F7F4EC] border-t border-[#D9DED8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[.92fr_1.08fr] gap-16 lg:gap-20 items-center">
          {/* Left: Copy */}
          <div className="space-y-8" data-reveal="left">
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#5A6661]">
                Property record
              </p>
              <h2 className="text-5xl lg:text-6xl font-bold text-[#18211F] leading-tight tracking-tight max-w-[10ch]">
                Your home remembers the work.
              </h2>
              <p className="text-base text-[#34413D] max-w-[43ch] leading-relaxed">
                Fixify keeps completed maintenance, useful notes and service history with the property so future repairs begin with context.
              </p>
            </div>

            <button className="inline-flex items-center gap-2 px-6 py-3 border border-[#C6CEC7] bg-white text-[#18211F] rounded-[11px] font-semibold text-sm hover:bg-[#FFFEFA] transition-colors">
              Explore the property record
              <span>→</span>
            </button>
          </div>

          {/* Right: Passport Card */}
          <div className="relative" data-reveal="right">
            <div className="relative bg-[#FFFEFA] border border-[#C6CEC7] rounded-[28px] p-7 shadow-md overflow-hidden min-h-[470px]">
              {/* Property Photo (top-right) */}
              <div className="absolute right-6 top-6 w-[180px] h-[140px] rounded-[18px] overflow-hidden transform rotate-[2deg]">
                <img
                  src="https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=900&q=84"
                  alt="Modern apartment exterior"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Head Section */}
              <div className="relative z-10 max-w-[60%] pb-6">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#5A6661] mb-1">
                  Property / Meridian Court
                </p>
                <h3 className="text-2xl font-bold text-[#18211F]">Flat 3B</h3>

                {/* Record Status */}
                <div className="flex items-center gap-2 mt-3 text-[#176B5B] text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-[#176B5B]" />
                  Record up to date
                </div>
              </div>

              {/* Records Section (bottom) */}
              <div className="absolute left-7 right-7 bottom-7 border-t border-[#D9DED8] pt-4 max-h-[200px] overflow-y-auto">
                <div className="space-y-0">
                  {propertyRecords.map((record, idx) => (
                    <div
                      key={idx}
                      className={`grid grid-cols-[92px_1fr_auto] gap-3 py-3 items-center text-sm ${
                        idx < propertyRecords.length - 1
                          ? 'border-b border-[#D9DED8] pb-3'
                          : ''
                      }`}
                    >
                      <time className="text-xs font-semibold uppercase tracking-wider text-[#5A6661]">
                        {record.date}
                      </time>
                      <strong className="text-[#18211F] font-semibold">{record.service}</strong>
                      <span className="text-xs text-[#5A6661]">{record.action}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
