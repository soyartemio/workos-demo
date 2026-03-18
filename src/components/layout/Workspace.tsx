/**
 * Workspace.tsx — Main tabbed workspace
 * Tabs: Main Table | Board (Kanban) | Workload | Timeline (Gantt) | All Projects
 */

import React, { useState } from 'react';
import { GridBoard } from '../workspace/GridBoard';
import { WorkloadView } from '../workspace/WorkloadView';
import { ProjectsPanel } from '../workspace/ProjectsPanel';
import { KanbanBoard } from '../workspace/KanbanBoard';
import { GanttView } from '../workspace/GanttView';

type TabName = 'Main Table' | 'Board' | 'Workload' | 'Timeline' | 'Projects';

interface Props {
  onAddTask: (projectId: string) => void;
  onOpenTask: (taskId: string) => void;
}

export const Workspace: React.FC<Props> = ({ onAddTask, onOpenTask }) => {

  const [activeTab, setActiveTab] = useState<TabName>('Main Table');

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Tab bar */}
      <div className="h-12 border-b border-white/5 flex items-center gap-1 px-6 shrink-0 bg-base-900/30">
        <Tab active={activeTab === 'Main Table'} onClick={() => setActiveTab('Main Table')}>Main Table</Tab>
        <Tab active={activeTab === 'Board'} onClick={() => setActiveTab('Board')}>Board</Tab>
        <Tab active={activeTab === 'Workload'} onClick={() => setActiveTab('Workload')}>Workload</Tab>
        <Tab active={activeTab === 'Timeline'} onClick={() => setActiveTab('Timeline')}>Timeline</Tab>
        <Tab active={activeTab === 'Projects'} onClick={() => setActiveTab('Projects')}>All Projects</Tab>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-[1400px] mx-auto h-full">
          {activeTab === 'Main Table' && <GridBoard onAddTask={onAddTask} onOpenTask={onOpenTask} />}
          {activeTab === 'Board'      && <KanbanBoard onAddTask={onAddTask} onOpenTask={onOpenTask} />}
          {activeTab === 'Workload'   && <WorkloadView />}
          {activeTab === 'Timeline'   && <GanttView />}
          {activeTab === 'Projects'   && <ProjectsPanel onAddTask={onAddTask} />}

        </div>
      </div>

    </div>
  );
};

const Tab = ({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick?: () => void }) => (
  <div
    onClick={onClick}
    className={`relative h-12 flex items-center px-3 cursor-pointer text-sm font-medium transition-colors ${active ? 'text-gray-100' : 'text-gray-500 hover:text-gray-300'}`}
  >
    {children}
    {active && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500 rounded-t-full shadow-[0_0_8px_rgba(59,130,246,0.6)]" />}
  </div>
);
