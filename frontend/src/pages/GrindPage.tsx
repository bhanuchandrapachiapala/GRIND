import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { TopBar } from '../components/layout/TopBar';
import { PageWrapper } from '../components/layout/PageWrapper';
import { LeetCodeLogger } from '../components/grind/LeetCodeLogger';
import { ApplicationsLogger } from '../components/grind/ApplicationsLogger';
import { AWSChecklist } from '../components/grind/AWSChecklist';

const TABS = [
  { key: 'leetcode', label: 'LeetCode' },
  { key: 'applications', label: 'Applications' },
  { key: 'aws', label: 'AWS' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export function GrindPage() {
  const [tab, setTab] = useState<TabKey>('leetcode');
  return (
    <PageWrapper>
      <TopBar title="Grind" subtitle="The non-negotiables" />
      <div className="-mx-1 px-1 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                tab === t.key
                  ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/40 shadow-neon-sm'
                  : 'bg-white/5 text-text-secondary border border-white/10'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="space-y-4 pt-1"
        >
          {tab === 'leetcode' && <LeetCodeLogger />}
          {tab === 'applications' && <ApplicationsLogger />}
          {tab === 'aws' && <AWSChecklist />}
        </motion.div>
      </AnimatePresence>
    </PageWrapper>
  );
}
