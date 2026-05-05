export interface Toast {
  id: string
  message: string
  type: 'error' | 'success' | 'info'
}

export type ToastListener = (toast: Toast) => void

export const toastListeners = new Set<ToastListener>()

export function showToast(message: string, type: Toast['type'] = 'info') {
  const toast: Toast = { id: crypto.randomUUID(), message, type }
  toastListeners.forEach((fn) => fn(toast))
}
