/**
 * Sidebar.tsx — ClickUp-style deep navigation sidebar
 * Now connected to the store for dynamic departments/projects
 */

import React from 'react';
import { LayoutDashboard, BarChart3, FolderClosed, PlusCircle, Users, Settings } from 'lucide-react';
import { useDemoStore } from '../../store/demoStore';

type ViewType = 'dashboard' | 'workspace';

interface Props {
  currentView: ViewType;
  onViewChange: (v: ViewType) => void;
  className?: string;
}

export const Sidebar: React.FC<Props> = ({ currentView, onViewChange, className }) => {

  const {
    departments, projects, users,
    activeDepartmentId, setActiveDepartment,
    currentUserId, switchUser, isManagerView, toggleManagerView
  } = useDemoStore();

  const [expandedDepts, setExpandedDepts] = React.useState<Record<string, boolean>>({
    'dept-eng': true, 'dept-mkt': false, 'dept-des': false, 'dept-ops': false,
  });
  const currentUser = users.find(u => u.id === currentUserId);

  const toggleDept = (id: string) => setExpandedDepts(p => ({ ...p, [id]: !p[id] }));

  const isContributor = currentUser?.role === 'Contributor';
  const mainDepts = departments.filter(d => {
    if (d.id === 'dept-exec') return false;
    if (isContributor && currentUser?.departmentId !== d.id) return false;
    return true;
  });

  return (
    <aside className={`w-64 h-full bg-base-950 border-r border-white/5 flex flex-col shrink-0 ${className ?? ''}`}>

      {/* Workspace Logo */}
      <div className="h-14 flex items-center px-4 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-600 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-[0_0_12px_rgba(99,102,241,0.4)]">
            W
          </div>
          <div>
            <span className="font-semibold text-sm text-white">Workspace AI</span>
            <span className="block text-[10px] text-gray-600">Enterprise Edition</span>
          </div>
        </div>
      </div>

      {/* Scrollable Nav */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">

        {/* Main Nav */}
        <div className="space-y-0.5">
          <NavItem
            icon={<LayoutDashboard size={15} />}
            text="Executive Dashboard"
            active={currentView === 'dashboard' && !activeDepartmentId}
            onClick={() => { onViewChange('dashboard'); setActiveDepartment(null); }}
          />
          <NavItem
            icon={<BarChart3 size={15} />}
            text="Project Workspace"
            active={currentView === 'workspace'}
            onClick={() => onViewChange('workspace')}
          />
        </div>

        {/* Departments — dynamic from store */}
        <div className="space-y-0.5">
          <div className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest px-2 mb-2 flex justify-between group">
            <span>Departments</span>
            <PlusCircle size={12} className="opacity-0 group-hover:opacity-100 cursor-pointer text-brand-500 transition-opacity" />
          </div>

          {mainDepts.map(dept => {
            const deptProjects = projects.filter(p => p.departmentId === dept.id);
            const isExpanded = expandedDepts[dept.id];
            const isDeptActive = activeDepartmentId === dept.id;

            return (
              <div key={dept.id} className="space-y-0.5">
                <div
                  onClick={() => toggleDept(dept.id)}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-sm transition-colors group ${isDeptActive ? 'text-gray-100 bg-white/5' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'}`}
                >
                  <FolderClosed size={14} className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} style={{ color: dept.color }} />
                  <span className="font-medium truncate">{dept.name}</span>
                  <span className="ml-auto text-[10px] text-gray-600">{deptProjects.length}</span>
                </div>

                {isExpanded && deptProjects.map(proj => (
                  <div
                    key={proj.id}
                    onClick={() => { onViewChange('dashboard'); setActiveDepartment(dept.id); }}
                    className="ml-5 flex items-center gap-2 px-2 py-1 rounded-md cursor-pointer text-xs text-gray-500 hover:bg-white/5 hover:text-gray-300 transition-colors truncate"
                  >
                    <span className="w-1 h-1 rounded-full bg-gray-700" />
                    <span className="truncate">{proj.name}</span>
                    {(proj.status === 'At Risk') && <span className="ml-auto text-warning-500 text-[9px]">⚠</span>}
                    {(proj.status === 'Off Track') && <span className="ml-auto text-danger-500 text-[9px]">!</span>}
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        {/* Quick User Switcher — Demo Feature */}
        <div className="space-y-0.5">
          <div className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest px-2 mb-2 flex items-center gap-1">
            <Users size={10} /> Switch Role (Demo)
          </div>
          <div className="space-y-0.5">
            {users.slice(0, 6).map(u => (
              <div
                key={u.id}
                onClick={() => switchUser(u.id)}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-xs transition-colors ${u.id === currentUserId ? 'bg-brand-500/15 text-brand-300 font-medium' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}
              >
                <img src={u.avatar} alt={u.name} className="w-5 h-5 rounded-full border border-white/10" />
                <span className="truncate">{u.name.split(' ')[0]}</span>
                <span className="ml-auto text-[10px] text-gray-500">{u.role}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom: Current User + Manager Toggle */}
      <div className="p-3 border-t border-white/5 space-y-2">
        {/* Manager/Standard toggle */}
        <button
          onClick={toggleManagerView}
          className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-xs transition-colors ${isManagerView ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20' : 'text-gray-500 hover:bg-white/5'}`}
        >
          <span><Settings size={11} className="inline mr-1.5" />{isManagerView ? 'Manager View' : 'Standard View'}</span>
          <span className="text-[9px] uppercase tracking-wider">{isManagerView ? 'ON' : 'OFF'}</span>
        </button>

        {currentUser && (
          <div className="flex items-center gap-2 px-1">
            <div className="w-7 h-7 rounded-full p-[1.5px] bg-gradient-to-tr from-brand-500 to-purple-500 shrink-0">
              <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full rounded-full border border-base-950" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-200 truncate">{currentUser.name}</p>
              <p className="text-[10px] text-gray-600">{currentUser.role}</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

const NavItem = ({ icon, text, active, onClick }: { icon: React.ReactNode; text: string; active: boolean; onClick?: () => void }) => (
  <div
    onClick={onClick}
    className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-sm transition-colors ${active ? 'bg-brand-500/10 text-brand-400 font-medium' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'}`}
  >
    <span className={active ? 'text-brand-400' : 'text-gray-600'}>{icon}</span>
    {text}
  </div>
);
