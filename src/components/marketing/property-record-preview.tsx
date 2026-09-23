export function PropertyRecordPreview() {
  return (
    <section className="py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left */}
          <div className="space-y-6">
            <div className="space-y-4">
              <h2 className="font-display font-bold text-4xl sm:text-5xl text-ink">
                Property records that stay with your home
              </h2>
              <p className="text-line text-lg">
                Every service leaves your property better documented. Future service professionals can see the complete history of what was fixed, when, and by whom.
              </p>
            </div>

            <div className="space-y-4">
              <p className="text-ink font-medium">Property record benefits:</p>
              <ul className="space-y-3">
                {[
                  'Verify what maintenance was already done',
                  'Understand recurring issues',
                  'Plan future improvements',
                  'Support insurance claims when needed',
                  'Increase property value with documented service',
                ].map((benefit, idx) => (
                  <li key={idx} className="flex gap-3">
                    <span className="text-mint flex-shrink-0 mt-0.5">✓</span>
                    <span className="text-line">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right - Property Record Card */}
          <div className="bg-panel border border-line rounded-2xl p-8 space-y-6">
            <div>
              <p className="text-line text-sm uppercase tracking-wider font-medium">
                Property Record
              </p>
              <h3 className="font-display font-bold text-2xl text-ink mt-2">
                Meridian Court · Flat 3B
              </h3>
            </div>

            {/* Service entries */}
            <div className="space-y-4">
              {[
                {
                  service: 'Kitchen plumbing',
                  action: 'Trap replaced',
                  date: 'Mar 2026',
                  status: 'Completed',
                },
                {
                  service: 'Split AC',
                  action: 'Service due',
                  date: 'Next week',
                  status: 'Scheduled',
                },
                {
                  service: 'Electrical',
                  action: 'RCD test',
                  date: 'Nov 2025',
                  status: 'Completed',
                },
              ].map((entry, idx) => (
                <div
                  key={idx}
                  className="pb-4 border-b border-line last:border-b-0 last:pb-0"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1">
                      <p className="text-ink font-medium">{entry.service}</p>
                      <p className="text-line text-sm">{entry.action}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-line text-xs">{entry.date}</p>
                      <span
                        className={`inline-block text-xs rounded px-2 py-1 mt-1 ${
                          entry.status === 'Completed'
                            ? 'bg-mint/20 text-mint'
                            : 'bg-yellow-500/20 text-yellow-500'
                        }`}
                      >
                        {entry.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <button className="w-full py-2 border border-mint text-mint hover:bg-mint/10 rounded-lg font-medium text-sm transition-colors">
              View property record
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
