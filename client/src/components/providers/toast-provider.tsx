'use client';

/** Expose toast actions and render workspace notifications. */
import { createContext, useContext, useMemo, type ReactNode } from 'react';
import {
  AnimatedToastStack,
  useAnimatedToastStack
} from '@/components/motion/animated-toast-stack';
type ToastActions = Pick<
  ReturnType<typeof useAnimatedToastStack>,
  'showToast' | 'updateToast' | 'dismissToast'
>;
const ToastContext = createContext<ToastActions | null>(null);
export function ToastProvider({ children }: { children: ReactNode }) {
  const { toasts, showToast, updateToast, dismissToast } = useAnimatedToastStack({ limit: 4 });
  const actions = useMemo(
    () => ({ showToast, updateToast, dismissToast }),
    [showToast, updateToast, dismissToast]
  );
  return (
    <ToastContext value={actions}>
      {children}
      <AnimatedToastStack
        toasts={toasts}
        onDismiss={dismissToast}
        position="bottom-right"
        maxVisible={3}
      />
    </ToastContext>
  );
}
export function useToasts() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToasts requires ToastProvider.');
  return context;
}
