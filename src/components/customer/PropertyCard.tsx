'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { Property } from '@/app/customer/properties/types';

interface PropertyCardProps {
  property: Property;
  onEdit?: (property: Property) => void;
  onBook?: (property: Property) => void;
}

export function PropertyCard({
  property,
  onEdit,
  onBook,
}: PropertyCardProps) {
  const [isHovering, setIsHovering] = useState(false);

  return (
    <Card
      className="relative flex flex-col justify-between overflow-hidden transition-all duration-300 hover:border-teal/50 hover:-translate-y-0.5 hover:shadow-lg"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Header section with property name and status badge */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-lg font-bold text-ink truncate">
              {property.name}
            </h3>
            <span className="font-mono text-[11px] text-ink-4 uppercase tracking-wider">
              {property.property_type || 'Residential'}
            </span>
          </div>
          <Badge
            variant="teal"
            label="Active"
            size="sm"
            className="flex-shrink-0"
          />
        </div>

        {/* Address information */}
        {property.address && (
          <div
            className={`space-y-1.5 text-sm transition-all duration-300 ${
              isHovering ? 'text-ink-2' : 'text-ink-3'
            }`}
          >
            <p className="font-medium leading-snug">
              {property.address.address_line_1}
            </p>
            <p className="text-xs">{property.address.city}</p>
          </div>
        )}

        {/* Service status section */}
        <div className="pt-2 border-t border-line space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-ink-4">Last Service</span>
            <span className="font-medium text-ink-3">No services yet</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-ink-4">Property Status</span>
            <Badge
              variant="success"
              label="In Service"
              size="xs"
              className="flex-shrink-0"
            />
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="pt-4 mt-4 border-t border-line space-y-2">
        <Link
          href="/customer/bookings/new"
          onClick={() => onBook?.(property)}
          className="w-full block text-sm font-medium text-teal hover:text-teal-deep transition-colors text-center"
        >
          Book Service →
        </Link>
        <div className="flex items-center gap-2 text-xs">
          <Link
            href={`/customer?tab=records`}
            className="flex-1 text-ink-3 hover:text-ink transition-colors"
          >
            View History
          </Link>
          <button
            onClick={() => onEdit?.(property)}
            className="flex-1 text-ink-3 hover:text-ink transition-colors"
          >
            Edit Details
          </button>
        </div>
      </div>

      {/* Subtle hover indicator */}
      {isHovering && (
        <div className="absolute inset-0 bg-gradient-to-r from-teal/5 to-transparent pointer-events-none transition-opacity duration-300" />
      )}
    </Card>
  );
}
