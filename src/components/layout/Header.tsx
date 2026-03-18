/**
 * Header.tsx — Top navigation bar
 * Shows current project/view context, search, and quick action to add task
 */

import React, { useState, useEffect } from 'react';
import { Search, Bell, Zap, Eye, EyeOff, Lock, Sun, Moon } from 'lucide-react';
import { useDemoStore } from '../../store/demoStore';

interface Props {
  onAddTask: (projectId: string) => void;
}

export const Header: React.FC<Props> = ({ onAddTask }) => {
  const { isManagerView, toggleManagerView, projects, currentUserId, users } = useDemoStore();
  const [searchFocused, setSearchFocused] = useState(false);
  const [isLight, setIsLight] = useState(false);
  const currentUser = users.find(u => u.id === currentUserId);

  useEffect(() => {
    if (isLight) {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [isLight]);

  // Pick the first project for quick "Add Task" shortcut
  const firstProject = projects[0];

  return (
    <header className="h-14 border-b border-white/5 flex items-center justify-between px-6 shrink-0 bg-base-900/30 backdrop-blur-sm">
      {/* Left: Search */}
      <div className={`flex items-center gap-2 bg-base-800/50 border rounded-lg px-3 py-1.5 transition-all duration-200 w-64 ${searchFocused ? 'border-brand-500/50 w-80' : 'border-white/5 hover:border-white/10'}`}>
        <Search size={13} className="text-gray-600 shrink-0" />
        <input
          type="text"
          placeholder="Search tasks, projects..."
          className="bg-transparent border-none outline-none text-sm text-gray-300 placeholder-gray-600 w-full"
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
        />
        <kbd className="text-[9px] text-gray-700 bg-base-700 px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Manager view toggle */}
        <button
          onClick={toggleManagerView}
          title={isManagerView ? 'Switch to Standard View (hide financials)' : 'Switch to Manager View (show all data)'}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${isManagerView
            ? 'bg-brand-500/10 text-brand-400 border-brand-500/20 shadow-[0_0_10px_rgba(59,130,246,0.15)]'
            : 'bg-base-800/50 text-gray-500 border-white/5 hover:text-gray-300'
          }`}
        >
          {isManagerView ? <Eye size={12} /> : <><EyeOff size={12} /> <Lock size={10} /></>}
          {isManagerView ? 'Manager View' : 'Standard View'}
        </button>

        {/* AI Copilot badge */}
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-purple-600/20 to-brand-600/20 text-purple-300 border border-purple-500/20 hover:border-purple-500/40 transition-all">
          <Zap size={12} className="text-purple-400" />
          AI Copilot
        </button>

        {/* Add Task shortcut */}
        {firstProject && (
          <button
            onClick={() => onAddTask(firstProject.id)}
            className="bg-brand-600 hover:bg-brand-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-[0_0_12px_rgba(59,130,246,0.3)]"
          >
            + New Task
          </button>
        )}

        {/* Theme toggle */}
        <button
          onClick={() => setIsLight(!isLight)}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-gray-500 hover:text-brand-400 transition-colors"
          title={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        >
          {isLight ? <Moon size={15} /> : <Sun size={15} />}
        </button>

        {/* Notification bell */}
        <div className="relative">
          <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-gray-500 hover:text-gray-300 transition-colors">
            <Bell size={15} />
          </button>
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-danger-500 border border-base-950" />
        </div>

        {/* Avatar */}
        {currentUser && (
          <div className="w-7 h-7 rounded-full p-[1.5px] bg-gradient-to-tr from-brand-500 to-purple-500 shrink-0 cursor-pointer">
            <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full rounded-full border border-base-950" title={`${currentUser.name} · ${currentUser.role}`} />
          </div>
        )}
      </div>
    </header>
  );
};
