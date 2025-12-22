import { create } from 'zustand';
import type { ToastType } from '../ui/Toast';

interface ToastState {
  message: string;
  type: ToastType;
  show: boolean;
  showToast: (message: string, type: ToastType) => void;
  hideToast: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  message: '',
  type: 'success',
  show: false,
  showToast: (message, type) => set({ message, type, show: true }),
  hideToast: () => set({ show: false }),
}));
