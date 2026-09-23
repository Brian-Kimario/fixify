import Link from 'next/link';

export function ServiceCategoryGrid() {
  const services = [
    { slug: 'electrical', name: 'Electrical', icon: '⚡' },
    { slug: 'plumbing', name: 'Plumbing', icon: '🚰' },
    { slug: 'ac-cooling', name: 'AC & Cooling', icon: '❄️' },
    { slug: 'appliances', name: 'Appliances', icon: '🧊' },
    { slug: 'carpentry', name: 'Carpentry', icon: '🪚' },
    { slug: 'painting', name: 'Painting', icon: '🎨' },
    { slug: 'cleaning', name: 'Cleaning', icon: '🧹' },
    { slug: 'renovation', name: 'Renovation', icon: '🏗️' },
  ];

  return (
    <section className="py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-12">
          <div className="text-center space-y-4">
            <h2 className="font-display font-bold text-4xl sm:text-5xl text-ink">
              Services we handle
            </h2>
            <p className="text-line text-lg max-w-2xl mx-auto">
              Not sure which service you need? Describe the problem and we'll help identify it. Or browse our complete service list.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service) => (
              <Link key={service.slug} href={`/services/${service.slug}`}>
                <div className="group relative p-6 rounded-xl border border-line bg-panel hover:bg-dark hover:border-mint transition-all duration-300 cursor-pointer h-full">
                  {/* Background accent */}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-mint/0 to-mint/0 group-hover:from-mint/5 group-hover:to-mint/10 transition-all duration-300" />

                  {/* Content */}
                  <div className="relative space-y-4">
                    <div className="text-5xl">{service.icon}</div>
                    <div>
                      <h3 className="font-display font-bold text-lg text-ink group-hover:text-mint transition-colors">
                        {service.name}
                      </h3>
                      <p className="text-line text-sm mt-2">
                        Professional service and verified experts
                      </p>
                    </div>
                  </div>

                  {/* Hover arrow */}
                  <div className="absolute bottom-4 right-4 text-line group-hover:text-mint group-hover:translate-x-1 transition-all duration-300">
                    →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
