/**
 * GridBoard.tsx — Main Table View (Monday.com vibe)
 * Shows ALL tasks across all projects in a dense, editable grid
 * Supports inline editing, status cycling, and the Add Task modal
 */

import { useState } from 'react';
import { useDemoStore, type TaskStatus, type TaskPriority } from '../../store/demoStore';
import { Eye, EyeOff, Lock, Trash2, Plus } from 'lucide-react';

interface Props {
  onAddTask: (projectId: string) => void;
  onOpenTask: (taskId: string) => void;
}

const fmt$ = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n}`;

export const GridBoard: React.FC<Props> = ({ onAddTask, onOpenTask }) => {
  const {
    tasks, projects, users, departments,
    isManagerView, toggleManagerView,
    updateTask, deleteTask, currentUserId
  } = useDemoStore();


  const [filterDept, setFilterDept] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const mainDepts = departments.filter(d => d.id !== 'dept-exec');

  const currentUser = users.find(u => u.id === currentUserId);
  const canEditAssignee = currentUser && currentUser.role !== 'Contributor';

  // Filter tasks
  const filteredTasks = tasks.filter(t => {
    const proj = projects.find(p => p.id === t.projectId);
    if (filterDept !== 'all' && proj?.departmentId !== filterDept) return false;
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;

    // Permissions: If Contributors, they can only see tasks from projects where they belong
    const isContributor = currentUser && currentUser.role === 'Contributor';
    if (isContributor) {
      const userTasksInProj = tasks.filter(ut => ut.projectId === t.projectId && ut.assigneeId === currentUserId);
      if (userTasksInProj.length === 0) return false;
    }

    return true;
  });

  const firstProject = projects[0];

  const selectCls = 'bg-base-800 border border-white/5 rounded-md px-2 py-1 text-xs text-gray-300 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer';

  return (
    <div className="flex flex-col h-full bg-base-950 pb-8">
      {/* Controls */}
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-white">All Tasks</h2>
          <p className="text-xs text-gray-500 mt-0.5">{filteredTasks.length} of {tasks.length} items</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Dept filter */}
          <select value={filterDept} onChange={e => setFilterDept(e.target.value)} className={selectCls}>
            <option value="all">All Departments</option>
            {mainDepts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          {/* Status filter */}
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={selectCls}>
            <option value="all">All Statuses</option>
            {(['Todo', 'In Progress', 'Review', 'Done', 'Blocked'] as TaskStatus[]).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {/* Manager toggle */}
          <button
            onClick={toggleManagerView}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${isManagerView ? 'bg-brand-500/10 text-brand-400 border-brand-500/20' : 'bg-base-900 text-gray-400 border-white/5 hover:text-gray-200'}`}
          >
            {isManagerView ? <Eye size={12} /> : <EyeOff size={12} />}
            {isManagerView ? 'Manager Mode' : 'Standard Mode'}
          </button>
          {/* Add task */}
          {firstProject && (
            <button
              onClick={() => onAddTask(firstProject.id)}
              className="bg-brand-600 hover:bg-brand-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 shadow-[0_0_10px_rgba(59,130,246,0.25)]"
            >
              <Plus size={12} /> Task
            </button>
          )}
        </div>
      </div>

      {/* ─── MOBILE: Card List ─────────────────────────────────────── */}
      <div className="md:hidden flex flex-col gap-2">
        {filteredTasks.map((task) => {

          const assignee = users.find(u => u.id === task.assigneeId);
          const proj = projects.find(p => p.id === task.projectId);
          const dept = departments.find(d => d.id === proj?.departmentId);
          const STATUS_DOT: Record<string, string> = {
            'Done': 'bg-success-500', 'In Progress': 'bg-brand-500',
            'Review': 'bg-purple-500', 'Todo': 'bg-gray-500', 'Blocked': 'bg-danger-500',
          };
          return (
            <div
              key={task.id}
              onClick={() => onOpenTask(task.id)}
              className="glass-panel rounded-2xl p-4 cursor-pointer hover:bg-white/[0.04] active:scale-[0.98] transition-all"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0 mr-3">
                  <p className="text-sm font-semibold text-white leading-tight truncate">{task.title}</p>
                  {proj && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full mt-1 inline-block" style={{ background: `${dept?.color}20`, color: dept?.color }}>
                      {proj.name}
                    </span>
                  )}
                </div>
                {assignee && <img src={assignee.avatar} alt={assignee.name} className="w-8 h-8 rounded-full shrink-0 border border-white/10" />}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  task.status === 'Done' ? 'bg-success-500/10 text-success-400' :
                  task.status === 'In Progress' ? 'bg-brand-500/10 text-brand-400' :
                  task.status === 'Blocked' ? 'bg-danger-500/10 text-danger-400' :
                  task.status === 'Review' ? 'bg-purple-500/10 text-purple-400' : 'bg-gray-500/10 text-gray-400'
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[task.status]}`} />
                  {task.status}
                </div>
                <PriorityBadge priority={task.priority} />
                <span className="text-[10px] text-gray-400 ml-auto">Due {task.dueDate}</span>
              </div>
            </div>
          );
        })}
        {filteredTasks.length === 0 && (
          <div className="flex items-center justify-center py-16 text-gray-600 text-sm">No tasks match the current filters.</div>
        )}
        {firstProject && (
          <button onClick={() => onAddTask(firstProject.id)} className="mt-1 p-4 rounded-2xl border border-dashed border-white/10 text-gray-600 hover:text-gray-400 hover:border-white/20 transition-colors text-sm flex items-center justify-center gap-2">
            <Plus size={14} /> Add new task
          </button>
        )}
      </div>

      {/* ─── DESKTOP: Dense Table (md+) ─────────────────────────────── */}
      <div className="hidden md:block flex-1 w-full overflow-auto rounded-xl border border-white/5 bg-base-900/50">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="border-b border-white/5 bg-base-900/80">
              <th className="sticky left-0 bg-base-900/90 backdrop-blur pl-5 pr-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-64">Task</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Project</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Assignee</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Priority</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                Hours {!isManagerView && <Lock size={10} className="text-warning-500" />}
              </th>
              {isManagerView && <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Budget</th>}
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Due</th>
              <th className="px-4 py-3 w-8" />
            </tr>
          </thead>
          <tbody>
            {filteredTasks.map(task => {
              const assignee = users.find(u => u.id === task.assigneeId);
              const proj = projects.find(p => p.id === task.projectId);
              const dept = departments.find(d => d.id === proj?.departmentId);

              return (
                <tr key={task.id} className="border-b border-white/5 hover:bg-white/[0.02] group transition-colors">
                  {/* Title */}
                  <td className="sticky left-0 bg-base-900/50 backdrop-blur group-hover:bg-base-900/80 pl-5 pr-4 py-2 cursor-pointer" onClick={() => onOpenTask(task.id)}>
                    <div className="flex flex-col">
                       <span className="text-sm text-white font-medium group-hover:text-brand-400 transition-colors uppercase tracking-tight">{task.title}</span>
                       <span className="text-[10px] text-gray-400 font-normal leading-none mt-0.5 opacity-60">ID: {task.id.toUpperCase()}</span>
                    </div>
                  </td>

                  {/* Project */}
                  <td className="px-4 py-2 cursor-pointer" onClick={() => onOpenTask(task.id)}>
                    {proj && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider" style={{ background: `${dept?.color}18`, color: dept?.color }}>
                        {proj.name}
                      </span>
                    )}
                  </td>


                  {/* Assignee */}
                  <td className="px-4 py-2">
                    {assignee && (
                      <div className="flex items-center gap-1.5">
                        <img src={assignee.avatar} alt={assignee.name} className="w-5 h-5 rounded-full border border-white/10 shrink-0" />
                        <select
                          value={task.assigneeId}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => updateTask(task.id, { assigneeId: e.target.value })}
                          disabled={!canEditAssignee}
                          className={`appearance-none bg-transparent border-none outline-none text-xs text-gray-400 focus:text-gray-200 transition-colors truncate max-w-[80px] ${canEditAssignee ? 'cursor-pointer hover:text-gray-200' : 'cursor-not-allowed opacity-80'}`}
                        >
                          {users.map(u => (
                            <option key={u.id} value={u.id} className="bg-base-900 text-gray-300">
                              {u.name.split(' ')[0]}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-2">
                    <StatusDropdown id={task.id} currentStatus={task.status} />
                  </td>

                  {/* Priority */}
                  <td className="px-4 py-2">
                    <PriorityBadge priority={task.priority} />
                  </td>

                  {/* Hours */}
                  <td className="px-4 py-2">
                    {isManagerView ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={task.actualHrs}
                          onChange={e => updateTask(task.id, { actualHrs: Number(e.target.value) })}
                          title="Actual hours"
                          className="bg-base-800 rounded px-1.5 py-0.5 w-10 text-xs text-gray-300 focus:outline-none focus:ring-1 focus:ring-brand-500 border border-white/5"
                        />
                        <span className="text-gray-600 text-xs">/{task.estimatedHrs}h</span>
                      </div>
                    ) : (
                      <div className="w-16 h-4 bg-base-800 rounded animate-pulse opacity-40" />
                    )}
                  </td>

                  {/* Budget (manager only) */}
                  {isManagerView && (
                    <td className="px-4 py-2">
                      <span className={`text-xs ${task.spentAmount > task.budgetAmount ? 'text-danger-500 font-medium' : 'text-gray-500'}`}>
                        {fmt$(task.spentAmount)}/{fmt$(task.budgetAmount)}
                      </span>
                    </td>
                  )}

                  {/* Due */}
                  <td className="px-4 py-2 text-xs text-gray-400">{task.dueDate}</td>


                  {/* Delete */}
                  <td className="px-2 py-2">
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded hover:bg-danger-500/10 hover:text-danger-500 text-gray-600 transition-all"
                    >
                      <Trash2 size={11} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredTasks.length === 0 && (
          <div className="flex items-center justify-center py-16 text-gray-600 text-sm">
            No tasks match the current filters.
          </div>
        )}

        {/* Add row hint */}
        {firstProject && (
          <div
            onClick={() => onAddTask(firstProject.id)}
            className="px-5 py-3 text-xs text-gray-600 hover:text-gray-400 hover:bg-white/[0.02] cursor-pointer transition-colors flex items-center gap-2 border-t border-white/5"
          >
            <div className="w-4 h-4 rounded-full border border-gray-700 flex items-center justify-center text-[10px]">+</div>
            Add new item
          </div>
        )}
      </div>
    </div>
  );
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<TaskStatus, string> = {
  'Done':        'bg-success-500 text-white',
  'In Progress': 'bg-brand-500 text-white',
  'Review':      'bg-purple-500 text-white',
  'Todo':        'bg-gray-600 text-white',
  'Blocked':     'bg-danger-500 text-white',
};

const StatusDropdown = ({ id, currentStatus }: { id: string; currentStatus: TaskStatus }) => {
  const updateTaskStatus = useDemoStore(s => s.updateTaskStatus);
  const ALL: TaskStatus[] = ['Todo', 'In Progress', 'Review', 'Done', 'Blocked'];
  return (
    <button
      onClick={() => { const next = ALL[(ALL.indexOf(currentStatus) + 1) % ALL.length]; updateTaskStatus(id, next); }}
      className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase tracking-wider transition-opacity hover:opacity-80 ${STATUS_COLORS[currentStatus]}`}
    >
      {currentStatus}
    </button>
  );
};

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  'Urgent': 'text-danger-500 bg-danger-500/10 border-danger-500/20',
  'High':   'text-warning-500 bg-warning-500/10 border-warning-500/20',
  'Medium': 'text-brand-500 bg-brand-500/10 border-brand-500/20',
  'Low':    'text-gray-400 bg-gray-500/10 border-gray-500/20',
};
const PriorityBadge = ({ priority }: { priority: TaskPriority }) => (
  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border uppercase tracking-wider ${PRIORITY_COLORS[priority]}`}>{priority}</span>
);


