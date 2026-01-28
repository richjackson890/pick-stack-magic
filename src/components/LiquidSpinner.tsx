import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface LiquidSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LiquidSpinner({ size = 'md', className }: LiquidSpinnerProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
  };

  return (
    <div className={cn('relative', sizeClasses[size], className)}>
      {/* Outer liquid blob */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'linear-gradient(135deg, hsl(var(--neon-purple)), hsl(var(--neon-cyan)))',
        }}
        animate={{
          borderRadius: [
            '60% 40% 30% 70% / 60% 30% 70% 40%',
            '30% 60% 70% 40% / 50% 60% 30% 60%',
            '60% 40% 30% 70% / 60% 30% 70% 40%',
          ],
          rotate: [0, 180, 360],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      
      {/* Inner glow */}
      <motion.div
        className="absolute inset-2 rounded-full bg-background/80"
        animate={{
          borderRadius: [
            '40% 60% 70% 30% / 40% 50% 50% 60%',
            '70% 30% 30% 70% / 60% 40% 60% 40%',
            '40% 60% 70% 30% / 40% 50% 50% 60%',
          ],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 0.2,
        }}
      />
      
      {/* Center dot */}
      <motion.div
        className="absolute inset-0 m-auto w-1/3 h-1/3 rounded-full"
        style={{
          background: 'linear-gradient(135deg, hsl(var(--neon-cyan)), hsl(var(--neon-purple)))',
        }}
        animate={{
          scale: [0.8, 1.2, 0.8],
          opacity: [0.6, 1, 0.6],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
}

interface AnalysisStepsProps {
  currentStep: number;
  className?: string;
}

const steps = [
  { label: '링크 확인중', icon: '🔗' },
  { label: '요약 생성중', icon: '✨' },
  { label: '태그/카테고리 정리중', icon: '🏷️' },
];

export function AnalysisSteps({ currentStep, className }: AnalysisStepsProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {steps.map((step, index) => (
        <motion.div
          key={step.label}
          initial={{ opacity: 0, x: -10 }}
          animate={{ 
            opacity: index <= currentStep ? 1 : 0.4,
            x: 0,
          }}
          transition={{ delay: index * 0.15 }}
          className={cn(
            'flex items-center gap-2 text-sm',
            index === currentStep && 'text-primary font-medium',
            index < currentStep && 'text-neon-cyan',
            index > currentStep && 'text-muted-foreground'
          )}
        >
          <motion.span
            animate={index === currentStep ? {
              scale: [1, 1.2, 1],
            } : {}}
            transition={{ duration: 0.5, repeat: index === currentStep ? Infinity : 0 }}
          >
            {step.icon}
          </motion.span>
          <span>{step.label}</span>
          {index < currentStep && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-neon-cyan"
            >
              ✓
            </motion.span>
          )}
          {index === currentStep && (
            <LiquidSpinner size="sm" className="ml-auto" />
          )}
        </motion.div>
      ))}
    </div>
  );
}
