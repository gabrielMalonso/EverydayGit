import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { TabState, TabColor } from '@/stores/tabStore';
import { Palette, Edit3, X, XCircle, ChevronRight } from 'lucide-react';

interface TabContextMenuProps {
    tab: TabState;
    onRename: () => void;
    onClose: () => void;
    onCloseOthers: () => void;
    onColorChange: (color: TabColor) => void;
    children: React.ReactNode;
}

interface MenuPosition {
    x: number;
    y: number;
}

const COLOR_OPTIONS: Array<{ id: TabColor; name: string; rgb: string }> = [
    { id: 'default', name: 'Verde (padrão)', rgb: 'rgb(133 204 35)' },
    { id: 'blue', name: 'Azul', rgb: 'rgb(59 130 246)' },
    { id: 'purple', name: 'Roxo', rgb: 'rgb(168 85 247)' },
    { id: 'pink', name: 'Rosa', rgb: 'rgb(236 72 153)' },
    { id: 'orange', name: 'Laranja', rgb: 'rgb(245 158 11)' },
    { id: 'red', name: 'Vermelho', rgb: 'rgb(239 68 68)' },
    { id: 'yellow', name: 'Amarelo', rgb: 'rgb(234 179 8)' },
    { id: 'cyan', name: 'Ciano', rgb: 'rgb(6 182 212)' },
];

interface MenuItemProps {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    destructive?: boolean;
    hasSubmenu?: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon, label, onClick, destructive, hasSubmenu }) => (
    <button
        type="button"
        onClick={onClick}
        className={`
            w-full flex items-center gap-2 px-3 py-2 text-sm text-left
            transition-colors outline-none cursor-pointer
            ${destructive
                ? 'text-danger hover:bg-danger/20 hover:text-danger'
                : 'text-text1 hover:bg-highlight/15 hover:text-text1'}`}
    >
        {icon}
        <span className="flex-1">{label}</span>
        {hasSubmenu && <ChevronRight className="h-4 w-4 ml-auto" />}
    </button>
);

const MenuSeparator: React.FC = () => (
    <div className="my-1 h-px bg-border1" />
);

