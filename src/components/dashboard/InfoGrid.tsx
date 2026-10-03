'use client';

interface InfoItem {
  label: string;
  value: string | React.ReactNode;
  type?: 'normal' | 'highlight' | 'alert';
}

interface InfoGridProps {
  items: InfoItem[];
  columns?: 2 | 3 | 4;
}

/**
 * InfoGrid - Display information in a consistent grid layout
 * Common pattern across dashboards (property info, professional info, etc.)
 */
export function InfoGrid({ items, columns = 3 }: InfoGridProps) {
  const colClass = {
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-3',
    4: 'sm:grid-cols-4',
  };

  return (
    <div className={`grid gap-4 border-y border-line py-5 ${colClass[columns]}`}>
      {items.map((item) => (
        <div key={item.label}>
          <p className="text-[11px] uppercase tracking-[0.14em] text-ink-4">{item.label}</p>
          <p
            className={`mt-1 text-sm font-semibold ${
              item.type === 'highlight'
                ? 'text-teal'
                : item.type === 'alert'
                  ? 'text-ochre'
                  : 'text-ink'
            }`}
          >
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}
