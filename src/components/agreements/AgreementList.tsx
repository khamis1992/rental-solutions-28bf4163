import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { MoreVertical, Edit, Copy, Trash2, FileInput, Loader2, ArrowLeft, Search, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { DatePicker } from "@/components/ui/date-picker"
import { format } from 'date-fns';
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { useAgreements } from '@/hooks/use-agreements';
import { Agreement, AgreementStatus } from '@/types/agreement';
import { useProfiles } from '@/hooks/use-profiles';
import { useVehicles } from '@/hooks/use-vehicles';
import { useAgreementImport } from '@/hooks/use-agreement-import';
import { supabase } from '@/lib/supabase';
import { CustomButton } from '@/components/ui/custom-button';
import { formatDate } from '@/lib/date-utils';
import { runPaymentScheduleMaintenanceJob } from '@/lib/supabase';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import {
  PopoverArrow,
  PopoverClose,
} from "@/components/ui/popover"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
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
import { DataTable } from "@/components/ui/data-table"
import { DataTableViewOptions } from "@/components/ui/data-table-view-options"
import {
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Slider,
} from "@/components/ui/slider"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  useToast,
} from "@/hooks/use-toast"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import {
  HoverCard,
  HoverCardContent,
  HoverCardDescription,
  HoverCardFooter,
  HoverCardHeader,
  HoverCardTitle,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import {
  AspectRatio,
} from "@/components/ui/aspect-ratio"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  ResizableSeparator,
} from "@/components/ui/resizable"
import {
  ScrollArea,
} from "@/components/ui/scroll-area"
import {
  Separator,
} from "@/components/ui/separator"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Skeleton,
} from "@/components/ui/skeleton"
import {
  Switch,
} from "@/components/ui/switch"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  useQueryClient,
} from "@tanstack/react-query"
import {
  Check,
  ChevronsUpDown,
  Copy,
  Download,
  Edit,
  File,
  FileText,
  Filter,
  FolderPlus,
  MoreHorizontal,
  Plus,
  Share2,
  Trash,
  Upload,
  UserRoundPlus,
} from "lucide-react"
import * as XLSX from 'xlsx';
import {
  useReactTable,
} from "@tanstack/react-table"
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
  DataTable,
  DataTableColumnHeader,
  DataTableFacetedFilter,
  DataTableViewOptions,
} from "@/components/ui/data-table"
import {
  useDebounce,
} from "@/hooks/use-debounce"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  useToast,
} from "@/hooks/use-toast"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import {
  HoverCard,
  HoverCardContent,
  HoverCardDescription,
  HoverCardFooter,
  HoverCardHeader,
  HoverCardTitle,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import {
  AspectRatio,
} from "@/components/ui/aspect-ratio"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  ResizableSeparator,
} from "@/components/ui/resizable"
import {
  ScrollArea,
} from "@/components/ui/scroll-area"
import {
  Separator,
} from "@/components/ui/separator"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Skeleton,
} from "@/components/ui/skeleton"
import {
  Switch,
} from "@/components/ui/switch"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  useQueryClient,
} from "@tanstack/react-query"
import {
  Check,
  ChevronsUpDown,
  Copy,
  Download,
  Edit,
  File,
  FileText,
  Filter,
  FolderPlus,
  MoreHorizontal,
  Plus,
  Share2,
  Trash,
  Upload,
  UserRoundPlus,
} from "lucide-react"
import * as XLSX from 'xlsx';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Slider,
} from "@/components/ui/slider"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  useToast,
} from "@/hooks/use-toast"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import {
  HoverCard,
  HoverCardContent,
  HoverCardDescription,
  HoverCardFooter,
  HoverCardHeader,
  HoverCardTitle,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import {
  AspectRatio,
} from "@/components/ui/aspect-ratio"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  ResizableSeparator,
} from "@/components/ui/resizable"
import {
  ScrollArea,
} from "@/components/ui/scroll-area"
import {
  Separator,
} from "@/components/ui/separator"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Skeleton,
} from "@/components/ui/skeleton"
import {
  Switch,
} from "@/components/ui/switch"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  useQueryClient,
} from "@tanstack/react-query"
import {
  Check,
  ChevronsUpDown,
  Copy,
  Download,
  Edit,
  File,
  FileText,
  Filter,
  FolderPlus,
  MoreHorizontal,
  Plus,
  Share2,
  Trash,
  Upload,
  UserRoundPlus,
} from "lucide-react"
import * as XLSX from 'xlsx';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Slider,
} from "@/components/ui/slider"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  useToast,
} from "@/hooks/use-toast"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import {
  HoverCard,
  HoverCardContent,
  HoverCardDescription,
  HoverCardFooter,
  HoverCardHeader,
  HoverCardTitle,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import {
  AspectRatio,
} from "@/components/ui/aspect-ratio"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  ResizableSeparator,
} from "@/components/ui/resizable"
import {
  ScrollArea,
} from "@/components/ui/scroll-area"
import {
  Separator,
} from "@/components/ui/separator"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Skeleton,
} from "@/components/ui/skeleton"
import {
  Switch,
} from "@/components/ui/switch"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  useQueryClient,
} from "@tanstack/react-query"
import {
  Check,
  ChevronsUpDown,
  Copy,
  Download,
  Edit,
  File,
  FileText,
  Filter,
  FolderPlus,
  MoreHorizontal,
  Plus,
  Share2,
  Trash,
  Upload,
  UserRoundPlus,
} from "lucide-react"
import * as XLSX from 'xlsx';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Slider,
} from "@/components/ui/slider"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  useToast,
} from "@/hooks/use-toast"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import {
  HoverCard,
  HoverCardContent,
  HoverCardDescription,
  HoverCardFooter,
  HoverCardHeader,
  HoverCardTitle,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import {
  AspectRatio,
} from "@/components/ui/aspect-ratio"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  ResizableSeparator,
} from "@/components/ui/resizable"
import {
  ScrollArea,
} from "@/components/ui/scroll-area"
import {
  Separator,
} from "@/components/ui/separator"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Skeleton,
} from "@/components/ui/skeleton"
import {
  Switch,
} from "@/components/ui/switch"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  useQueryClient,
} from "@tanstack/react-query"
import {
  Check,
  ChevronsUpDown,
  Copy,
  Download,
  Edit,
  File,
  FileText,
  Filter,
  FolderPlus,
  MoreHorizontal,
  Plus,
  Share2,
  Trash,
  Upload,
  UserRoundPlus,
} from "lucide-react"
import * as XLSX from 'xlsx';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Slider,
} from "@/components/ui/slider"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  useToast,
} from "@/hooks/use-toast"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import {
  HoverCard,
  HoverCardContent,
  HoverCardDescription,
  HoverCardFooter,
  HoverCardHeader,
  HoverCardTitle,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import {
  AspectRatio,
} from "@/components/ui/aspect-ratio"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  ResizableSeparator,
} from "@/components/ui/resizable"
import {
  ScrollArea,
} from "@/components/ui/scroll-area"
import {
  Separator,
} from "@/components/ui/separator"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Skeleton,
} from "@/components/ui/skeleton"
import {
  Switch,
} from "@/components/ui/switch"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  useQueryClient,
} from "@tanstack/react-query"
import {
  Check,
  ChevronsUpDown,
  Copy,
  Download,
  Edit,
  File,
  FileText,
  Filter,
  FolderPlus,
  MoreHorizontal,
  Plus,
  Share2,
  Trash,
  Upload,
  UserRoundPlus,
} from "lucide-react"
import * as XLSX from 'xlsx';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Slider,
} from "@/components/ui/slider"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  useToast,
} from "@/hooks/use-toast"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import {
  HoverCard,
  HoverCardContent,
  HoverCardDescription,
  HoverCardFooter,
  HoverCardHeader,
  HoverCardTitle,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import {
  AspectRatio,
} from "@/components/ui/aspect-ratio"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  ResizableSeparator,
} from "@/components/ui/resizable"
import {
  ScrollArea,
} from "@/components/ui/scroll-area"
import {
  Separator,
} from "@/components/ui/separator"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Skeleton,
} from "@/components/ui/skeleton"
import {
  Switch,
} from "@/components/ui/switch"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  useQueryClient,
} from "@tanstack/react-query"
import {
  Check,
  ChevronsUpDown,
  Copy,
  Download,
  Edit,
  File,
  FileText,
  Filter,
  FolderPlus,
  MoreHorizontal,
  Plus,
  Share2,
  Trash,
  Upload,
  UserRoundPlus,
} from "lucide-react"
import * as XLSX from 'xlsx';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Slider,
} from "@/components/ui/slider"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  useToast,
} from "@/hooks/use-toast"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import {
  HoverCard,
  HoverCardContent,
  HoverCardDescription,
  HoverCardFooter,
  HoverCardHeader,
  HoverCardTitle,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import {
  AspectRatio,
} from "@/components/ui/aspect-ratio"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  ResizableSeparator,
} from "@/components/ui/resizable"
import {
  ScrollArea,
} from "@/components/ui/scroll-area"
import {
  Separator,
} from "@/components/ui/separator"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Skeleton,
} from "@/components/ui/skeleton"
import {
  Switch,
} from "@/components/ui/switch"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {

  useQueryClient,
} from "@tanstack/react-query";
import {
  Check,
  ChevronsUpDown,
  Copy,
  Download,
  Edit,
  File,
  FileText,
  Filter,
  FolderPlus,
  MoreHorizontal,
  Plus,
  Share2,
  Trash,
  Upload,
  UserRoundPlus,
} from "lucide-react";
import * as XLSX from 'xlsx';

