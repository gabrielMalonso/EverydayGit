import React, { useEffect, useMemo, useRef, useState } from 'react';

export type SelectValue = string | number;

export type SelectOption = {
  value: SelectValue;
  label: React.ReactNode;
  key?: React.Key;
  type?: 'option' | 'divider';
  disabled?: boolean;
};

export interface SelectMenuProps {
  id: string;
  value?: SelectValue;
  options: SelectOption[];
  onChange: (value: SelectValue, option: SelectOption) => void;
  disabled?: boolean;
  buttonClassName?: string;
  buttonContentClassName?: string;
  menuWidthClass?: string;
  menuClassName?: string;
  align?: 'left' | 'right';
  renderTriggerValue?: (option: SelectOption | null) => React.ReactNode;
  renderOptionLabel?: (option: SelectOption, ctx: { isSelected: boolean; isActive: boolean }) => React.ReactNode;
  placeholder?: React.ReactNode;
  ariaLabel?: string;
  ariaLabelledby?: string;
  ariaDescribedby?: string;
  ariaInvalid?: boolean | 'true' | 'false';
  showChevron?: boolean;
}

const basePopoverClasses =
  'absolute z-50 mt-2 overflow-hidden rounded-card border border-highlight/50 shadow-popover ring-1 ring-highlight/25';
const defaultMenuClassName = 'bg-surface3';
const baseOptionClasses =
  'w-full px-2 py-2.5 text-left text-sm text-text1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--focus-ring))]';
const selectedOptionClasses = 'bg-primary/30 text-primaryContrast font-semibold';
const activeOptionClasses = 'bg-primary/15';
const defaultOptionClasses = 'hover:bg-primary/10';

