import * as React from "react"

import type {
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast"

const TOAST_LIMIT = 3
const TOAST_REMOVE_DELAY = 1000000

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
  variant?: "default" | "destructive" | "success" | "warning" | "info"
  showIcon?: boolean
  duration?: number
  persistent?: boolean
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

type ActionType = typeof actionTypes

type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast>
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: ToasterToast["id"]
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: ToasterToast["id"]
    }

interface State {
  toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case "DISMISS_TOAST": {
      const { toastId } = action

      // If no toastId is provided, dismiss all toasts
      if (toastId === undefined) {
        return {
          ...state,
          toasts: state.toasts.map((t) => ({
            ...t,
            open: false,
          })),
        }
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      }
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

const listeners: Array<(state: State) => void> = []

let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

type Toast = Omit<ToasterToast, "id">

// Enhanced toast function with better defaults and Arabic support
function toast({ ...props }: Toast) {
  const id = genId()

  const update = (props: ToasterToast) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    })
  
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id })

  // Auto-dismiss logic with different durations based on variant
  const getDefaultDuration = (variant?: string) => {
    switch (variant) {
      case "destructive":
        return 8000 // Longer for errors
      case "warning":
        return 6000 // Medium for warnings
      case "success":
        return 4000 // Shorter for success
      case "info":
        return 5000 // Medium for info
      default:
        return 5000
    }
  }

  const duration = props.duration ?? getDefaultDuration(props.variant)
  const persistent = props.persistent ?? false

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss()
      },
      showIcon: props.showIcon ?? true,
      duration,
      persistent,
    },
  })

  // Auto-dismiss unless persistent
  if (!persistent && duration > 0) {
    setTimeout(() => {
      dismiss()
    }, duration)
  }

  return {
    id: id,
    dismiss,
    update,
  }
}

// Convenience methods with Arabic support
function getLanguageText(arabicText: string, englishText: string) {
  const isArabic = document.dir === 'rtl' || document.documentElement.lang === 'ar'
  return isArabic ? arabicText : englishText
}

// Common application-specific toasts
toast.saveSuccess = (options?: Partial<Toast>) => {
  return toast.successAr(
    "تم الحفظ بنجاح",
    "Saved successfully",
    "تم حفظ التغييرات بنجاح",
    "Changes have been saved successfully",
    options
  )
}

toast.saveError = (error?: string, options?: Partial<Toast>) => {
  return toast.errorAr(
    "فشل في الحفظ",
    "Save failed",
    error || "حدث خطأ أثناء حفظ التغييرات",
    error || "An error occurred while saving changes",
    options
  )
}

toast.deleteSuccess = (options?: Partial<Toast>) => {
  return toast.successAr(
    "تم الحذف بنجاح",
    "Deleted successfully",
    "تم حذف العنصر بنجاح",
    "Item has been deleted successfully",
    options
  )
}

toast.deleteError = (error?: string, options?: Partial<Toast>) => {
  return toast.errorAr(
    "فشل في الحذف",
    "Delete failed",
    error || "حدث خطأ أثناء حذف العنصر",
    error || "An error occurred while deleting the item",
    options
  )
}

toast.networkError = (options?: Partial<Toast>) => {
  return toast.errorAr(
    "خطأ في الاتصال",
    "Network error",
    "تحقق من اتصال الإنترنت وحاول مرة أخرى",
    "Check your internet connection and try again",
    options
  )
}

toast.validationError = (message?: string, options?: Partial<Toast>) => {
  return toast.warningAr(
    "خطأ في البيانات",
    "Validation error",
    message || "يرجى التحقق من البيانات المدخلة",
    message || "Please check the entered data",
    options
  )
}

// Enhanced convenience methods
toast.success = (title: string, description?: string, options?: Partial<Toast>) => {
  return toast({
    variant: "success",
    title,
    description,
    ...options,
  })
}

toast.error = (title: string, description?: string, options?: Partial<Toast>) => {
  return toast({
    variant: "destructive",
    title,
    description,
    persistent: true, // Errors should be persistent by default
    ...options,
  })
}

toast.warning = (title: string, description?: string, options?: Partial<Toast>) => {
  return toast({
    variant: "warning",
    title,
    description,
    ...options,
  })
}

toast.info = (title: string, description?: string, options?: Partial<Toast>) => {
  return toast({
    variant: "info",
    title,
    description,
    ...options,
  })
}

// Arabic-specific convenience methods
toast.successAr = (titleAr: string, titleEn: string, descriptionAr?: string, descriptionEn?: string, options?: Partial<Toast>) => {
  return toast.success(
    getLanguageText(titleAr, titleEn),
    descriptionAr && descriptionEn ? getLanguageText(descriptionAr, descriptionEn) : undefined,
    options
  )
}

toast.errorAr = (titleAr: string, titleEn: string, descriptionAr?: string, descriptionEn?: string, options?: Partial<Toast>) => {
  return toast.error(
    getLanguageText(titleAr, titleEn),
    descriptionAr && descriptionEn ? getLanguageText(descriptionAr, descriptionEn) : undefined,
    options
  )
}

toast.warningAr = (titleAr: string, titleEn: string, descriptionAr?: string, descriptionEn?: string, options?: Partial<Toast>) => {
  return toast.warning(
    getLanguageText(titleAr, titleEn),
    descriptionAr && descriptionEn ? getLanguageText(descriptionAr, descriptionEn) : undefined,
    options
  )
}

toast.infoAr = (titleAr: string, titleEn: string, descriptionAr?: string, descriptionEn?: string, options?: Partial<Toast>) => {
  return toast.info(
    getLanguageText(titleAr, titleEn),
    descriptionAr && descriptionEn ? getLanguageText(descriptionAr, descriptionEn) : undefined,
    options
  )
}

// Common application-specific toasts
toast.saveSuccess = (options?: Partial<Toast>) => {
  return toast.successAr(
    "تم الحفظ بنجاح",
    "Saved successfully",
    "تم حفظ التغييرات بنجاح",
    "Changes have been saved successfully",
    options
  )
}

toast.saveError = (error?: string, options?: Partial<Toast>) => {
  return toast.errorAr(
    "فشل في الحفظ",
    "Save failed",
    error || "حدث خطأ أثناء حفظ التغييرات",
    error || "An error occurred while saving changes",
    options
  )
}

toast.deleteSuccess = (options?: Partial<Toast>) => {
  return toast.successAr(
    "تم الحذف بنجاح",
    "Deleted successfully",
    "تم حذف العنصر بنجاح",
    "Item has been deleted successfully",
    options
  )
}

toast.deleteError = (error?: string, options?: Partial<Toast>) => {
  return toast.errorAr(
    "فشل في الحذف",
    "Delete failed",
    error || "حدث خطأ أثناء حذف العنصر",
    error || "An error occurred while deleting the item",
    options
  )
}

toast.networkError = (options?: Partial<Toast>) => {
  return toast.errorAr(
    "خطأ في الاتصال",
    "Network error",
    "تحقق من اتصال الإنترنت وحاول مرة أخرى",
    "Check your internet connection and try again",
    options
  )
}

toast.validationError = (message?: string, options?: Partial<Toast>) => {
  return toast.warningAr(
    "خطأ في البيانات",
    "Validation error",
    message || "يرجى التحقق من البيانات المدخلة",
    message || "Please check the entered data",
    options
  )
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  }
}

export { useToast, toast }