export const TabContextMenu: React.FC<TabContextMenuProps> = ({
    tab,
    onRename,
    onClose,
    onCloseOthers,
    onColorChange,
    children,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [position, setPosition] = useState<MenuPosition>({ x: 0, y: 0 });
    const [showColorSubmenu, setShowColorSubmenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLDivElement>(null);
    const closeTimeoutRef = useRef<number | null>(null);
    const submenuTimeoutRef = useRef<number | null>(null);

    // Handle submenu hover with delay
    const handleSubmenuEnter = () => {
        if (submenuTimeoutRef.current) {
            window.clearTimeout(submenuTimeoutRef.current);
        }
        submenuTimeoutRef.current = window.setTimeout(() => {
            setShowColorSubmenu(true);
        }, 500); // 500ms delay
    };

    const handleSubmenuLeave = () => {
        if (submenuTimeoutRef.current) {
            window.clearTimeout(submenuTimeoutRef.current);
        }
        // Add delay before closing to allow mouse movement to submenu
        submenuTimeoutRef.current = window.setTimeout(() => {
            setShowColorSubmenu(false);
        }, 200); // 200ms delay before closing
    };

    // Close menu with animation
    const closeMenu = useCallback(() => {
        setIsVisible(false);
        setShowColorSubmenu(false);
        closeTimeoutRef.current = window.setTimeout(() => {
            setIsOpen(false);
            closeTimeoutRef.current = null;
        }, 150);
    }, []);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (closeTimeoutRef.current) {
                window.clearTimeout(closeTimeoutRef.current);
            }
            if (submenuTimeoutRef.current) {
                window.clearTimeout(submenuTimeoutRef.current);
            }
        };
    }, []);

    // Close menu when clicking outside
    const handleClickOutside = useCallback((event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
            closeMenu();
        }
    }, [closeMenu]);

    // Close menu on escape
    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            closeMenu();
        }
    }, [closeMenu]);

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleKeyDown);
            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
                document.removeEventListener('keydown', handleKeyDown);
            };
        }
    }, [isOpen, handleClickOutside, handleKeyDown]);

    // Handle right-click
    const handleContextMenu = (event: React.MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();

        // Clear any pending close timeout
        if (closeTimeoutRef.current) {
            window.clearTimeout(closeTimeoutRef.current);
            closeTimeoutRef.current = null;
        }

        // Calculate position, keeping menu within viewport
        const x = Math.min(event.clientX, window.innerWidth - 220);
        const y = Math.min(event.clientY, window.innerHeight - 300);

        setPosition({ x, y });
        setIsVisible(false);
        setIsOpen(true);

        // Trigger fade-in on next frame
        requestAnimationFrame(() => {
            setIsVisible(true);
        });
    };

    const handleAction = (action: () => void) => {
        closeMenu();
        action();
    };

    const handleColorSelect = (color: TabColor) => {
        closeMenu();
        onColorChange(color);
    };

    return (
        <>
            <div ref={triggerRef} onContextMenu={handleContextMenu}>
                {children}
            </div>

            {isOpen &&
                createPortal(
                    <div
                        ref={menuRef}
                        className={`fixed z-[9999] min-w-[220px] py-1 bg-surface2/95 backdrop-blur-xl border border-highlight/50 rounded-card shadow-popover ring-1 ring-highlight/25 transition-[opacity,transform] duration-150 ease-out origin-top ${isVisible
                            ? 'opacity-100 scale-100 translate-y-0'
                            : 'opacity-0 scale-95 -translate-y-1 pointer-events-none'
                            }`}
                        style={{
                            left: position.x,
                            top: position.y,
                        }}
                    >
                        {/* Color submenu trigger */}
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setShowColorSubmenu(!showColorSubmenu)}
                                onMouseEnter={handleSubmenuEnter}
                                onMouseLeave={handleSubmenuLeave}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors outline-none cursor-pointer text-text1 hover:bg-highlight/15 hover:text-text1"
                            >
                                <Palette className="h-4 w-4" />
                                <span className="flex-1">Mudar cor</span>
                                <ChevronRight className="h-4 w-4" />
                            </button>

                            {/* Color submenu */}
                            {showColorSubmenu && (
                                <div
                                    className="absolute left-full top-0 ml-1 min-w-[180px] py-1 bg-surface2/95 backdrop-blur-xl border border-highlight/50 rounded-card shadow-popover ring-1 ring-highlight/25"
                                    onMouseEnter={() => {
                                        // Cancel any pending close timeout when entering submenu
                                        if (submenuTimeoutRef.current) {
                                            window.clearTimeout(submenuTimeoutRef.current);
                                        }
                                    }}
                                    onMouseLeave={handleSubmenuLeave}
                                >
                                    {COLOR_OPTIONS.map((color) => (
                                        <button
                                            key={color.id}
                                            type="button"
                                            onClick={() => handleColorSelect(color.id)}
                                            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left transition-colors outline-none cursor-pointer text-text1 hover:bg-highlight/15 hover:text-text1"
                                        >
                                            <div
                                                className="h-3 w-3 rounded-full"
                                                style={{ backgroundColor: color.rgb }}
                                            />
                                            <span>{color.name}</span>
                                            {tab.color === color.id && (
                                                <span className="ml-auto text-xs text-text3">✓</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <MenuSeparator />

                        <MenuItem
                            icon={<Edit3 className="h-4 w-4" />}
                            label="Renomear aba..."
                            onClick={() => handleAction(onRename)}
                        />

                        <MenuSeparator />

                        <MenuItem
                            icon={<XCircle className="h-4 w-4" />}
                            label="Fechar outras abas"
                            onClick={() => handleAction(onCloseOthers)}
                        />

                        <MenuItem
                            icon={<X className="h-4 w-4" />}
                            label="Fechar aba"
                            onClick={() => handleAction(onClose)}
                            destructive
                        />
                    </div>,
                    document.body
                )}
        </>
    );
};
