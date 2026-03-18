import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, User, Clock, DollarSign, Tag, Trash2, ClipboardList, CheckCircle2 } from 'lucide-react';
import { useDemoStore, type TaskStatus, type TaskPriority } from '../../store/demoStore';

interface Props {
  taskId: string;
  onClose: () => void;
}

export const TaskDetailPanel: React.FC<Props> = ({ taskId, onClose }) => {
  const { tasks, users, projects, updateTask, deleteTask, currentUserId } = useDemoStore();
  const task = tasks.find(t => t.id === taskId);
  const project = projects.find(p => p.id === task?.projectId);
  const assignee = users.find(u => u.id === task?.assigneeId);
  const currentUser = users.find(u => u.id === currentUserId);
  const canEditAssignee = currentUser && currentUser.role !== 'Contributor';

  if (!task) return null;

  const STATUS_OPTS: TaskStatus[] = ['Todo', 'In Progress', 'Review', 'Done', 'Blocked'];
  const PRIORITY_OPTS: TaskPriority[] = ['Low', 'Medium', 'High', 'Urgent'];

  const STATUS_COLORS: Record<TaskStatus, string> = {
    'Done':        'bg-success-500 text-white',
    'In Progress': 'bg-brand-500 text-white',
    'Review':      'bg-purple-500 text-white',
    'Todo':        'bg-gray-600 text-white',
    'Blocked':     'bg-danger-500 text-white',
  };

  const PRIORITY_COLORS: Record<TaskPriority, string> = {
    'Urgent': 'text-danger-500 bg-danger-500/10 border-danger-500/20',
    'High':   'text-warning-500 bg-warning-500/10 border-warning-500/20',
    'Medium': 'text-brand-500 bg-brand-500/10 border-brand-500/20',
    'Low':    'text-gray-400 bg-gray-500/10 border-gray-500/20',
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex justify-end">
        {/* Backdrop for mobile or focusing */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        />

        {/* Panel Content — full-screen on mobile, side drawer on desktop */}
        <motion.div
          initial={{ x: '100%', opacity: 0.5 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0.5 }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="relative w-full md:max-w-xl h-full bg-base-950/95 md:bg-base-950/95 backdrop-blur-xl border-l border-white/10 shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-base-900/40">
            <div className="flex items-center gap-2">
              <ClipboardList size={18} className="text-brand-500" />
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Task Details</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => { if(confirm('Are you sure?')) { deleteTask(task.id); onClose(); }}}
                className="p-1.5 rounded-lg text-gray-600 hover:text-danger-500 hover:bg-danger-500/10 transition-colors"
                title="Delete task"
              >
                <Trash2 size={16} />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all border border-white/10"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            {/* Title & Description Section */}
            <div className="space-y-4">
              <input
                type="text"
                value={task.title}
                onChange={e => updateTask(task.id, { title: e.target.value })}
                className="w-full bg-transparent border-none outline-none focus:ring-1 focus:ring-brand-500/30 rounded-lg px-2 -ml-2 text-2xl font-bold text-white placeholder-gray-700 transition-all"
                placeholder="Task Title"
              />
              <div className="text-xs flex items-center gap-2 text-gray-500">
                <Tag size={12} />
                <span>Part of </span>
                <span className="text-brand-400 font-medium">#{project?.name || 'Unassigned'}</span>
              </div>
              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 focus-within:border-white/20 transition-all group">
                <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2 block group-focus-within:text-brand-400 transition-colors">Description</label>
                <textarea
                  value={task.description}
                  onChange={e => updateTask(task.id, { description: e.target.value })}
                  className="w-full bg-transparent border-none outline-none text-sm text-gray-300 placeholder-gray-700 resize-none leading-relaxed"
                  placeholder="What needs to be done?"
                  rows={4}
                />
              </div>
            </div>

            {/* Properties Grid */}
            <div className="grid grid-cols-2 gap-4">
              <PropertyBox label="Status" icon={<CheckCircle2 size={14} />}>
                <select
                  value={task.status}
                  onChange={e => updateTask(task.id, { status: e.target.value as TaskStatus })}
                  className={`w-full bg-transparent border-none outline-none text-xs font-bold uppercase tracking-wider rounded cursor-pointer transition-colors ${STATUS_COLORS[task.status]}`}
                  style={{ padding: '4px 8px' }}
                >
                  {STATUS_OPTS.map(s => <option key={s} value={s} className="bg-base-900 text-white font-normal lowercase">{s}</option>)}
                </select>
              </PropertyBox>

              <PropertyBox label="Priority" icon={<Tag size={14} />}>
                <select
                  value={task.priority}
                  onChange={e => updateTask(task.id, { priority: e.target.value as TaskPriority })}
                  className={`w-full bg-transparent border-none outline-none text-xs font-bold uppercase tracking-wider rounded border cursor-pointer transition-colors ${PRIORITY_COLORS[task.priority]}`}
                   style={{ padding: '4px 8px' }}
                >
                  {PRIORITY_OPTS.map(p => <option key={p} value={p} className="bg-base-900 text-white font-normal lowercase">{p}</option>)}
                </select>
              </PropertyBox>

              <PropertyBox label="Assignee" icon={<User size={14} />}>
                <select
                  value={task.assigneeId}
                  onChange={e => updateTask(task.id, { assigneeId: e.target.value })}
                  disabled={!canEditAssignee}
                  className={`w-full bg-transparent border-none outline-none text-sm text-gray-200 ${canEditAssignee ? 'cursor-pointer' : 'cursor-not-allowed opacity-80'}`}
                >
                  {users.map(u => <option key={u.id} value={u.id} className="bg-base-900">{u.name}</option>)}
                </select>
              </PropertyBox>

              <PropertyBox label="Due Date" icon={<Calendar size={14} />}>
                <input
                  type="date"
                  value={task.dueDate}
                  onChange={e => updateTask(task.id, { dueDate: e.target.value })}
                  className="w-full bg-transparent border-none outline-none text-sm text-gray-200 cursor-pointer [color-scheme:dark]"
                />
              </PropertyBox>

              <PropertyBox label="Estimated Time" icon={<Clock size={14} />}>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={task.estimatedHrs}
                    onChange={e => updateTask(task.id, { estimatedHrs: Number(e.target.value) })}
                    className="w-20 bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                  <span className="text-xs text-gray-500 font-medium">hours</span>
                </div>
              </PropertyBox>

              <PropertyBox label="Actual Worked" icon={<Clock size={14} />}>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={task.actualHrs}
                    onChange={e => updateTask(task.id, { actualHrs: Number(e.target.value) })}
                    className="w-20 bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                  <span className="text-xs text-gray-300 font-medium">/{task.estimatedHrs}h spent</span>
                </div>
              </PropertyBox>

              <PropertyBox label="Budget Reserved" icon={<DollarSign size={14} />}>
                <div className="flex items-center gap-1 text-gray-200">
                  <span className="text-xs text-gray-500">$</span>
                  <input
                    type="number"
                    value={task.budgetAmount}
                    onChange={e => updateTask(task.id, { budgetAmount: Number(e.target.value) })}
                    className="w-24 bg-transparent border-none outline-none text-sm text-white focus:ring-0"
                  />
                </div>
              </PropertyBox>

              <PropertyBox label="Economic Spent" icon={<DollarSign size={14} />}>
                <div className="flex items-center gap-1 text-gray-200">
                   <span className="text-xs text-gray-500">$</span>
                  <input
                    type="number"
                    value={task.spentAmount}
                    onChange={e => updateTask(task.id, { spentAmount: Number(e.target.value) })}
                    className={`w-24 bg-transparent border-none outline-none text-sm font-bold focus:ring-0 ${task.spentAmount > task.budgetAmount ? 'text-danger-500' : 'text-success-500'}`}
                  />
                </div>
              </PropertyBox>
            </div>
            
            {/* Simple Stats for Context */}
            <div className="p-4 rounded-xl bg-brand-500/5 border border-brand-500/10 flex items-center justify-between">
               <div className="flex items-center gap-3">
                 <img src={assignee?.avatar} className="w-10 h-10 rounded-full border-2 border-brand-500/20" alt="" />
                 <div>
                   <p className="text-xs font-bold text-white leading-none">{assignee?.name}</p>
                   <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">{assignee?.role}</p>
                 </div>
               </div>
               <div className="text-right">
                 <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Risk Profile</p>
                 <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${task.spentAmount > task.budgetAmount || task.status === 'Blocked' ? 'bg-danger-500 text-white' : 'bg-success-500/10 text-success-500'}`}>
                   {task.spentAmount > task.budgetAmount ? 'BUDGET OVERRUN' : task.status === 'Blocked' ? 'BLOCKED' : 'NOMINAL'}
                 </span>
               </div>
            </div>
          </div>

          {/* Bottom Action Hint */}
          <div className="px-6 py-4 border-t border-white/5 bg-base-900/60 flex items-center justify-between">
            <p className="text-[10px] text-gray-600 font-medium italic">Changes are saved automatically in real-time.</p>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-success-500 animate-pulse" />
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Live Syncing</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

const PropertyBox = ({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) => (
  <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3 flex flex-col gap-2 hover:border-white/10 transition-colors">
    <div className="flex items-center gap-2 text-gray-600">
      {icon}
      <span className="text-[10px] font-bold uppercase tracking-widest leading-none">{label}</span>
    </div>
    <div className="pl-1">
      {children}
    </div>
  </div>
);
