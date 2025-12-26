import { motion, type SVGMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface SpinnerProps extends Omit<SVGMotionProps<SVGSVGElement>, 'animate' | 'transition'> {
  label?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ className, label = 'Loading', ...props }) => {
  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      role="status"
      aria-label={label}
      className={cn('h-4 w-4 text-current', className)}
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: 'linear',
      }}
      {...props}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </motion.svg>
  );
};

