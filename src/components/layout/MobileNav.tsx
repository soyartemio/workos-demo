/**
 * MobileNav.tsx — Fixed Bottom Tab Bar for Mobile
 * Visible only on < md screens. Hidden on desktop.
 * 5 tabs: Home | Projects | Board | Workload | Me (Profile/Settings)
 */

import { motion } from 'framer-motion';
import { Home, FolderKanban, LayoutGrid, Users, UserCircle } from 'lucide-react';

export type MobileTab = 'home' | 'projects' | 'board' | 'workload' | 'me';

const TABS: { id: MobileTab; label: string; icon: React.ReactNode }[] = [
  { id: 'home',      label: 'Home',     icon: <Home size={20} /> },
  { id: 'projects',  label: 'Projects', icon: <FolderKanban size={20} /> },
  { id: 'board',     label: 'Board',    icon: <LayoutGrid size={20} /> },
  { id: 'workload',  label: 'Team',     icon: <Users size={20} /> },
  { id: 'me',        label: 'Me',       icon: <UserCircle size={20} /> },
];

interface Props {
  active: MobileTab;
  onChange: (tab: MobileTab) => void;
}

export const MobileNav: React.FC<Props> = ({ active, onChange }) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-[72px]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {/* Glass bar */}
      <div className="absolute inset-0 bg-base-950/90 backdrop-blur-2xl border-t border-white/[0.07]" />

      {/* Tabs */}
      <div className="relative flex items-center justify-around h-full px-2">
        {TABS.map(tab => {
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className="flex flex-col items-center justify-center gap-1 flex-1 h-full relative"
            >
              {/* Active glow pill */}
              {isActive && (
                <motion.div
                  layoutId="mobile-nav-pill"
                  className="absolute top-2 inset-x-2 h-[42px] rounded-2xl bg-brand-500/10 border border-brand-500/20"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <motion.div
                animate={{ scale: isActive ? 1.15 : 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className={`relative z-10 transition-colors ${isActive ? 'text-brand-400' : 'text-gray-500'}`}
              >
                {tab.icon}
              </motion.div>
              <span className={`relative z-10 text-[10px] font-semibold tracking-wide transition-colors ${isActive ? 'text-brand-400' : 'text-gray-600'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
