'use client';

import React, { useState } from 'react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { LoadingSpinner } from './LoadingSpinner';
import { EmptyState } from './EmptyState';

export interface Column<T = any> {
  key: string;
  title: string;
  dataIndex?: keyof T;
  render?: (_value: any, _record: T, _index: number) => ReactNode;
  sortable?: boolean;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export interface DataTableProps<T = any> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  empty?: {
    title: string;
    description?: string;
    action?: {
      label: string;
      onClick: () => void;
    };
  };
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (_page: number, _pageSize: number) => void;
    showSizeChanger?: boolean;
    pageSizeOptions?: number[];
  };
  sortable?: boolean;
  onSort?: (_key: string, _direction: 'asc' | 'desc' | null) => void;
  className?: string;
  rowClassName?: string | ((_record: T, _index: number) => string);
  onRow?: (
    _record: T,
    _index: number
  ) => {
    onClick?: () => void;
    onDoubleClick?: () => void;
  };
}

interface SortState {
  key: string | null;
  direction: 'asc' | 'desc' | null;
}

export function DataTable<T = any>({
  columns,
  data,
  loading = false,
  empty,
  pagination,
  sortable = false,
  onSort,
  className,
  rowClassName,
  onRow,
}: DataTableProps<T>) {
  const [sortState, setSortState] = useState<SortState>({
    key: null,
    direction: null,
  });

  const handleSort = (key: string) => {
    if (!sortable && !onSort) return;

    let newDirection: 'asc' | 'desc' | null = 'asc';

    if (sortState.key === key) {
      if (sortState.direction === 'asc') {
        newDirection = 'desc';
      } else if (sortState.direction === 'desc') {
        newDirection = null;
      }
    }

    const newSortState = {
      key: newDirection ? key : null,
      direction: newDirection,
    };

    setSortState(newSortState);

    if (onSort) {
      onSort(key, newDirection);
    }
  };

  const renderSortIcon = (column: Column) => {
    if (!column.sortable && !sortable) return null;

    const isSorted = sortState.key === column.key;

    if (!isSorted) {
      return <ChevronsUpDown className='w-4 h-4 text-gray-400' />;
    }

    return sortState.direction === 'asc' ? (
      <ChevronUp className='w-4 h-4 text-gray-600' />
    ) : (
      <ChevronDown className='w-4 h-4 text-gray-600' />
    );
  };

  const renderCell = (column: Column<T>, record: T, index: number) => {
    if (column.render) {
      return column.render(record[column.dataIndex as keyof T], record, index);
    }

    if (column.dataIndex) {
      const value = record[column.dataIndex];
      return value?.toString() || '';
    }

    return '';
  };

  const getAlignClass = (align?: string) => {
    switch (align) {
      case 'center':
        return 'text-center';
      case 'right':
        return 'text-right';
      default:
        return 'text-left';
    }
  };

  const renderPagination = () => {
    if (!pagination) return null;

    const { current, pageSize, total, onChange } = pagination;
    const totalPages = Math.ceil(total / pageSize);
    const startItem = (current - 1) * pageSize + 1;
    const endItem = Math.min(current * pageSize, total);

    return (
      <div className='flex items-center justify-between px-2 py-4'>
        <div className='flex items-center space-x-2'>
          <p className='text-sm text-gray-700'>
            {total > 0 ? (
              <>
                <span className='font-medium'>{startItem}</span>
                {' ~ '}
                <span className='font-medium'>{endItem}</span>
                {' / '}
                <span className='font-medium'>{total}</span>
                {' 개 항목'}
              </>
            ) : (
              '항목 없음'
            )}
          </p>
        </div>

        <div className='flex items-center space-x-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => onChange(current - 1, pageSize)}
            disabled={current <= 1}
          >
            <ChevronLeft className='w-4 h-4' />
            이전
          </Button>

          <div className='flex items-center space-x-1'>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let pageNumber;

              if (totalPages <= 7) {
                pageNumber = i + 1;
              } else if (current <= 4) {
                pageNumber = i + 1;
              } else if (current >= totalPages - 3) {
                pageNumber = totalPages - 6 + i;
              } else {
                pageNumber = current - 3 + i;
              }

              return (
                <Button
                  key={pageNumber}
                  variant={current === pageNumber ? 'default' : 'outline'}
                  size='sm'
                  onClick={() => onChange(pageNumber, pageSize)}
                  className='w-8 h-8 p-0'
                >
                  {pageNumber}
                </Button>
              );
            })}
          </div>

          <Button
            variant='outline'
            size='sm'
            onClick={() => onChange(current + 1, pageSize)}
            disabled={current >= totalPages}
          >
            다음
            <ChevronRight className='w-4 h-4' />
          </Button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className='w-full'>
        <LoadingSpinner text='데이터를 불러오는 중...' />
      </div>
    );
  }

  if (data.length === 0 && empty) {
    return (
      <EmptyState
        title={empty.title}
        description={empty.description}
        action={empty.action}
      />
    );
  }

  return (
    <div className={cn('w-full', className)}>
      <div className='border rounded-lg overflow-hidden'>
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map(column => (
                <TableHead
                  key={column.key}
                  className={cn(
                    'font-medium',
                    getAlignClass(column.align),
                    column.className,
                    (column.sortable || sortable) &&
                      'cursor-pointer hover:bg-gray-50'
                  )}
                  style={{ width: column.width }}
                  onClick={() => handleSort(column.key)}
                >
                  <div className='flex items-center gap-2'>
                    <span>{column.title}</span>
                    {renderSortIcon(column)}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((record, index) => {
              const rowProps = onRow?.(record, index);
              const className =
                typeof rowClassName === 'function'
                  ? rowClassName(record, index)
                  : rowClassName;

              return (
                <TableRow
                  key={index}
                  className={cn(
                    className,
                    rowProps?.onClick && 'cursor-pointer hover:bg-gray-50'
                  )}
                  onClick={rowProps?.onClick}
                  onDoubleClick={rowProps?.onDoubleClick}
                >
                  {columns.map(column => (
                    <TableCell
                      key={`${index}-${column.key}`}
                      className={cn(
                        getAlignClass(column.align),
                        column.className
                      )}
                    >
                      {renderCell(column, record, index)}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {renderPagination()}
    </div>
  );
}

export default DataTable;
