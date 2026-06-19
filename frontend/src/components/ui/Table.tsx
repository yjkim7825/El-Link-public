import type { HTMLAttributes, ReactNode, TdHTMLAttributes, ThHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

/**
 * legacy .quotation-table 매핑:
 * border #dee2e6(ink-300), thead bg #f8f9fa(ink-50)/색 #495057(ink-700),
 * 합계 행 브랜드 강조 + border-top 2px. 셀 정렬은 align prop.
 */
export function Table({ className, children, ...props }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto">
      <table className={cn('w-full border-collapse text-[15px]', className)} {...props}>
        {children}
      </table>
    </div>
  )
}

export function THead({ children }: { children: ReactNode }) {
  return <thead className="bg-ink-50 text-ink-700">{children}</thead>
}

type Align = 'left' | 'center' | 'right'
const ALIGN: Record<Align, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
}

interface CellProps {
  align?: Align
}

export function Th({
  align = 'center',
  className,
  children,
  ...props
}: ThHTMLAttributes<HTMLTableCellElement> & CellProps) {
  return (
    <th
      className={cn('border border-ink-300 px-4 py-3 font-semibold', ALIGN[align], className)}
      {...props}
    >
      {children}
    </th>
  )
}

export function Td({
  align = 'left',
  className,
  children,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement> & CellProps) {
  return (
    <td className={cn('border border-ink-300 px-4 py-3', ALIGN[align], className)} {...props}>
      {children}
    </td>
  )
}

/** 합계 행 셀 — 브랜드 강조 + 상단 두꺼운 보더(legacy .total-summary). */
export function TotalTd({ align = 'right', className, children, ...props }: TdHTMLAttributes<HTMLTableCellElement> & CellProps) {
  return (
    <td
      className={cn(
        'border border-ink-300 border-t-2 border-t-brand-500 bg-ink-50 px-4 py-3 font-bold text-brand-700',
        ALIGN[align],
        className,
      )}
      {...props}
    >
      {children}
    </td>
  )
}
