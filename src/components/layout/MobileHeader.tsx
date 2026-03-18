/**
 * MobileHeader.tsx — Compact top header for mobile views
 * Shows app name + current view title + user avatar that opens the drawer
 */

import { motion } from 'framer-motion';
import { useDemoStore } from '../../store/demoStore';
import type { MobileTab } from './MobileNav';

const TAB_TITLES: Record<MobileTab, string> = {
  home:      'Work OS',
  projects:  'All Projects',
  board:     'Board',
  workload:  'Team Workload',
  me:        'My Profile',
};

interface Props {
  activeTab: MobileTab;
  onAvatarClick: () => void;
}

export const MobileHeader: React.FC<Props> = ({ activeTab, onAvatarClick }) => {
  const { currentUserId, users } = useDemoStore();
  const currentUser = users.find(u => u.id === currentUserId);

  return (
    <header className="md:hidden fixed top-0 left-0 right-0 z-40 h-14"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      {/* Glass surface */}
      <div className="absolute inset-0 bg-base-950/85 backdrop-blur-2xl border-b border-white/[0.07]" />

      <div className="relative flex items-center justify-between px-4 h-14">
        {/* Logo + title */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center shadow-[0_0_12px_rgba(59,130,246,0.5)]">
            <span className="text-white font-black text-[11px] tracking-tight">W</span>
          </div>
          <motion.h1
            key={activeTab}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-sm font-bold text-white"
          >
            {TAB_TITLES[activeTab]}
          </motion.h1>
        </div>

        {/* Avatar (opens drawer) */}
        <button
          onClick={onAvatarClick}
          className="relative"
        >
          {currentUser ? (
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-8 h-8 rounded-full border-2 border-brand-500/40 shadow-[0_0_8px_rgba(59,130,246,0.3)]"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-brand-600 border-2 border-brand-500/40 flex items-center justify-center">
              <span className="text-white text-xs font-bold">W</span>
            </div>
          )}
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-success-500 rounded-full border-2 border-base-950" />
        </button>
      </div>
    </header>
  );
};