export const SelectMenu: React.FC<SelectMenuProps> = ({
  id,
  value,
  options,
  onChange,
  disabled = false,
  buttonClassName = 'flex w-full items-center justify-between gap-2 rounded-input border border-border1 bg-surface2 px-3 py-2.5 text-sm text-text1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--focus-ring))]',
  buttonContentClassName = 'flex min-w-0 flex-1 items-center gap-2',
  menuWidthClass = 'w-full',
  menuClassName = defaultMenuClassName,
  align = 'left',
  renderTriggerValue,
  renderOptionLabel,
  placeholder = '',
  ariaLabel,
  ariaLabelledby,
  ariaDescribedby,
  ariaInvalid = false,
  showChevron = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const closeTimeoutRef = useRef<number | null>(null);

  const normalizedOptions = useMemo(
    () =>
      options.map((option, index) => ({
        ...option,
        value: option.value ?? '',
        label: option.label ?? '',
        key: option.key ?? option.value ?? index,
        type: option.type ?? 'option',
        disabled: Boolean(option.disabled),
      })),
    [options],
  );

  const selectableOptions = useMemo(
    () => normalizedOptions.filter((opt) => opt.type !== 'divider' && !opt.disabled),
    [normalizedOptions],
  );

  const selectedOption = useMemo(
    () => normalizedOptions.find((option) => String(option.value) === String(value)) ?? null,
    [normalizedOptions, value],
  );

  const openMenu = () => {
    if (disabled || !normalizedOptions.length) return;
    if (closeTimeoutRef.current) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setIsOpen(true);
    // Delay para permitir que o elemento seja montado antes de animar
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
    });
  };

  const closeMenu = () => {
    setIsVisible(false);
    setActiveIndex(-1);
    // Aguarda a animação terminar antes de desmontar
    closeTimeoutRef.current = window.setTimeout(() => {
      setIsOpen(false);
      closeTimeoutRef.current = null;
    }, 150);
  };

  const handleSelect = (option: SelectOption) => {
    if (!option || option.disabled) return;
    onChange(option.value, option);
    closeMenu();
  };

  const moveActive = (delta: number) => {
    if (!selectableOptions.length) return;
    setActiveIndex((prev) => {
      const base = prev >= 0 ? prev : selectableOptions.findIndex((opt) => opt.value === selectedOption?.value);
      const startIndex = base >= 0 ? base : 0;
      const nextIndex = (startIndex + delta + selectableOptions.length) % selectableOptions.length;
      return nextIndex;
    });
  };

  const handleTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!isOpen) {
        openMenu();
        const index = selectableOptions.findIndex((option) => option.value === selectedOption?.value);
        setActiveIndex(index >= 0 ? index : 0);
      } else {
        moveActive(1);
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!isOpen) {
        openMenu();
        const index = selectableOptions.findIndex((option) => option.value === selectedOption?.value);
        setActiveIndex(index >= 0 ? index : selectableOptions.length - 1);
      } else {
        moveActive(-1);
      }
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (isOpen && activeIndex >= 0 && selectableOptions[activeIndex]) {
        handleSelect(selectableOptions[activeIndex]);
      } else {
        openMenu();
      }
    } else if (event.key === 'Escape' && isOpen) {
      event.preventDefault();
      closeMenu();
    }
  };

  const handleOptionKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, option: SelectOption) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveActive(1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveActive(-1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      setActiveIndex(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      setActiveIndex(selectableOptions.length - 1);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleSelect(option);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      closeMenu();
    }
  };

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        window.clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handlePointer = (event: MouseEvent | TouchEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        closeMenu();
      }
    };
    const listenerOptions: AddEventListenerOptions = { capture: true };
    document.addEventListener('mousedown', handlePointer, listenerOptions);
    document.addEventListener('touchstart', handlePointer, listenerOptions);
    return () => {
      document.removeEventListener('mousedown', handlePointer, listenerOptions);
      document.removeEventListener('touchstart', handlePointer, listenerOptions);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const index = selectableOptions.findIndex((option) => option.value === selectedOption?.value);
    setActiveIndex(index >= 0 ? index : -1);
  }, [isOpen, selectableOptions, selectedOption]);

  useEffect(() => {
    if (!isOpen) return;
    const activeOption = optionRefs.current[activeIndex];
    if (activeOption) {
      activeOption.focus();
      activeOption.scrollIntoView({ block: 'nearest' });
    }
  }, [isOpen, activeIndex]);

  const triggerContent =
    (renderTriggerValue && renderTriggerValue(selectedOption)) ||
    selectedOption?.label ||
    placeholder ||
    '';

  optionRefs.current = [];

  return (
    <div ref={wrapperRef} className="relative">
      <button
        id={id}
        type="button"
        className={buttonClassName}
        onClick={() => {
          if (isOpen) {
            closeMenu();
          } else {
            openMenu();
          }
        }}
        onKeyDown={handleTriggerKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? `${id}-listbox` : undefined}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledby}
        aria-describedby={ariaDescribedby}
        aria-invalid={ariaInvalid}
        disabled={disabled}
      >
        <span className={buttonContentClassName}>{triggerContent}</span>
        {showChevron && (
          <svg
            className={`h-4 w-4 text-text3 transition-transform duration-200 ease-out ${isOpen ? 'rotate-180' : ''}`}
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
          >
            <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        )}
      </button>
      {isOpen && !disabled && (
        <div
          id={`${id}-listbox`}
          role="listbox"
          tabIndex={-1}
          className={`${basePopoverClasses} ${menuWidthClass} ${align === 'right' ? 'right-0' : 'left-0'} ${menuClassName} transition-all duration-150 ease-out origin-top ${
            isVisible
              ? 'opacity-100 scale-100 translate-y-0'
              : 'opacity-0 scale-95 -translate-y-1'
          }`}
        >
          <div className="max-h-60 overflow-y-auto">
          <ul className="list-none p-0 m-0 divide-y divide-border1/60">
            {normalizedOptions.map((option, index) => {
              if (option.type === 'divider') {
                return (
                  <li
                    key={option.key ?? `divider-${index}`}
                    role="separator"
                    className="h-[2px] bg-border1"
                    aria-hidden="true"
                  />
                );
              }

              const selectableIndex = selectableOptions.findIndex((opt) => opt.value === option.value);
              const isSelected = option.value === selectedOption?.value;
              const isActive = selectableIndex === activeIndex;
              const optionLabel =
                (renderOptionLabel && renderOptionLabel(option, { isSelected, isActive })) || option.label;
              const isDisabledOption = Boolean(option.disabled);

              return (
                <li key={option.key ?? option.value ?? index}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={isDisabledOption}
                    disabled={isDisabledOption}
                    onClick={() => handleSelect(option)}
                    className={`${baseOptionClasses} ${
                      isDisabledOption
                        ? 'cursor-not-allowed opacity-45'
                        : isSelected
                          ? selectedOptionClasses
                          : isActive
                            ? activeOptionClasses
                            : defaultOptionClasses
                    }`}
                    onKeyDown={(event) => handleOptionKeyDown(event, option)}
                    ref={(element) => {
                      if (!isDisabledOption && selectableIndex >= 0) {
                        optionRefs.current[selectableIndex] = element;
                      }
                    }}
                  >
                    {optionLabel}
                  </button>
                </li>
              );
            })}
          </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectMenu;
