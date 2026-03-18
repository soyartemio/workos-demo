/**
 * App.tsx — Main Application Shell
 * Handles navigation between CEO Dashboard, Department Drill-Down, and Workspace views
 * No react-router needed — uses activeDepartmentId and activeProjectId from store for simplicity
 */

import { useState } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Workspace } from './components/layout/Workspace';
import { CEODashboard } from './components/dashboard/CEODashboard';
import { DepartmentView } from './components/dashboard/DepartmentView';
import { AddTaskModal } from './components/modals/AddTaskModal';
import { useDemoStore } from './store/demoStore';

function App() {
  const { activeDepartmentId, setActiveDepartment } = useDemoStore();
  const [currentView, setCurrentView] = useState<'dashboard' | 'workspace'>('workspace');
  const [addTaskProjectId, setAddTaskProjectId] = useState<string | null>(null);

  const handleAddTask = (projectId: string) => setAddTaskProjectId(projectId);

  return (
    <div className="flex h-screen w-full bg-base-950 text-gray-200 overflow-hidden font-inter">
      {/* Left Sidebar */}
      <Sidebar
        currentView={currentView}
        onViewChange={v => { setCurrentView(v); if (v === 'workspace') setActiveDepartment(null); }}
      />

      {/* Main Content */}
      <div className="flex flex-col flex-1 h-full min-w-0">
        <Header onAddTask={handleAddTask} />

        <main className="flex-1 overflow-auto">
          {currentView === 'dashboard' ? (
            <div className="p-6 max-w-[1400px] mx-auto">
              {activeDepartmentId ? (
                <DepartmentView
                  onBack={() => setActiveDepartment(null)}
                  onAddTask={handleAddTask}
                />
              ) : (
                <CEODashboard />
              )}
            </div>
          ) : (
            <Workspace onAddTask={handleAddTask} />
          )}
        </main>
      </div>

      {/* Global Modals */}
      {addTaskProjectId && (
        <AddTaskModal
          projectId={addTaskProjectId}
          onClose={() => setAddTaskProjectId(null)}
        />
      )}
    </div>
  );
}

export default App;
