import { renderHook, act } from '@testing-library/react'
import { usePagination } from '../usePagination'

describe('usePagination', () => {
  it('resets current page to valid bounds on init', () => {
    const { result } = renderHook(() =>
      usePagination({ totalItems: 30, initialPage: 10, itemsPerPage: 10 })
    )
    expect(result.current.currentPage).toBe(3)
  })

  it('resets page to 1 when items per page changes', () => {
    const { result } = renderHook(() =>
      usePagination({ totalItems: 30, initialPage: 2, itemsPerPage: 10 })
    )
    act(() => result.current.setItemsPerPage(5))
    expect(result.current.currentPage).toBe(1)
    expect(result.current.itemsPerPage).toBe(5)
  })
})
