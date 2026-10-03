/** Hero category imagery: a relevant issue state paired with a resolved result. */
export interface RepairCategory {
  id: string;
  label: string;
  images: { before: string; after: string };
  caption: string;
}

const unsplash = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=2000&q=82`;

export const REPAIR_CATEGORIES: RepairCategory[] = [
  {
    id: 'plumbing',
    label: 'Plumbing',
    images: {
      before: unsplash('photo-1585771724684-38269d6639fd'),
      after: unsplash('photo-1552321554-5fefe8c9ef14'),
    },
    caption: 'A leak or blockage becomes a clear repair plan, then a working, water-tight result.',
  },
  {
    id: 'electrical',
    label: 'Electrical',
    images: {
      before: unsplash('photo-1621905251918-48416bd8575a'),
      after: unsplash('photo-1558008258-3256797b43f3'),
    },
    caption: 'Unsafe wiring is inspected, explained, and left safe for the people who use the home.',
  },
  {
    id: 'ac-cooling',
    label: 'AC & Cooling',
    images: {
      before: unsplash('photo-1545259741-2ea3ebf61fa3'),
      after: unsplash('photo-1615874694520-474822394e73'),
    },
    caption: 'From a struggling unit to comfortable airflow, with the right service for the actual fault.',
  },
  {
    id: 'appliances',
    label: 'Appliances',
    images: {
      before: unsplash('photo-1517668808822-9ebb02ae2a0e'),
      after: unsplash('photo-1556911220-bff31c812dba'),
    },
    caption: 'A faulty household appliance is diagnosed, repaired, and returned to everyday use.',
  },
];
