import * as React from "react";
import { cn } from "@/lib/utils";

type SidebarProps = React.HTMLAttributes<HTMLDivElement>;

type SidebarSectionProps = React.HTMLAttributes<HTMLDivElement>;

interface SidebarItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  icon?: React.ReactNode;
  endAdornment?: React.ReactNode;
}

interface SidebarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: React.ReactNode;
}

export const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex h-full w-64 flex-col border-r border-border1 bg-surface1/95 text-text1 backdrop-blur",
          className
        )}
        {...props}
      />
    );
  }
);
Sidebar.displayName = "Sidebar";

export const SidebarHeader = React.forwardRef<HTMLDivElement, SidebarSectionProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex items-center gap-3 border-b border-border1 px-4 py-4 text-sm font-semibold text-text1",
        className
      )}
      {...props}
    />
  )
);
SidebarHeader.displayName = "SidebarHeader";

export const SidebarContent = React.forwardRef<HTMLDivElement, SidebarSectionProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex-1 overflow-auto px-2 py-3", className)}
      {...props}
    />
  )
);
SidebarContent.displayName = "SidebarContent";

export const SidebarFooter = React.forwardRef<HTMLDivElement, SidebarSectionProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("border-t border-border1 px-4 py-3 text-sm text-text2", className)}
      {...props}
    />
  )
);
SidebarFooter.displayName = "SidebarFooter";

export const SidebarGroup = React.forwardRef<HTMLDivElement, SidebarGroupProps>(
  ({ className, label, children, ...props }, ref) => (
    <div ref={ref} className={cn("px-2 py-1", className)} {...props}>
      {label && (
        <div className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wide text-text3">
          {label}
        </div>
      )}
      <div className="space-y-1">{children}</div>
    </div>
  )
);
SidebarGroup.displayName = "SidebarGroup";

export const SidebarItem = React.forwardRef<HTMLButtonElement, SidebarItemProps>(
  ({ className, active, icon, endAdornment, children, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      className={cn(
        "group inline-flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-left text-text2 transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--focus-ring))]",
        active
          ? "bg-primary/15 text-primary shadow-[inset_2px_0_0_0_rgba(var(--color-primary),0.8)]"
          : "hover:bg-surface2/80 text-text2",
        className
      )}
      {...props}
    >
      {icon && <span className={cn("shrink-0 text-text2", active && "text-primary")}>{icon}</span>}
      <span className="flex-1 truncate text-sm">{children}</span>
      {endAdornment && <span className="shrink-0 text-xs text-text3">{endAdornment}</span>}
    </button>
  )
);
SidebarItem.displayName = "SidebarItem";
