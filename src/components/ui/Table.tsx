import { type ReactNode, type TdHTMLAttributes, type ThHTMLAttributes } from 'react';

/* ─────────────────────────────────────────────────────────────────────────────
   Table
───────────────────────────────────────────────────────────────────────────── */

interface TableProps {
  children: ReactNode;
  /** Optional caption for accessibility */
  caption?: string;
  /** Remove outer rounded border — use when table is nested inside a card */
  borderless?: boolean;
  className?: string;
}

/**
 * Table — data table shell
 *
 * Compose using: `<Table.Head>`, `<Table.Body>`, `<Table.Row>`,
 * `<Table.Header>`, `<Table.Cell>`.
 *
 * @example
 * <Table caption="Active jobs">
 *   <Table.Head>
 *     <Table.Row>
 *       <Table.Header>Job</Table.Header>
 *       <Table.Header>Status</Table.Header>
 *     </Table.Row>
 *   </Table.Head>
 *   <Table.Body>
 *     <Table.Row>
 *       <Table.Cell>Plumbing repair</Table.Cell>
 *       <Table.Cell><Badge state="IN_PROGRESS" /></Table.Cell>
 *     </Table.Row>
 *   </Table.Body>
 * </Table>
 */
export function Table({ children, caption, borderless = false, className = '' }: TableProps) {
  return (
    <div
      className={[
        'w-full overflow-x-auto',
        borderless ? '' : 'rounded-base border border-line shadow-xs',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <table className="w-full min-w-full text-sm text-left text-ink" role="table">
        {caption && (
          <caption className="sr-only">{caption}</caption>
        )}
        {children}
      </table>
    </div>
  );
}

/* Head ─────────────────────────────────────────────────────────────────────── */
interface TableHeadProps {
  children: ReactNode;
  className?: string;
}

function Head({ children, className = '' }: TableHeadProps) {
  return (
    <thead className={`bg-porcelain border-b border-line ${className}`}>
      {children}
    </thead>
  );
}

/* Body ─────────────────────────────────────────────────────────────────────── */
interface TableBodyProps {
  children: ReactNode;
  className?: string;
}

function Body({ children, className = '' }: TableBodyProps) {
  return (
    <tbody className={`bg-paper divide-y divide-line ${className}`}>
      {children}
    </tbody>
  );
}

/* Row ──────────────────────────────────────────────────────────────────────── */
interface RowProps {
  children: ReactNode;
  /** Highlight row on hover — useful for interactive tables */
  hoverable?: boolean;
  /** Highlight row as selected */
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

function Row({ children, hoverable = false, selected = false, onClick, className = '' }: RowProps) {
  return (
    <tr
      className={[
        hoverable ? 'hover:bg-teal-wash cursor-pointer transition-colors duration-100' : '',
        selected ? 'bg-teal-wash' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={onClick}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
      role={onClick ? 'button' : undefined}
      aria-selected={selected}
    >
      {children}
    </tr>
  );
}

/* Header cell ──────────────────────────────────────────────────────────────── */
interface HeaderProps extends ThHTMLAttributes<HTMLTableCellElement> {
  children?: ReactNode;
  /** Align text */
  align?: 'left' | 'center' | 'right';
  className?: string;
}

function Header({ children, align = 'left', className = '', ...props }: HeaderProps) {
  const alignClass = { left: 'text-left', center: 'text-center', right: 'text-right' }[align];
  return (
    <th
      scope="col"
      className={[
        'px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-wider text-ink-3',
        alignClass,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </th>
  );
}

/* Data cell ────────────────────────────────────────────────────────────────── */
interface CellProps extends TdHTMLAttributes<HTMLTableCellElement> {
  children?: ReactNode;
  /** Align text */
  align?: 'left' | 'center' | 'right';
  /** Muted style for secondary values */
  muted?: boolean;
  className?: string;
}

function Cell({ children, align = 'left', muted = false, className = '', ...props }: CellProps) {
  const alignClass = { left: 'text-left', center: 'text-center', right: 'text-right' }[align];
  return (
    <td
      className={[
        'px-4 py-3 whitespace-nowrap',
        muted ? 'text-ink-4' : 'text-ink-2',
        alignClass,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </td>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Attach sub-components
───────────────────────────────────────────────────────────────────────────── */
Table.Head   = Head;
Table.Body   = Body;
Table.Row    = Row;
Table.Header = Header;
Table.Cell   = Cell;
