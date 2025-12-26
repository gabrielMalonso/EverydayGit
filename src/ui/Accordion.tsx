import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

export interface AccordionItem {
  id: string;
  title: React.ReactNode;
  content: React.ReactNode;
}

export interface AccordionProps {
  items: AccordionItem[];
  defaultOpen?: string;
  className?: string;
}

export const Accordion: React.FC<AccordionProps> = ({ items, defaultOpen, className }) => {
  const [openId, setOpenId] = useState<string | null>(defaultOpen ?? null);

  useEffect(() => {
    setOpenId(defaultOpen ?? null);
  }, [defaultOpen]);

  return (
    <div className={`space-y-2 ${className ?? ''}`}>
      {items.map((item) => {
        const isOpen = item.id === openId;
        const contentId = `${item.id}-content`;
        const triggerId = `${item.id}-trigger`;

        return (
          <div key={item.id} className="rounded-card-inner border border-border1 bg-surface1">
            <button
              id={triggerId}
              type="button"
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-surface2/60"
              onClick={() => setOpenId((prev) => (prev === item.id ? null : item.id))}
              aria-expanded={isOpen}
              aria-controls={contentId}
            >
              <span className="text-sm font-medium text-text1">{item.title}</span>
              <ChevronDown
                className={`h-4 w-4 text-text3 transition-transform duration-200 ease-out ${isOpen ? 'rotate-180' : ''}`}
                aria-hidden="true"
              />
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={contentId}
                  role="region"
                  aria-labelledby={triggerId}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden border-t border-border1"
                >
                  <div className="px-4 pb-4 pt-3">{item.content}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};

export default Accordion;
