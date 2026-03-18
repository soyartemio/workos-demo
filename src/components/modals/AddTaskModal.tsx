/**
 * AddTaskModal.tsx — Full CRUD modal to add a task to a project
 * Supports priority, status, assignee, hours, and budget
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { useDemoStore, type TaskStatus, type TaskPriority } from '../../store/demoStore';

interface Props {
  projectId: string;
  onClose: () => void;
}

export const AddTaskModal: React.FC<Props> = ({ projectId, onClose }) => {
  const { users, projects, addTask } = useDemoStore();
  const project = projects.find(p => p.id === projectId);
  const projectUsers = users.filter(u => project ? u.departmentId === project.departmentId || u.role === 'Manager' : true);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('Todo');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [assigneeId, setAssigneeId] = useState(projectUsers[0]?.id ?? '');
  const [estimatedHrs, setEstimatedHrs] = useState(8);
  const [budgetAmount, setBudgetAmount] = useState(1000);
  const [dueDate, setDueDate] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addTask({
      title: title.trim(),
      description,
      status,
      priority,
      assigneeId,
      projectId,
      estimatedHrs,
      actualHrs: 0,
      budgetAmount,
      spentAmount: 0,
      dueDate: dueDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
    setSubmitted(true);
    setTimeout(onClose, 900);
  };

  const inputCls = 'w-full bg-base-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-brand-500 placeholder-gray-600 transition-colors';
  const labelCls = 'text-xs text-gray-400 mb-1 block';

  const STATUS_OPTS: TaskStatus[] = ['Todo', 'In Progress', 'Review', 'Done', 'Blocked'];
  const PRIORITY_OPTS: TaskPriority[] = ['Low', 'Medium', 'High', 'Urgent'];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25 }}
          className="glass-panel rounded-2xl w-full max-w-lg shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/5">
            <div>
              <h2 className="font-semibold text-white">New Task</h2>
              <p className="text-xs text-gray-500 mt-0.5">→ {project?.name}</p>
            </div>
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 text-gray-500 hover:text-gray-200 transition-colors">
              <X size={15} />
            </button>
          </div>

          {submitted ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }} className="w-12 h-12 rounded-full bg-success-500/20 flex items-center justify-center">
                <Check size={20} className="text-success-500" />
              </motion.div>
              <p className="text-sm text-gray-300">Task added successfully!</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Title */}
              <div>
                <label className={labelCls}>Task Title *</label>
                <input
                  autoFocus
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Design new landing page hero"
                  className={inputCls}
                />
              </div>

              {/* Description */}
              <div>
                <label className={labelCls}>Description</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Optional context..."
                  rows={2}
                  className={`${inputCls} resize-none`}
                />
              </div>

              {/* Status + Priority */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Status</label>
                  <select value={status} onChange={e => setStatus(e.target.value as TaskStatus)} className={inputCls}>
                    {STATUS_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Priority</label>
                  <select value={priority} onChange={e => setPriority(e.target.value as TaskPriority)} className={inputCls}>
                    {PRIORITY_OPTS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              {/* Assignee */}
              <div>
                <label className={labelCls}>Assignee</label>
                <select value={assigneeId} onChange={e => setAssigneeId(e.target.value)} className={inputCls}>
                  {projectUsers.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                </select>
              </div>

              {/* Hours + Budget */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Estimated Hours</label>
                  <input type="number" min={1} value={estimatedHrs} onChange={e => setEstimatedHrs(Number(e.target.value))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Budget (USD)</label>
                  <input type="number" min={0} step={100} value={budgetAmount} onChange={e => setBudgetAmount(Number(e.target.value))} className={inputCls} />
                </div>
              </div>

              {/* Due Date */}
              <div>
                <label className={labelCls}>Due Date</label>
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className={inputCls} />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={onClose} className="glass-btn flex-1 justify-center text-sm border-white/5 text-gray-400">
                  Cancel
                </button>
                <button type="submit" className="flex-1 bg-brand-600 hover:bg-brand-500 text-white font-medium text-sm rounded-lg px-4 py-2 transition-colors flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                  <Plus size={14} /> Add Task
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const Plus = ({ size }: { size: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M12 5v14M5 12h14"/></svg>;