const AgreementList = ({ searchQuery }: { searchQuery: string }) => {
  const navigate = useNavigate();
  const { agreements, isLoading, error, setSearchParams } = useAgreements();
  const [agreementToDelete, setAgreementToDelete] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  const columns: ColumnDef<Agreement>[] = [
    {
      accessorKey: "agreement_number",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="Agreement #" />
      ),
      cell: ({ row }) => (
        <div className="w-[80px]">
          {row.getValue("agreement_number")}
        </div>
      ),
      enableSorting: true,
      enableHiding: false,
    },
    {
      accessorKey: "customers.full_name",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="Customer Name" />
      ),
      cell: ({ row }) => {
        const customerName = row.original.customers?.full_name || 'N/A';
        return (
          <div className="w-[150px]">
            {customerName}
          </div>
        );
      },
      enableSorting: true,
      enableHiding: false,
    },
    {
      accessorKey: "vehicles.license_plate",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="License Plate" />
      ),
      cell: ({ row }) => {
        const licensePlate = row.original.vehicles?.license_plate || 'N/A';
        return (
          <div className="w-[100px]">
            {licensePlate}
          </div>
        );
      },
      enableSorting: true,
      enableHiding: false,
    },
    {
      accessorKey: "start_date",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="Start Date" />
      ),
      cell: ({ row }) => {
        const startDate = row.original.start_date ? formatDate(row.original.start_date) : 'N/A';
        return (
          <div className="w-[100px]">
            {startDate}
          </div>
        );
      },
      enableSorting: true,
      enableHiding: false,
    },
    {
      accessorKey: "end_date",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="End Date" />
      ),
      cell: ({ row }) => {
        const endDate =
