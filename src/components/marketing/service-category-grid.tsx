'use client';

import React from 'react';
import { ShiftCard } from '@/components/cult/ShiftCard';
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
  const categories = [
    {
      slug: 'electrical',
      title: 'Electrical',
      category: 'POWER & FIXTURES',
      description: 'Breaker trips, damaged sockets, fixture installs and wiring diagnostics.',
      icon: <Icon icon={faBolt} size="base" currentColor decorative />,
      typicalRequests: ['Tripping circuit breaker', 'Socket not providing power', 'Ceiling fixture installation'],
      href: '/customer?service=electrical',
      badge: 'POPULAR',
    },
    {
      slug: 'plumbing',
      title: 'Plumbing',
      category: 'LEAKS & DRAINAGE',
      description: 'Under-sink leaks, blocked waste pipes, valve replacements and low pressure.',
      icon: <Icon icon={faFaucet} size="base" currentColor decorative />,
      typicalRequests: ['Water dripping under sink', 'Blocked shower drain', 'Stopcock valve replacement'],
      href: '/customer?service=plumbing',
      badge: 'URGENT READY',
    },
    {
      slug: 'ac-cooling',
      title: 'AC & Cooling',
      category: 'CLIMATE & AIR',
      description: 'Annual coil cleaning, cooling loss diagnostics, thermostat issues.',
      icon: <Icon icon={faSnowflake} size="base" currentColor decorative />,
      typicalRequests: ['Unit blowing room-temperature air', 'Water dripping from indoor split', 'Routine pre-summer service'],
      href: '/customer?service=ac-cooling',
    },
    {
      slug: 'appliances',
      title: 'Appliances',
      category: 'HOUSEHOLD GEAR',
      description: 'Washing machines, dishwashers, refrigerators and built-in ovens.',
      icon: <Icon icon={faPlug} size="base" currentColor decorative />,
      typicalRequests: ['Washing machine drum not spinning', 'Refrigerator not cooling evenly', 'Oven heating element failing'],
      href: '/customer?service=appliances',
    },
    {
      slug: 'carpentry',
      title: 'Carpentry',
      category: 'DOORS & JOINERY',
      description: 'Sticking doors, cabinet hinge repair, locks and custom woodwork fixes.',
      icon: <Icon icon={faHammer} size="base" currentColor decorative />,
      typicalRequests: ['Door rubbing against frame', 'Cabinet soft-close hinge broken', 'Door lock adjustment'],
      href: '/customer?service=carpentry',
    },
    {
      slug: 'painting',
      title: 'Painting & Touch-up',
      category: 'FINISHES & WALLS',
      description: 'Water-stain touch-ups, patch repairs, accent walls and room repainting.',
      icon: <Icon icon={faPaintbrush} size="base" currentColor decorative />,
      typicalRequests: ['Ceiling water stain repair', 'Scuffed hallway repainting', 'Door frame enamel finishing'],
      href: '/customer?service=painting',
    },
    {
      slug: 'cleaning',
      title: 'Property Cleaning',
      category: 'HYGIENE & CARE',
      description: 'Deep post-repair cleanup, tenant changeover hygiene, tile scrubbing.',
      icon: <Icon icon={faBroom} size="base" currentColor decorative />,
      typicalRequests: ['Post-repair residue cleanup', 'Bathroom limescale deep clean', 'Pre-tenancy deep sanitization'],
      href: '/customer?service=cleaning',
    },
    {
      slug: 'renovation',
      title: 'Minor Renovation',
      category: 'SURFACES & TILES',
      description: 'Loose floor tile replacement, regrouting, sealants and cosmetic repairs.',
      icon: <Icon icon={faHardHat} size="base" currentColor decorative />,
      typicalRequests: ['Cracked floor tile replacement', 'Bathroom silicone & grout refresh', 'Wall anchor mounting'],
      href: '/customer?service=renovation',
    },
  ];

  return (
    <section className="py-24 border-t border-line bg-porcelain" id="services">
      <div className="wrap">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-14">
          <div className="max-w-xl">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-ink-4">
              VERIFIED SERVICE CATALOGUE
            </p>
            <h2 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-ink">
              Know what you need? Start with a category.
            </h2>
            <p className="mt-3 text-sm text-ink-3">
              Hover over any service to see common problems and jump directly into the booking flow.
            </p>
          </div>
          <span className="font-mono text-xs font-semibold text-teal self-start sm:self-end">
            8 SPECIALIST TRADES AVAILABLE
          </span>
        </div>

        {/* 4-column Desktop, 2-column Tablet, 1-column Mobile ShiftCard Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat) => (
            <ShiftCard
              key={cat.slug}
              title={cat.title}
              category={cat.category}
              description={cat.description}
              icon={cat.icon}
              typicalRequests={cat.typicalRequests}
              href={cat.href}
              badge={cat.badge}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
