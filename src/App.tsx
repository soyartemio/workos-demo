/**
 * App.tsx — Main Application Shell (Mobile + Desktop)
 *
 * Desktop: Left Sidebar + Header + Workspace/CEO Dashboard (unchanged)
 * Mobile: 
 *   - MobileHeader (top bar + avatar)
 *   - MobileNav (bottom tab bar)
 *   - MobileHome | ProjectsPanel | KanbanBoard | WorkloadView | MobileProfile
 *   - MobileDrawer (bottom sheet for departments + roles + settings)
 */

import { useState } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Workspace } from './components/layout/Workspace';
import { MobileNav, type MobileTab } from './components/layout/MobileNav';
import { MobileHeader } from './components/layout/MobileHeader';
import { MobileDrawer } from './components/layout/MobileDrawer';
import { MobileHome } from './components/mobile/MobileHome';
import { CEODashboard } from './components/dashboard/CEODashboard';
import { DepartmentView } from './components/dashboard/DepartmentView';
import { AddTaskModal } from './components/modals/AddTaskModal';
import { TaskDetailPanel } from './components/modals/TaskDetailPanel';
import { KanbanBoard } from './components/workspace/KanbanBoard';
import { WorkloadView } from './components/workspace/WorkloadView';
import { ProjectsPanel } from './components/workspace/ProjectsPanel';
import { useDemoStore } from './store/demoStore';

function App() {
  const { activeDepartmentId, setActiveDepartment } = useDemoStore();

  // Desktop state
  const [currentView, setCurrentView] = useState<'dashboard' | 'workspace'>('workspace');

  // Mobile state
  const [mobileTab, setMobileTab] = useState<MobileTab>('home');
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Shared modals
  const [addTaskProjectId, setAddTaskProjectId] = useState<string | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  const handleAddTask = (projectId: string) => setAddTaskProjectId(projectId);
  const handleOpenTask = (taskId: string) => setActiveTaskId(taskId);
  const handleDeptSelect = (deptId: string) => {
    setActiveDepartment(deptId);
    setCurrentView('dashboard');
    setMobileTab('home');    // on mobile, switch to home-ish
  };

  // ── Mobile view content ────────────────────────────────────────────────────
  const renderMobileContent = () => {
    switch (mobileTab) {
      case 'home':
        return activeDepartmentId ? (
          <DepartmentView onBack={() => setActiveDepartment(null)} onAddTask={handleAddTask} />
        ) : (
          <MobileHome onDeptSelect={handleDeptSelect} onTaskOpen={handleOpenTask} />
        );
      case 'projects':

        return <ProjectsPanel onAddTask={handleAddTask} />;
      case 'board':
        return (
          <div className="h-full overflow-hidden -mx-4">
            <KanbanBoard onAddTask={handleAddTask} onOpenTask={handleOpenTask} />
          </div>
        );
      case 'workload':
        return <WorkloadView />;
      case 'me':
        return <MobileProfile />;
      default:
        return <MobileHome onDeptSelect={handleDeptSelect} onTaskOpen={handleOpenTask} />;
    }
  };

  return (
    <div className="flex h-screen w-full bg-base-950 text-gray-200 overflow-hidden font-inter">

      {/* ═══════════════ DESKTOP LAYOUT (md+) ════════════════════════════════ */}
      <Sidebar
        className="hidden md:flex"
        currentView={currentView}
        onViewChange={v => { setCurrentView(v); if (v === 'workspace') setActiveDepartment(null); }}
      />

      <div className="hidden md:flex flex-col flex-1 h-full min-w-0">
        <Header onAddTask={handleAddTask} />
        <main className="flex-1 overflow-auto">
          {currentView === 'dashboard' ? (
            <div className="p-6 max-w-[1400px] mx-auto">
              {activeDepartmentId ? (
                <DepartmentView onBack={() => setActiveDepartment(null)} onAddTask={handleAddTask} />
              ) : (
                <CEODashboard />
              )}
            </div>
          ) : (
            <Workspace onAddTask={handleAddTask} onOpenTask={handleOpenTask} />
          )}
        </main>
      </div>

      {/* ═══════════════ MOBILE LAYOUT (< md) ════════════════════════════════ */}
      <div className="md:hidden flex flex-col w-full h-full">
        {/* Top header */}
        <MobileHeader
          activeTab={mobileTab}
          onAvatarClick={() => setDrawerOpen(true)}
        />

        {/* Main scrollable content — padded for header (56px) + nav bar (72px) */}
        <main className="flex-1 overflow-y-auto" style={{ paddingTop: '56px', paddingBottom: '80px' }}>
          <div className="px-4 pt-4">
            {renderMobileContent()}
          </div>
        </main>

        {/* Bottom tab nav */}
        <MobileNav active={mobileTab} onChange={setMobileTab} />

        {/* Bottom drawer */}
        <MobileDrawer
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          onDeptSelect={handleDeptSelect}
        />
      </div>

      {/* ═══════════════ GLOBAL MODALS (both layouts) ════════════════════════ */}
      {addTaskProjectId && (
        <AddTaskModal
          projectId={addTaskProjectId}
          onClose={() => setAddTaskProjectId(null)}
        />
      )}

      {activeTaskId && (
        <TaskDetailPanel
          taskId={activeTaskId}
          onClose={() => setActiveTaskId(null)}
        />
      )}

    </div>
  );
}

export default App;

// ── Simple Mobile Profile placeholder ────────────────────────────────────────
const MobileProfile = () => {
  const { users, currentUserId, isManagerView, toggleManagerView, resetToDefaults } = useDemoStore();
  const user = users.find(u => u.id === currentUserId);
  if (!user) return null;
  return (
    <div className="flex flex-col gap-5 pb-8">
      <div className="glass-panel rounded-2xl p-5 flex items-center gap-4">
        <img src={user.avatar} alt={user.name} className="w-14 h-14 rounded-full border-2 border-brand-500/30 shadow-[0_0_12px_rgba(59,130,246,0.3)]" />
        <div>
          <p className="font-bold text-white text-lg leading-tight">{user.name}</p>
          <p className="text-xs text-brand-400 font-medium uppercase tracking-widest mt-0.5">{user.role}</p>
          <p className="text-[10px] text-gray-500 mt-1">{user.email}</p>
        </div>
      </div>
      <div className="glass-panel rounded-2xl p-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-200">Manager View</p>
          <p className="text-[10px] text-gray-500">Show budgets & financial data</p>
        </div>
        <button
          onClick={toggleManagerView}
          className={`relative w-11 h-6 rounded-full transition-all ${isManagerView ? 'bg-brand-500' : 'bg-base-700'}`}
        >
          <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${isManagerView ? 'left-6' : 'left-1'}`} />
        </button>
      </div>
      <button
        onClick={() => { if (confirm('Reset demo data?')) resetToDefaults(); }}
        className="p-4 rounded-2xl bg-danger-500/5 border border-danger-500/20 text-danger-400 text-sm font-medium flex items-center justify-center gap-2"
      >
        Reset Demo Data
      </button>
    </div>
  );
};
