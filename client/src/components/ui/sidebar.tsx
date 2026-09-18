'use client';

/** Provide sidebar state, desktop collapse, and a mobile drawer. */
// Adapted from Aceternity UI's sidebar: https://ui.aceternity.com/components/sidebar
// Adds explicit collapse controls, Hugeicons, and an accessible Radix mobile drawer.
import { Menu, X } from '@/components/icons';
import { cn } from '@/lib/cn';
import { Dialog } from 'radix-ui';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  mobileOpen: boolean;
  setMobileOpen: React.Dispatch<React.SetStateAction<boolean>>;
}
const SidebarContext = createContext<SidebarContextProps | null>(null);
export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) throw new Error('useSidebar requires Sidebar');
  return context;
}
export function Sidebar({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const value = useMemo(() => ({ open, setOpen, mobileOpen, setMobileOpen }), [open, mobileOpen]);
  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}
export function SidebarBody({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <>
      <DesktopSidebar className={className}>{children}</DesktopSidebar>
      <MobileSidebar>{children}</MobileSidebar>
    </>
  );
}
function DesktopSidebar({ children, className }: { children: ReactNode; className?: string }) {
  const { open } = useSidebar();
  return (
    <aside
      aria-label="Document library"
      className={cn(
        'group/sidebar flex h-dvh w-58 min-w-0 shrink-0 flex-col gap-3 overflow-hidden bg-[#f0f3ef] p-3 shadow-[inset_-1px_0_var(--border)] data-[collapsed=true]:w-13 data-[collapsed=true]:gap-4 data-[collapsed=true]:p-2 max-md:hidden [&_button]:transition-none duration-0 [&_a]:transition-none duration-0',
        className
      )}
      data-collapsed={!open}>
      {children}
    </aside>
  );
}
function MobileSidebar({ children }: { children: ReactNode }) {
  const { mobileOpen, setMobileOpen } = useSidebar();
  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 768px)');
    const closeOnDesktop = () => {
      if (desktop.matches) setMobileOpen(false);
    };
    desktop.addEventListener('change', closeOnDesktop);
    return () => desktop.removeEventListener('change', closeOnDesktop);
  }, [setMobileOpen]);
  return (
    <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
      <div className="flex h-15 shrink-0 items-center justify-between border-b border-border bg-[#f0f3ef] px-4 md:hidden">
        <span className="text-2xl font-bold tracking-[-1px] text-ink">docura.</span>
        <Dialog.Trigger asChild>
          <button
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-none duration-0 hover:bg-[#e2e9e0] hover:text-ink"
            aria-label="Open document library">
            <Menu size={22} />
          </button>
        </Dialog.Trigger>
      </div>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-90 bg-[#17251f66] backdrop-blur-[3px] md:hidden" />
        <Dialog.Content asChild aria-describedby={undefined}>
          <aside
            data-mobile="true"
            className="group/sidebar fixed inset-y-0 left-0 z-100 flex h-dvh w-[min(320px,88vw)] min-w-0 flex-col gap-3 overflow-hidden bg-[#f0f3ef] p-4 shadow-[12px_0_40px_#17251f22] md:hidden [&_button]:transition-none duration-0 [&_a]:transition-none duration-0">
            <Dialog.Title className="sr-only">Document library</Dialog.Title>
            <Dialog.Close asChild>
              <button
                className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-none duration-0 hover:bg-[#e2e9e0] hover:text-ink absolute top-4 right-4"
                aria-label="Close document library">
                <X size={20} />
              </button>
            </Dialog.Close>
            {children}
          </aside>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
