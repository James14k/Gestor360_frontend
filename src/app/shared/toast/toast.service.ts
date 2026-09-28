import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

const ICON_BY_TYPE: Record<ToastType, string> = {
  success: 'check-circle-fill',
  error: 'exclamation-octagon-fill',
  warning: 'exclamation-triangle-fill',
  info: 'info-circle-fill',
};

const CLASS_BY_TYPE: Record<ToastType, string> = {
  success: 'text-bg-success',
  error: 'text-bg-danger',
  warning: 'text-bg-warning',
  info: 'text-bg-primary',
};

let nextId = 1;

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<ToastMessage[]>([]);

  show(message: string, type: ToastType = 'info', durationMs = 5000): void {
    const toast: ToastMessage = { id: nextId++, message, type };
    this.toasts.update((list) => [...list, toast]);
    setTimeout(() => this.dismiss(toast.id), durationMs);
  }

  dismiss(id: number): void {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }

  iconFor(type: ToastType): string {
    return ICON_BY_TYPE[type];
  }

  classFor(type: ToastType): string {
    return CLASS_BY_TYPE[type];
  }
}
