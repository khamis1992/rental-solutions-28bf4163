
import * as React from "react"

import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ArrowUp, ArrowDown } from "lucide-react"

interface DataTableProps<TData, TValue> {
  table: ReturnType<typeof useReactTable<TData>>
  onRowClick?: (row: TData) => void
}

export function DataTable<TData, TValue>({
  table,
  onRowClick,
}: DataTableProps<TData, TValue>) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
                onClick={() => onRowClick && onRowClick(row.original)}
                className={onRowClick ? "cursor-pointer hover:bg-muted" : ""}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={table.getAllColumns().length} className="h-24 text-center">
                No results found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: {
  column: any
  title: string
  className?: string
}) {
  if (!column.getCanSort()) {
    return <div className={className}>{title}</div>
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="data-[state=open]:bg-accent hover:bg-transparent -ml-3 h-8"
          >
            <span>{title}</span>
            {column.getIsSorted() === "desc" ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : (
              null
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuCheckboxItem
            checked={column.getIsSorted() === "asc"}
            onClick={() => column.toggleSorting(false)}
          >
            Asc
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={column.getIsSorted() === "desc"}
            onClick={() => column.toggleSorting(true)}
          >
            Desc
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export function DataTableViewOptions<TData>({
  table,
}: {
  table: any
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="ml-auto">
          Columns
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {table.getAllColumns()
          .filter((column: any) => column.getCanHide())
          .map((column: any) => {
            return (
              <DropdownMenuCheckboxItem
                key={column.id}
                className="capitalize"
                checked={column.getIsVisible()}
                onCheckedChange={(value) =>
                  column.toggleVisibility(!!value)
                }
              >
                {column.id}
              </DropdownMenuCheckboxItem>
            )
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function DataTableFacetedFilter<TData>({
  column,
  title,
  options,
}: {
  column: any
  title: string
  options: { label: string; value: string }[]
}) {
  const facets = column?.getFacetedUniqueValues()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="border-dashed">
          {title}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {options.map((option) => {
          const count = facets?.get(option.value) || 0
          return (
            <DropdownMenuCheckboxItem
              key={option.value}
              checked={column?.getFilterValue()?.includes(option.value)}
              onCheckedChange={(checked) => {
                const filterValues = column?.getFilterValue() as string[] || []
                if (checked) {
                  column?.setFilterValue([...filterValues, option.value])
                } else {
                  column?.setFilterValue(
                    filterValues.filter((value: string) => value !== option.value)
                  )
                }
              }}
            >
              {option.label} {count > 0 && `(${count})`}
            </DropdownMenuCheckboxItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
