export function TrustStrip() {
  const trustPoints = [
    {
      icon: '✓',
      title: 'Verified professionals',
      description: 'Background checked and skill-verified',
    },
    {
      icon: '💰',
      title: 'Clear pricing',
      description: 'No hidden fees. You approve all additional work.',
    },
    {
      icon: '🔒',
      title: 'Service history',
      description: 'Every job stays with your property record',
    },
    {
      icon: '⏱️',
      title: 'Transparent timeline',
      description: 'Know exactly when work happens',
    },
  ];

  return (
    <section className="py-16 sm:py-20 bg-panel">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {trustPoints.map((point, idx) => (
            <div key={idx} className="space-y-3">
              <div className="text-3xl">{point.icon}</div>
              <h3 className="font-display font-bold text-ink">{point.title}</h3>
              <p className="text-line text-sm">{point.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
