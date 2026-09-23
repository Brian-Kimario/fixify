export function WorkflowStory() {
  const steps = [
    {
      number: '01',
      title: 'Describe the problem',
      description: 'Tell us what is wrong in plain language. Photos or video help but are not required.',
    },
    {
      number: '02',
      title: 'We identify the service',
      description: 'Based on your description, we suggest the right service category.',
    },
    {
      number: '03',
      title: 'Meet professionals',
      description: 'See available verified professionals, their reviews, and pricing estimates.',
    },
    {
      number: '04',
      title: 'Book with confidence',
      description: 'Choose your professional and confirm the booking. You control the appointment.',
    },
    {
      number: '05',
      title: 'On-site inspection',
      description: 'The professional inspects and discusses any additional work required.',
    },
    {
      number: '06',
      title: 'Approve & pay',
      description: 'Review the final cost, approve any additional work, and pay securely.',
    },
  ];

  return (
    <section className="py-16 sm:py-24 bg-panel">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-12">
          <div className="text-center space-y-4">
            <h2 className="font-display font-bold text-4xl sm:text-5xl text-ink">
              How Fixify works
            </h2>
            <p className="text-line text-lg max-w-2xl mx-auto">
              A clear path from problem to solved, every step in your control.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {steps.map((step, idx) => (
              <div key={idx} className="relative space-y-4">
                {/* Step number */}
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-mint/20 border border-mint/30 flex items-center justify-center">
                    <span className="font-display font-bold text-mint text-lg">
                      {step.number}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <h3 className="font-display font-bold text-xl text-ink">
                    {step.title}
                  </h3>
                  <p className="text-line">
                    {step.description}
                  </p>
                </div>

                {/* Connection line (except last) */}
                {idx < steps.length - 1 && (
                  <div className="absolute -bottom-8 left-6 w-0.5 h-12 bg-gradient-to-b from-mint/30 to-transparent hidden md:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
