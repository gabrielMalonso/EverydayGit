# Tab Transition Pattern (Framer Motion)

Use this pattern for tab switches to keep the UI consistent across panels.

## Example

```tsx
import { AnimatePresence, motion } from 'framer-motion';

<AnimatePresence mode="wait" initial={false}>
  {activeTab === 'first' ? (
    <motion.div
      key="first"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.16, ease: 'easeOut' }}
    >
      {/* tab content */}
    </motion.div>
  ) : (
    <motion.div
      key="second"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.16, ease: 'easeOut' }}
    >
      {/* tab content */}
    </motion.div>
  )}
</AnimatePresence>
```

## Notes
- `mode="wait"` ensures one tab finishes exiting before the next enters.
- `initial={false}` avoids animating on first mount.
- `y: 6 -> 0 -> -6` gives a subtle vertical slide.

## Sliding Active Indicator (Tabs)

Use a single animated indicator that moves under the active tab. The visual style stays the same; only the indicator animates.

```tsx
import { AnimatedTabs } from '@/ui';

<AnimatedTabs
  ariaLabel="Branches and worktrees"
  value={activeTab}
  onChange={(next) => setActiveTab(next as 'branches' | 'worktrees')}
  items={[
    { key: 'branches', label: 'Branches' },
    { key: 'worktrees', label: 'Worktrees' },
  ]}
  containerClassName="rounded-button border border-border1 bg-surface2 p-1.5"
  tabClassName="rounded-button px-3 py-1.5 text-[15px] font-medium transition-colors"
  activeTextClassName="text-text1"
  inactiveTextClassName="text-text3 hover:text-text1"
  indicatorClassName="rounded-button bg-surface1 shadow-subtle"
/>
```

Notes:
- The indicator uses `x/width/height` from the active tab measurements.
- `ResizeObserver` + `document.fonts.ready` keep it aligned on resize/font load.
- `useReducedMotion` disables the spring when needed.
