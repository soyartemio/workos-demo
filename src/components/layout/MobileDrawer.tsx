/**
 * MobileDrawer.tsx — Bottom Sheet Navigation Drawer for Mobile
 * Slides up 75% of screen on avatar tap.
 * Contains: Departments, Role Switcher, Manager View toggle, Reset Demo
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, RefreshCw } from 'lucide-react';
import { useDemoStore } from '../../store/demoStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onDeptSelect: (deptId: string) => void;
}

export const MobileDrawer: React.FC<Props> = ({ isOpen, onClose, onDeptSelect }) => {
  const {
    departments, projects,
    users, currentUserId,
    switchUser, isManagerView, toggleManagerView,
    resetToDefaults,
  } = useDemoStore();

  const mainDepts = departments.filter(d => d.id !== 'dept-exec');

  const DEPT_STATUS_MAP: Record<string, { label: string; cls: string }> = {
    'dept-eng': { label: 'At Risk', cls: 'bg-warning-500/10 text-warning-500 border-warning-500/20' },
    'dept-mkt': { label: 'At Risk', cls: 'bg-warning-500/10 text-warning-500 border-warning-500/20' },
    'dept-des': { label: 'On Track', cls: 'bg-success-500/10 text-success-500 border-success-500/20' },
    'dept-ops': { label: 'Completed', cls: 'bg-brand-500/10 text-brand-400 border-brand-500/20' },
  };

  const handleReset = () => {
    if (confirm('Reset all demo data to defaults?')) {
      resetToDefaults();
      onClose();
    }
  };

  const visibleUsers = users.filter(u => ['u-ceo', 'u-eng-dir', 'u-eng-1', 'u-eng-3', 'u-mkt-dir'].includes(u.id));

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="md:hidden fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 300 }}
            className="md:hidden fixed bottom-0 left-0 right-0 z-[80] max-h-[80vh] flex flex-col rounded-t-3xl overflow-hidden"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            {/* Glass surface */}
            <div className="absolute inset-0 bg-base-900/95 backdrop-blur-3xl border-t border-white/10" />

            {/* Pull handle */}
            <div className="relative pt-3 pb-1 flex justify-center shrink-0">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            {/* Header */}
            <div className="relative flex items-center justify-between px-5 py-3 border-b border-white/5 shrink-0">
              <h2 className="text-base font-bold text-white">Workspace</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10 text-gray-400 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="relative flex-1 overflow-y-auto px-5 pb-6 space-y-5">

              {/* Departments Section */}
              <section className="pt-4">
                <p className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.15em] mb-2">Departments</p>
                <div className="flex flex-col gap-1">
                  {mainDepts.map(dept => {
                    const deptProjects = projects.filter(p => p.departmentId === dept.id);
                    const statusCfg = DEPT_STATUS_MAP[dept.id];
                    return (
                      <button
                        key={dept.id}
                        onClick={() => { onDeptSelect(dept.id); onClose(); }}
                        className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-all active:scale-[0.98]"
                      >
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: dept.color, boxShadow: `0 0 6px ${dept.color}80` }} />
                        <span className="text-sm font-medium text-gray-200 flex-1 text-left">{dept.name}</span>
                        <span className="text-[10px] text-gray-500">{deptProjects.length} projects</span>
                        {statusCfg && (
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border uppercase tracking-wider ${statusCfg.cls}`}>
                            {statusCfg.label}
                          </span>
                        )}
                        <ChevronRight size={14} className="text-gray-600 shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Role Switcher */}
              <section>
                <p className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.15em] mb-3">Switch Role (Demo)</p>
                <div className="flex gap-3 flex-wrap">
                  {visibleUsers.map(user => {
                    const isActive = user.id === currentUserId;
                    return (
                      <button
                        key={user.id}
                        onClick={() => { switchUser(user.id); onClose(); }}
                        className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all ${
                          isActive
                            ? 'border-brand-500/40 bg-brand-500/10'
                            : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.05]'
                        }`}
                      >
                        <div className="relative">
                          <img src={user.avatar} alt={user.name} className={`w-10 h-10 rounded-full ${isActive ? 'ring-2 ring-brand-500' : ''}`} />
                          {isActive && <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success-500 rounded-full border-2 border-base-900" />}
                        </div>
                        <span className="text-[10px] font-medium text-gray-300 whitespace-nowrap">{user.name.split(' ')[0]}</span>
                        <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${isActive ? 'bg-brand-500 text-white' : 'text-gray-600'}`}>
                          {user.role}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Settings */}
              <section>
                <p className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.15em] mb-3">Settings</p>
                <div className="flex flex-col gap-2">
                  {/* Manager View Toggle */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5">
                    <div>
                      <p className="text-sm font-medium text-gray-200">Manager View</p>
                      <p className="text-[10px] text-gray-600">Show budgets & financial data</p>
                    </div>
                    <button
                      onClick={toggleManagerView}
                      className={`relative w-11 h-6 rounded-full transition-all ${isManagerView ? 'bg-brand-500' : 'bg-base-700'}`}
                    >
                      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${isManagerView ? 'left-6' : 'left-1'}`} />
                    </button>
                  </div>

                  {/* Theme Toggle */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5">
                    <div>
                      <p className="text-sm font-medium text-gray-200">Light Mode</p>
                      <p className="text-[10px] text-gray-600">Switch to a brighter workspace</p>
                    </div>
                    <button
                      onClick={() => {
                        const isLight = document.documentElement.getAttribute('data-theme') === 'light';
                        if (isLight) document.documentElement.removeAttribute('data-theme');
                        else document.documentElement.setAttribute('data-theme', 'light');
                      }}
                      className="w-11 h-6 rounded-full bg-base-700 border border-white/10 flex items-center justify-center text-xs relative overflow-hidden"
                    >
                      <span className="w-full text-center text-[10px]">🌓</span>
                    </button>
                  </div>

                  {/* Reset Demo */}
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-2 p-3 rounded-xl bg-danger-500/5 border border-danger-500/10 text-danger-500 hover:bg-danger-500/10 transition-all active:scale-[0.98]"
                  >
                    <RefreshCw size={14} />
                    <span className="text-sm font-medium">Reset Demo Data</span>
                  </button>
                </div>
              </section>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
