import { motion } from 'framer-motion';
import { Plus, Lightbulb, Share2, Sparkles, ArrowRight } from 'lucide-react';

interface EmptyStateProps {
  onAddClick: () => void;
}

export function EmptyState({ onAddClick }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-12 px-4 text-center"
    >
      {/* Hero Illustration */}
      <motion.div
        className="relative mb-8"
        animate={{
          y: [0, -8, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      >
        <motion.div
          className="w-24 h-24 rounded-3xl glass flex items-center justify-center neon-glow"
          animate={{
            boxShadow: [
              '0 0 20px hsl(var(--neon-purple) / 0.3)',
              '0 0 40px hsl(var(--neon-purple) / 0.5)',
              '0 0 20px hsl(var(--neon-purple) / 0.3)',
            ]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Lightbulb className="w-12 h-12 text-primary" />
        </motion.div>
        <motion.div
          className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full gradient-primary flex items-center justify-center"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Sparkles className="w-5 h-5 text-white" />
        </motion.div>
      </motion.div>

      <h2 className="text-xl font-bold text-foreground mb-2">
        Share your first architecture tip!
      </h2>
      <p className="text-sm text-muted-foreground mb-8 max-w-xs">
        Share knowledge with your team — design patterns,<br />best practices, and architecture insights
      </p>

      {/* How to use guide */}
      <div className="w-full max-w-sm mb-8 space-y-3">
        {[
          { num: 1, title: 'Share a Tip', desc: 'Add a link, article, or insight about architecture' },
          { num: 2, title: 'Categorize', desc: 'Tag it with categories like Cloud, DevOps, Security' },
          { num: 3, title: 'Team Learns', desc: 'Your team discovers and builds on shared knowledge' },
        ].map((step, index) => (
          <motion.div
            key={step.num}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
            className="flex items-start gap-3 text-left p-3 rounded-xl glass-card"
          >
            <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-white">{step.num}</span>
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground">{step.title}</p>
              <p className="text-xs text-muted-foreground">{step.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onAddClick}
        className="gradient-primary px-6 py-3 rounded-2xl font-semibold text-white flex items-center gap-2 neon-glow-orange"
      >
        <Plus className="w-4 h-4" />
        Add a Tip
        <ArrowRight className="w-4 h-4" />
      </motion.button>
    </motion.div>
  );
}
