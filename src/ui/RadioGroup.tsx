import React, { createContext, useContext, useId } from 'react';
import { cn } from '@/lib/utils';
import { Circle } from 'lucide-react';

// ============================================================================
// Context for RadioGroup
// ============================================================================
interface RadioGroupContextValue {
    value: string;
    onChange: (value: string) => void;
    name: string;
}

const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

const useRadioGroupContext = () => {
    const context = useContext(RadioGroupContext);
    if (!context) {
        throw new Error('RadioGroup.Item must be used within a RadioGroup');
    }
    return context;
};

// ============================================================================
// RadioGroup Root
// ============================================================================
export interface RadioGroupProps {
    value: string;
    onChange: (value: string) => void;
    children: React.ReactNode;
    className?: string;
    name?: string;
}

const RadioGroupRoot: React.FC<RadioGroupProps> = ({
    value,
    onChange,
    children,
    className,
    name,
}) => {
    const generatedName = useId();
    const groupName = name || generatedName;

    return (
        <RadioGroupContext.Provider value={{ value, onChange, name: groupName }}>
            <div
                role="radiogroup"
                className={cn('flex flex-col gap-3', className)}
            >
                {children}
            </div>
        </RadioGroupContext.Provider>
    );
};

// ============================================================================
// RadioGroup Item (with description support)
// ============================================================================
export interface RadioGroupItemProps {
    value: string;
    label: string;
    description?: string;
    className?: string;
    disabled?: boolean;
    warning?: boolean;
}

const RadioGroupItem: React.FC<RadioGroupItemProps> = ({
    value,
    label,
    description,
    className,
    disabled = false,
    warning = false,
}) => {
    const { value: selectedValue, onChange, name } = useRadioGroupContext();
    const isSelected = selectedValue === value;
    const inputId = `${name}-${value}`;

    const handleChange = () => {
        if (!disabled) {
            onChange(value);
        }
    };

    return (
        <label
            htmlFor={inputId}
            className={cn(
                'relative flex cursor-pointer items-start gap-3 rounded-md p-3',
                'border border-border1 transition-colors',
                'hover:bg-surface2/50',
                isSelected && 'border-primary bg-primary/5',
                disabled && 'cursor-not-allowed opacity-50',
                className
            )}
        >
            <input
                type="radio"
                id={inputId}
                name={name}
                value={value}
                checked={isSelected}
                onChange={handleChange}
                disabled={disabled}
                className="sr-only"
            />

            {/* Custom radio indicator */}
            <div
                className={cn(
                    'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center',
                    'rounded-full border-2 transition-colors',
                    isSelected
                        ? 'border-primary bg-primary'
                        : 'border-border2 bg-transparent'
                )}
            >
                {isSelected && (
                    <Circle className="h-1.5 w-1.5 fill-primary-contrast text-primary-contrast" />
                )}
            </div>

            {/* Label and description */}
            <div className="flex flex-col gap-0.5">
                <span
                    className={cn(
                        'text-sm font-medium',
                        isSelected ? 'text-text1' : 'text-text2'
                    )}
                >
                    {label}
                </span>
                {description && (
                    <span
                        className={cn(
                            'text-xs leading-relaxed',
                            warning ? 'text-danger' : 'text-text3'
                        )}
                    >
                        {description}
                    </span>
                )}
            </div>
        </label>
    );
};

// ============================================================================
// Export compound component
// ============================================================================
export const RadioGroup = Object.assign(RadioGroupRoot, {
    Item: RadioGroupItem,
});

