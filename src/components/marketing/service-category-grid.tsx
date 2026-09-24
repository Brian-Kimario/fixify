'use client';

import { Icon } from '@/components/ui/icon';
import {
  faBolt,
  faFaucet,
  faSnowflake,
  faPlug,
  faHammer,
  faPaintbrush,
  faBroom,
  faHardHat,
} from '@fortawesome/free-solid-svg-icons';

export function ServiceCategoryGrid() {
  const services = [
    { slug: 'electrical', name: 'Electrical', description: 'Sockets, lighting, wiring faults and breakers.', icon: faBolt },
    { slug: 'plumbing', name: 'Plumbing', description: 'Leaks, drainage, fittings and water-pressure issues.', icon: faFaucet },
    { slug: 'ac-cooling', name: 'AC & cooling', description: 'Servicing, cooling problems and installation checks.', icon: faSnowflake },
    { slug: 'appliances', name: 'Appliances', description: 'Washing machines, refrigerators, ovens and more.', icon: faPlug },
    { slug: 'carpentry', name: 'Carpentry', description: 'Doors, cabinets, frames and fitted woodwork.', icon: faHammer },
    { slug: 'painting', name: 'Painting & finishing', description: 'Room painting, touch-ups and finishing work.', icon: faPaintbrush },
    { slug: 'cleaning', name: 'Cleaning', description: 'Deep cleaning and scheduled property care.', icon: faBroom },
    { slug: 'renovation', name: 'Renovation', description: 'Small-scope improvement and repair work.', icon: faHardHat },
  ];

  return (
    <section className="section" id="services">
      <div className="wrap">
        <div className="section-head reveal">
          <p className="eyebrow">SERVICES</p>
          <h2>Know the service already?</h2>
          <p>You can skip the guided intake and start from a service category at any time.</p>
        </div>

        <div className="service-grid reveal">
          {services.map((service, idx) => (
            <div
              key={service.slug}
              className="service-card"
              data-delay={idx > 0 ? String(Math.min(idx - 1, 3)) : undefined}
            >
              <div className="service-icon">
                <Icon icon={service.icon} size="lg" currentColor ariaLabel={service.name} />
              </div>
              <h3>{service.name}</h3>
              <p>{service.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
