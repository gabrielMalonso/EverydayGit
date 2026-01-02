import * as React from "react";
import { cn } from "@/lib/utils";

type SidebarProps = React.HTMLAttributes<HTMLDivElement>;

type SidebarSectionProps = React.HTMLAttributes<HTMLDivElement>;

interface SidebarItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  icon?: React.ReactNode;
  endAdornment?: React.ReactNode;
  collapsed?: boolean;
  activeStyle?: "default" | "none";
}

interface SidebarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: React.ReactNode;
  collapsed?: boolean;
}

interface SidebarProviderProps {
  collapsed?: boolean;
  children: React.ReactNode;
}

interface SidebarContextValue {
  collapsed: boolean;
}

const SidebarContext = React.createContext<SidebarContextValue | null>(null);

const useSidebar = () => {
  const context = React.useContext(SidebarContext);
  return context ?? { collapsed: false };
};

export const SidebarProvider: React.FC<SidebarProviderProps> = ({ collapsed = false, children }) => (
  <SidebarContext.Provider value={{ collapsed }}>{children}</SidebarContext.Provider>
);

export const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  ({ className, ...props }, ref) => {
    const { collapsed } = useSidebar();

    return (
      <div
        ref={ref}
        data-state={collapsed ? "collapsed" : "expanded"}
        className={cn(
          "flex h-full flex-col border-r border-border1 bg-surface1/95 text-text1 backdrop-blur transition-[width] duration-200 ease-out",
          collapsed ? "w-14" : "w-64",
          className
        )}
        {...props}
      />
    );
  }
);
Sidebar.displayName = "Sidebar";

export const SidebarInset = React.forwardRef<HTMLDivElement, SidebarSectionProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex min-w-0 flex-1 flex-col", className)} {...props} />
  )
);
SidebarInset.displayName = "SidebarInset";

export const SidebarHeader = React.forwardRef<HTMLDivElement, SidebarSectionProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex h-14 items-center gap-3 border-b border-border1 px-3 text-sm font-semibold text-text1",
        className
      )}
      {...props}
    />
  )
);
SidebarHeader.displayName = "SidebarHeader";

export const SidebarContent = React.forwardRef<HTMLDivElement, SidebarSectionProps>(
  ({ className, ...props }, ref) => {
    const { collapsed } = useSidebar();
    return (
      <div
        ref={ref}
        className={cn("flex-1 overflow-auto py-3", collapsed ? "px-1" : "px-2", className)}
        {...props}
      />
    );
  }
);
SidebarContent.displayName = "SidebarContent";

export const SidebarFooter = React.forwardRef<HTMLDivElement, SidebarSectionProps>(
  ({ className, ...props }, ref) => {
    const { collapsed } = useSidebar();
    return (
      <div
        ref={ref}
        className={cn(
          "border-t border-border1 text-sm text-text2",
          collapsed ? "px-2 py-3" : "px-4 py-3",
          className
        )}
        {...props}
      />
    );
  }
);
SidebarFooter.displayName = "SidebarFooter";

export const SidebarGroup = React.forwardRef<HTMLDivElement, SidebarGroupProps>(
  ({ className, label, children, collapsed: collapsedProp, ...props }, ref) => {
    const { collapsed } = useSidebar();
    const isCollapsed = collapsedProp ?? collapsed;

    return (
      <div ref={ref} className={cn(isCollapsed ? "px-1 py-1" : "px-2 py-1", className)} {...props}>
        {!isCollapsed && label && (
          <div className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wide text-text3">
            {label}
          </div>
        )}
        <div className="space-y-1">{children}</div>
      </div>
    );
  }
);
SidebarGroup.displayName = "SidebarGroup";

export const SidebarItem = React.forwardRef<HTMLButtonElement, SidebarItemProps>(
  ({ className, active, icon, endAdornment, children, collapsed: collapsedProp, activeStyle = "default", ...props }, ref) => {
    const { collapsed } = useSidebar();
    const isCollapsed = collapsedProp ?? collapsed;
    const ariaLabel =
      props["aria-label"] ?? (isCollapsed && typeof children === "string" ? children : undefined);
    const activeClasses =
      activeStyle === "none"
        ? active
          ? "text-primary"
          : "hover:bg-surface2/80 text-text2"
        : active
          ? "bg-primary/15 text-primary shadow-[inset_2px_0_0_0_rgba(var(--color-primary),0.8)]"
          : "hover:bg-surface2/80 text-text2";

    return (
      <button
        ref={ref}
        type="button"
        aria-label={ariaLabel}
        aria-current={active ? "page" : undefined}
        className={cn(
          "group inline-flex w-full items-center rounded-md text-sm font-medium text-left text-text2 transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--focus-ring))]",
          isCollapsed ? "justify-center px-2 py-2" : "gap-3 px-3 py-2",
          activeClasses,
          className
        )}
        {...props}
      >
        {icon && <span className={cn("shrink-0 text-text2", active && "text-primary")}>{icon}</span>}
        <span className={cn("flex-1 truncate text-sm", isCollapsed && "sr-only")}>{children}</span>
        {!isCollapsed && endAdornment && (
          <span className="shrink-0 text-xs text-text3">{endAdornment}</span>
        )}
      </button>
    );
  }
);
SidebarItem.displayName = "SidebarItem";

export const SidebarTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-button border border-border1 bg-surface2 text-text2 transition-colors hover:bg-surface1",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--focus-ring))]",
        className
      )}
      {...props}
    />
  )
);
SidebarTrigger.displayName = "SidebarTrigger";
