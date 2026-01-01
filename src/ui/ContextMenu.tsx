import React from 'react';
import * as ContextMenuPrimitive from '@radix-ui/react-context-menu';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

// ============================================================================
// ContextMenu Root
// ============================================================================
const Root = ContextMenuPrimitive.Root;

// ============================================================================
// ContextMenu Trigger (with native context menu prevention for Tauri/WebView)
// ============================================================================
interface TriggerProps extends React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Trigger> {
  className?: string;
}

const Trigger = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Trigger>,
  TriggerProps
>(({ onContextMenu, ...props }, ref) => {
  const handleContextMenu = (e: React.MouseEvent<HTMLSpanElement>) => {
    console.log('[ContextMenu.Trigger] Right-click detected!', { x: e.clientX, y: e.clientY });
    // Prevent native context menu in Tauri/WebView
    e.preventDefault();
    // Call any additional handler passed via props
    onContextMenu?.(e);
  };

  console.log('[ContextMenu.Trigger] Rendering trigger');

  return (
    <ContextMenuPrimitive.Trigger
      ref={ref}
      onContextMenu={handleContextMenu}
      {...props}
    />
  );
});
Trigger.displayName = 'ContextMenu.Trigger';

// ============================================================================
// ContextMenu Portal
// ============================================================================
const Portal = ContextMenuPrimitive.Portal;

// ============================================================================
// ContextMenu Content
// ============================================================================
interface ContentProps extends React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Content> {
  className?: string;
}

const Content = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Content>,
  ContentProps
>(({ className, ...props }, ref) => {
  console.log('[ContextMenu.Content] Rendering content');
  return (
    <ContextMenuPrimitive.Portal>
      <ContextMenuPrimitive.Content
        ref={ref}
        style={{
          backgroundColor: '#1a1a1a',
          border: '1px solid #333',
          padding: '8px 0',
          minWidth: '180px',
          zIndex: 9999,
          position: 'fixed',
        }}
        className={cn(
          'z-[9999] min-w-[180px] overflow-hidden',
          'bg-surface1 border border-border1',
          'shadow-popover',
          'py-1',
          className
        )}
        {...props}
      />
    </ContextMenuPrimitive.Portal>
  );
});
Content.displayName = 'ContextMenu.Content';

// ============================================================================
// ContextMenu Item
// ============================================================================
interface ItemProps extends React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Item> {
  className?: string;
  inset?: boolean;
  destructive?: boolean;
}

const Item = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Item>,
  ItemProps
>(({ className, inset, destructive, ...props }, ref) => (
  <ContextMenuPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex cursor-pointer select-none items-center gap-2',
      'px-3 py-2 text-sm outline-none',
      'text-text1',
      'transition-colors',
      'focus:bg-surface2 focus:text-text1',
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      destructive && 'text-danger focus:text-danger',
      inset && 'pl-8',
      className
    )}
    {...props}
  />
));
Item.displayName = 'ContextMenu.Item';

// ============================================================================
// ContextMenu Separator
// ============================================================================
interface SeparatorProps extends React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Separator> {
  className?: string;
}

const Separator = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Separator>,
  SeparatorProps
>(({ className, ...props }, ref) => (
  <ContextMenuPrimitive.Separator
    ref={ref}
    className={cn('my-1 h-px bg-border1', className)}
    {...props}
  />
));
Separator.displayName = 'ContextMenu.Separator';

// ============================================================================
// ContextMenu Label
// ============================================================================
interface LabelProps extends React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Label> {
  className?: string;
  inset?: boolean;
}

const Label = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Label>,
  LabelProps
>(({ className, inset, ...props }, ref) => (
  <ContextMenuPrimitive.Label
    ref={ref}
    className={cn(
      'px-3 py-1.5 text-xs font-semibold text-text3',
      inset && 'pl-8',
      className
    )}
    {...props}
  />
));
Label.displayName = 'ContextMenu.Label';

// ============================================================================
// ContextMenu Sub (for submenus)
// ============================================================================
const Sub = ContextMenuPrimitive.Sub;

// ============================================================================
// ContextMenu SubTrigger
// ============================================================================
interface SubTriggerProps extends React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.SubTrigger> {
  className?: string;
  inset?: boolean;
}

const SubTrigger = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.SubTrigger>,
  SubTriggerProps
>(({ className, inset, children, ...props }, ref) => (
  <ContextMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      'relative flex cursor-pointer select-none items-center gap-2',
      'px-3 py-2 text-sm outline-none',
      'text-text1',
      'transition-colors',
      'focus:bg-surface2 focus:text-text1',
      'data-[state=open]:bg-surface2',
      inset && 'pl-8',
      className
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto h-4 w-4" />
  </ContextMenuPrimitive.SubTrigger>
));
SubTrigger.displayName = 'ContextMenu.SubTrigger';

// ============================================================================
// ContextMenu SubContent
// ============================================================================
interface SubContentProps extends React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.SubContent> {
  className?: string;
}

const SubContent = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.SubContent>,
  SubContentProps
>(({ className, ...props }, ref) => (
  <ContextMenuPrimitive.Portal>
    <ContextMenuPrimitive.SubContent
      ref={ref}
      className={cn(
        'z-[3000] min-w-[180px] overflow-hidden',
        'bg-surface1 border border-border1',
        'shadow-popover',
        'py-1',
        className
      )}
      {...props}
    />
  </ContextMenuPrimitive.Portal>
));
SubContent.displayName = 'ContextMenu.SubContent';

// ============================================================================
// ContextMenu Group
// ============================================================================
const Group = ContextMenuPrimitive.Group;

// ============================================================================
// Export compound component
// ============================================================================
export const ContextMenu = {
  Root,
  Trigger,
  Portal,
  Content,
  Item,
  Separator,
  Label,
  Sub,
  SubTrigger,
  SubContent,
  Group,
};

export type {
  ContentProps as ContextMenuContentProps,
  ItemProps as ContextMenuItemProps,
  SeparatorProps as ContextMenuSeparatorProps,
  LabelProps as ContextMenuLabelProps,
  SubTriggerProps as ContextMenuSubTriggerProps,
  SubContentProps as ContextMenuSubContentProps,
};
