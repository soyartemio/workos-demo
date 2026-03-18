/**
 * demoStore.ts — Robust Global State for WorkOS Demo
 * Architecture: Departments > Projects > Tasks
 * Supports Financial & Time Budgets, Role-Based Access, and Full CRUD
 * Persisted to LocalStorage via Zustand middleware
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export type TaskStatus = 'Todo' | 'In Progress' | 'Review' | 'Done' | 'Blocked';
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type UserRole = 'CEO' | 'Director' | 'Manager' | 'Contributor';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  departmentId: string;
  avatar: string; // ui-avatars URL
  capacityHrs: number; // weekly capacity in hours
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string;
  projectId: string;
  estimatedHrs: number;
  actualHrs: number;
  budgetAmount: number;   // $ economic budget for this task
  spentAmount: number;    // $ spent so far
  dueDate: string;        // ISO date string
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  departmentId: string;
  ownerId: string;
  budgetHrs: number;      // total hour budget for project
  budgetAmount: number;   // $ total economic budget
  startDate: string;
  endDate: string;
  status: 'On Track' | 'At Risk' | 'Off Track' | 'Completed';
  taskIds: string[];
}

export interface Department {
  id: string;
  name: string;
  color: string; // for charts & badges
  directorId: string;
  projectIds: string[];
}

// ============================================================
// STORE INTERFACE
// ============================================================

interface DemoState {
  // Data
  users: User[];
  tasks: Task[];
  projects: Project[];
  departments: Department[];

  // UI State
  currentUserId: string; // simulated logged-in user
  isManagerView: boolean;
  activeProjectId: string | null;
  activeDepartmentId: string | null;

  // ------- SELECTORS (derived) -------
  getUser: (id: string) => User | undefined;
  getProject: (id: string) => Project | undefined;
  getDepartment: (id: string) => Department | undefined;
  getTasksByProject: (projectId: string) => Task[];
  getTasksByUser: (userId: string) => Task[];
  getUserWorkload: (userId: string) => { allocated: number; capacity: number; percentage: number; isOverloaded: boolean };
  getDepartmentHealth: (departmentId: string) => {
    totalBudget: number; spentBudget: number; totalHrs: number; spentHrs: number;
    tasksDone: number; tasksTotal: number; efficiency: number;
  };

  // ------- ACTIONS -------
  // View Control
  toggleManagerView: () => void;
  setActiveProject: (id: string | null) => void;
  setActiveDepartment: (id: string | null) => void;
  switchUser: (userId: string) => void;

  // Task CRUD
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  updateTaskStatus: (id: string, status: TaskStatus) => void;

  // Project CRUD
  addProject: (project: Omit<Project, 'id' | 'taskIds'>) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;

  // Department CRUD
  addDepartment: (dept: Omit<Department, 'id' | 'projectIds'>) => void;
  updateDepartment: (id: string, updates: Partial<Department>) => void;

  // User CRUD
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;

  // AI Rebalance
  autoRebalance: (projectId: string) => void;

  // Reset
  resetToDefaults: () => void;
}

// ============================================================
// INITIAL MOCK DATA — 4 Departments, 12 Users, 8 Projects, 30+ Tasks
// Designed to show clear workload imbalances for the demo
// ============================================================

const INITIAL_USERS: User[] = [
  // CEO
  { id: 'u-ceo', name: 'Carlos Mendoza', email: 'ceo@acme.com', role: 'CEO', departmentId: 'dept-exec', avatar: 'https://ui-avatars.com/api/?name=Carlos+Mendoza&background=4f46e5&color=fff&bold=true', capacityHrs: 20 },
  // Engineering
  { id: 'u-eng-dir', name: 'Sofia Reyes', email: 'sreyes@acme.com', role: 'Director', departmentId: 'dept-eng', avatar: 'https://ui-avatars.com/api/?name=Sofia+Reyes&background=0ea5e9&color=fff&bold=true', capacityHrs: 30 },
  { id: 'u-eng-1', name: 'Miguel Torres', email: 'mtorres@acme.com', role: 'Contributor', departmentId: 'dept-eng', avatar: 'https://ui-avatars.com/api/?name=Miguel+Torres&background=3b82f6&color=fff&bold=true', capacityHrs: 40 },
  { id: 'u-eng-2', name: 'Ana López', email: 'alopez@acme.com', role: 'Contributor', departmentId: 'dept-eng', avatar: 'https://ui-avatars.com/api/?name=Ana+Lopez&background=6366f1&color=fff&bold=true', capacityHrs: 40 },
  { id: 'u-eng-3', name: 'David Kim', email: 'dkim@acme.com', role: 'Manager', departmentId: 'dept-eng', avatar: 'https://ui-avatars.com/api/?name=David+Kim&background=8b5cf6&color=fff&bold=true', capacityHrs: 30 },
  // Marketing
  { id: 'u-mkt-dir', name: 'Isabella Vargas', email: 'ivargas@acme.com', role: 'Director', departmentId: 'dept-mkt', avatar: 'https://ui-avatars.com/api/?name=Isabella+Vargas&background=ec4899&color=fff&bold=true', capacityHrs: 30 },
  { id: 'u-mkt-1', name: 'Sarah Chen', email: 'schen@acme.com', role: 'Contributor', departmentId: 'dept-mkt', avatar: 'https://ui-avatars.com/api/?name=Sarah+Chen&background=f43f5e&color=fff&bold=true', capacityHrs: 40 },
  { id: 'u-mkt-2', name: 'Ryan Park', email: 'rpark@acme.com', role: 'Contributor', departmentId: 'dept-mkt', avatar: 'https://ui-avatars.com/api/?name=Ryan+Park&background=fb923c&color=fff&bold=true', capacityHrs: 40 },
  // Design
  { id: 'u-des-dir', name: 'Lena Müller', email: 'lmuller@acme.com', role: 'Director', departmentId: 'dept-des', avatar: 'https://ui-avatars.com/api/?name=Lena+Muller&background=10b981&color=fff&bold=true', capacityHrs: 30 },
  { id: 'u-des-1', name: 'Alex Rivera', email: 'arivera@acme.com', role: 'Manager', departmentId: 'dept-des', avatar: 'https://ui-avatars.com/api/?name=Alex+Rivera&background=14b8a6&color=fff&bold=true', capacityHrs: 40 },
  { id: 'u-des-2', name: 'Priya Nair', email: 'pnair@acme.com', role: 'Contributor', departmentId: 'dept-des', avatar: 'https://ui-avatars.com/api/?name=Priya+Nair&background=06b6d4&color=fff&bold=true', capacityHrs: 40 },
  // Operations
  { id: 'u-ops-dir', name: 'Omar Hassan', email: 'ohassan@acme.com', role: 'Director', departmentId: 'dept-ops', avatar: 'https://ui-avatars.com/api/?name=Omar+Hassan&background=f59e0b&color=fff&bold=true', capacityHrs: 30 },
  { id: 'u-ops-1', name: 'Elena Rossi', email: 'erossi@acme.com', role: 'Contributor', departmentId: 'dept-ops', avatar: 'https://ui-avatars.com/api/?name=Elena+Rossi&background=eab308&color=fff&bold=true', capacityHrs: 40 },
];

const INITIAL_DEPARTMENTS: Department[] = [
  { id: 'dept-exec', name: 'Executive', color: '#4f46e5', directorId: 'u-ceo', projectIds: [] },
  { id: 'dept-eng', name: 'Engineering', color: '#0ea5e9', directorId: 'u-eng-dir', projectIds: ['proj-api', 'proj-infra'] },
  { id: 'dept-mkt', name: 'Marketing', color: '#ec4899', directorId: 'u-mkt-dir', projectIds: ['proj-campaign', 'proj-content'] },
  { id: 'dept-des', name: 'Design', color: '#10b981', directorId: 'u-des-dir', projectIds: ['proj-design-sys', 'proj-brand'] },
  { id: 'dept-ops', name: 'Operations', color: '#f59e0b', directorId: 'u-ops-dir', projectIds: ['proj-onboarding'] },
];

const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj-api', name: 'API v3 Platform', description: 'Complete rebuild of public API with new authentication layer and rate limiting.',
    departmentId: 'dept-eng', ownerId: 'u-eng-dir', budgetHrs: 200, budgetAmount: 45000,
    startDate: '2026-01-15', endDate: '2026-04-30', status: 'At Risk',
    taskIds: ['t1', 't2', 't3', 't4', 't5'],
  },
  {
    id: 'proj-infra', name: 'Cloud Migration', description: 'Migrate legacy services to Kubernetes cluster on GCP.',
    departmentId: 'dept-eng', ownerId: 'u-eng-3', budgetHrs: 160, budgetAmount: 30000,
    startDate: '2026-02-01', endDate: '2026-05-15', status: 'On Track',
    taskIds: ['t6', 't7', 't8'],
  },
  {
    id: 'proj-campaign', name: 'Q2 Growth Campaign', description: 'Multi-channel marketing campaign targeting LATAM expansion.',
    departmentId: 'dept-mkt', ownerId: 'u-mkt-dir', budgetHrs: 120, budgetAmount: 25000,
    startDate: '2026-03-01', endDate: '2026-06-30', status: 'At Risk',
    taskIds: ['t9', 't10', 't11', 't12'],
  },
  {
    id: 'proj-content', name: 'Content Hub 2026', description: 'Build editorial calendar and SEO content strategy for the year.',
    departmentId: 'dept-mkt', ownerId: 'u-mkt-1', budgetHrs: 80, budgetAmount: 12000,
    startDate: '2026-01-01', endDate: '2026-12-31', status: 'On Track',
    taskIds: ['t13', 't14'],
  },
  {
    id: 'proj-design-sys', name: 'Design System v2', description: 'Unified component library for all ACME products.',
    departmentId: 'dept-des', ownerId: 'u-des-dir', budgetHrs: 180, budgetAmount: 38000,
    startDate: '2026-01-20', endDate: '2026-05-01', status: 'On Track',
    taskIds: ['t15', 't16', 't17', 't18'],
  },
  {
    id: 'proj-brand', name: 'Brand Refresh', description: 'Full visual identity update including logo, colors, and motion guidelines.',
    departmentId: 'dept-des', ownerId: 'u-des-1', budgetHrs: 100, budgetAmount: 20000,
    startDate: '2026-03-15', endDate: '2026-07-31', status: 'Off Track',
    taskIds: ['t19', 't20'],
  },
  {
    id: 'proj-onboarding', name: 'Client Onboarding V3', description: 'Streamline the onboarding process to reduce time-to-value for enterprise clients.',
    departmentId: 'dept-ops', ownerId: 'u-ops-dir', budgetHrs: 90, budgetAmount: 15000,
    startDate: '2026-02-15', endDate: '2026-04-15', status: 'Completed',
    taskIds: ['t21', 't22', 't23'],
  },
];

const INITIAL_TASKS: Task[] = [
  // Engineering — API v3 (OVERLOADED: Miguel has too many)
  { id: 't1', title: 'Design OAuth 2.0 flow', description: 'Define endpoints and token lifecycle', status: 'Done', priority: 'Urgent', assigneeId: 'u-eng-1', projectId: 'proj-api', estimatedHrs: 24, actualHrs: 28, budgetAmount: 5000, spentAmount: 5800, dueDate: '2026-02-15', createdAt: '2026-01-15' },
  { id: 't2', title: 'Build rate limiting middleware', description: 'Implement per-user and per-ip limits', status: 'In Progress', priority: 'High', assigneeId: 'u-eng-1', projectId: 'proj-api', estimatedHrs: 32, actualHrs: 20, budgetAmount: 7000, spentAmount: 4500, dueDate: '2026-03-30', createdAt: '2026-01-20' },
  { id: 't3', title: 'Write API documentation (v3)', description: 'OpenAPI spec + mkdocs setup', status: 'Todo', priority: 'Medium', assigneeId: 'u-eng-1', projectId: 'proj-api', estimatedHrs: 20, actualHrs: 0, budgetAmount: 3000, spentAmount: 0, dueDate: '2026-04-10', createdAt: '2026-01-25' },
  { id: 't4', title: 'QA test suite for endpoints', description: 'Coverage for all v3 public routes', status: 'Todo', priority: 'High', assigneeId: 'u-eng-1', projectId: 'proj-api', estimatedHrs: 18, actualHrs: 0, budgetAmount: 3500, spentAmount: 0, dueDate: '2026-04-20', createdAt: '2026-02-01' },
  { id: 't5', title: 'Deploy staging environment', description: 'CI/CD pipeline for staging', status: 'In Progress', priority: 'Urgent', assigneeId: 'u-eng-2', projectId: 'proj-api', estimatedHrs: 16, actualHrs: 8, budgetAmount: 4000, spentAmount: 2000, dueDate: '2026-03-20', createdAt: '2026-02-10' },

  // Engineering — Cloud Migration
  { id: 't6', title: 'Kubernetes cluster setup', description: 'Configure namespaces, RBAC, and ingress',status: 'Done', priority: 'High', assigneeId: 'u-eng-3', projectId: 'proj-infra', estimatedHrs: 40, actualHrs: 38, budgetAmount: 8000, spentAmount: 7800, dueDate: '2026-03-01', createdAt: '2026-02-01' },
  { id: 't7', title: 'Migrate Auth service to GCP', description: '', status: 'In Progress', priority: 'High', assigneeId: 'u-eng-2', projectId: 'proj-infra', estimatedHrs: 30, actualHrs: 12, budgetAmount: 6000, spentAmount: 2400, dueDate: '2026-04-01', createdAt: '2026-02-15' },
  { id: 't8', title: 'Load testing & auto-scaling', description: '', status: 'Todo', priority: 'Medium', assigneeId: 'u-eng-3', projectId: 'proj-infra', estimatedHrs: 24, actualHrs: 0, budgetAmount: 4000, spentAmount: 0, dueDate: '2026-05-01', createdAt: '2026-03-01' },

  // Marketing — Q2 Growth Campaign (Sarah OVERLOADED)
  { id: 't9', title: 'LATAM ad creative production', description: 'Video and static ads for social', status: 'In Progress', priority: 'Urgent', assigneeId: 'u-mkt-1', projectId: 'proj-campaign', estimatedHrs: 40, actualHrs: 25, budgetAmount: 8000, spentAmount: 5000, dueDate: '2026-04-01', createdAt: '2026-03-01' },
  { id: 't10', title: 'Influencer campaign coordination', description: 'Contract negotiations and briefs', status: 'In Progress', priority: 'High', assigneeId: 'u-mkt-1', projectId: 'proj-campaign', estimatedHrs: 30, actualHrs: 15, budgetAmount: 6000, spentAmount: 3000, dueDate: '2026-04-15', createdAt: '2026-03-02' },
  { id: 't11', title: 'Landing page A/B test setup', description: 'Configure Optimizely variants', status: 'Todo', priority: 'High', assigneeId: 'u-mkt-1', projectId: 'proj-campaign', estimatedHrs: 16, actualHrs: 0, budgetAmount: 3000, spentAmount: 0, dueDate: '2026-04-20', createdAt: '2026-03-05' },
  { id: 't12', title: 'Email funnel automation', description: 'Klaviyo flows for lead nurturing', status: 'Todo', priority: 'Medium', assigneeId: 'u-mkt-2', projectId: 'proj-campaign', estimatedHrs: 20, actualHrs: 0, budgetAmount: 3500, spentAmount: 0, dueDate: '2026-05-01', createdAt: '2026-03-06' },

  // Marketing — Content Hub (Ryan has very few hours — underloaded)
  { id: 't13', title: 'Q2 editorial calendar', description: '', status: 'Done', priority: 'Low', assigneeId: 'u-mkt-2', projectId: 'proj-content', estimatedHrs: 8, actualHrs: 6, budgetAmount: 1500, spentAmount: 1200, dueDate: '2026-01-31', createdAt: '2026-01-10' },
  { id: 't14', title: 'SEO keyword research refresh', description: '', status: 'In Progress', priority: 'Low', assigneeId: 'u-mkt-2', projectId: 'proj-content', estimatedHrs: 10, actualHrs: 3, budgetAmount: 2000, spentAmount: 600, dueDate: '2026-04-30', createdAt: '2026-02-15' },

  // Design — Design System (well distributed)
  { id: 't15', title: 'Component audit & inventory', description: '', status: 'Done', priority: 'High', assigneeId: 'u-des-1', projectId: 'proj-design-sys', estimatedHrs: 20, actualHrs: 22, budgetAmount: 5000, spentAmount: 5500, dueDate: '2026-02-15', createdAt: '2026-01-20' },
  { id: 't16', title: 'Token system & theming', description: 'Colors, spacing, and typography scales', status: 'Done', priority: 'High', assigneeId: 'u-des-2', projectId: 'proj-design-sys', estimatedHrs: 30, actualHrs: 28, budgetAmount: 7000, spentAmount: 6600, dueDate: '2026-03-01', createdAt: '2026-01-25' },
  { id: 't17', title: 'Figma component library build', description: '', status: 'In Progress', priority: 'High', assigneeId: 'u-des-1', projectId: 'proj-design-sys', estimatedHrs: 40, actualHrs: 20, budgetAmount: 9000, spentAmount: 4500, dueDate: '2026-04-15', createdAt: '2026-02-10' },
  { id: 't18', title: 'React Storybook setup', description: '', status: 'In Progress', priority: 'Medium', assigneeId: 'u-des-2', projectId: 'proj-design-sys', estimatedHrs: 24, actualHrs: 8, budgetAmount: 5000, spentAmount: 1700, dueDate: '2026-04-30', createdAt: '2026-03-01' },

  // Design — Brand Refresh (OFF TRACK, budget blown)
  { id: 't19', title: 'Logo concepts & exploration', description: '3 logo directions for CEO review', status: 'Review', priority: 'High', assigneeId: 'u-des-2', projectId: 'proj-brand', estimatedHrs: 40, actualHrs: 52, budgetAmount: 8000, spentAmount: 11000, dueDate: '2026-04-10', createdAt: '2026-03-15' },
  { id: 't20', title: 'Motion & animation guidelines', description: '', status: 'Blocked', priority: 'Medium', assigneeId: 'u-des-1', projectId: 'proj-brand', estimatedHrs: 30, actualHrs: 5, budgetAmount: 6000, spentAmount: 1200, dueDate: '2026-07-01', createdAt: '2026-03-20' },

  // Operations — Client Onboarding V3 (COMPLETED)
  { id: 't21', title: 'Onboarding flow redesign', description: '', status: 'Done', priority: 'High', assigneeId: 'u-ops-1', projectId: 'proj-onboarding', estimatedHrs: 24, actualHrs: 23, budgetAmount: 4500, spentAmount: 4300, dueDate: '2026-03-15', createdAt: '2026-02-15' },
  { id: 't22', title: 'Automated welcome email series', description: '', status: 'Done', priority: 'Medium', assigneeId: 'u-ops-1', projectId: 'proj-onboarding', estimatedHrs: 16, actualHrs: 14, budgetAmount: 3000, spentAmount: 2800, dueDate: '2026-03-30', createdAt: '2026-02-20' },
  { id: 't23', title: 'Document new SOP', description: '', status: 'Done', priority: 'Low', assigneeId: 'u-ops-dir', projectId: 'proj-onboarding', estimatedHrs: 10, actualHrs: 10, budgetAmount: 1500, spentAmount: 1500, dueDate: '2026-04-10', createdAt: '2026-03-01' },
];

// ============================================================
// STORE IMPLEMENTATION
// ============================================================

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

const getDefaultState = () => ({
  users: INITIAL_USERS,
  tasks: INITIAL_TASKS,
  projects: INITIAL_PROJECTS,
  departments: INITIAL_DEPARTMENTS,
  currentUserId: 'u-ceo', // default: CEO view
  isManagerView: true,
  activeProjectId: null as string | null,
  activeDepartmentId: null as string | null,
});

export const useDemoStore = create<DemoState>()(
  persist(
    (set, get) => ({
      ...getDefaultState(),

      // ------- SELECTORS -------
      getUser: (id) => get().users.find(u => u.id === id),
      getProject: (id) => get().projects.find(p => p.id === id),
      getDepartment: (id) => get().departments.find(d => d.id === id),
      getTasksByProject: (projectId) => get().tasks.filter(t => t.projectId === projectId),
      getTasksByUser: (userId) => get().tasks.filter(t => t.assigneeId === userId),

      getUserWorkload: (userId) => {
        const user = get().users.find(u => u.id === userId);
        if (!user) return { allocated: 0, capacity: 0, percentage: 0, isOverloaded: false };
        const activeTasks = get().tasks.filter(t => t.assigneeId === userId && t.status !== 'Done');
        const allocated = activeTasks.reduce((sum, t) => sum + t.estimatedHrs, 0);
        const capacity = user.capacityHrs;
        const percentage = capacity > 0 ? Math.round((allocated / capacity) * 100) : 0;
        return { allocated, capacity, percentage, isOverloaded: allocated > capacity };
      },

      getDepartmentHealth: (departmentId) => {
        const dept = get().departments.find(d => d.id === departmentId);
        if (!dept) return { totalBudget: 0, spentBudget: 0, totalHrs: 0, spentHrs: 0, tasksDone: 0, tasksTotal: 0, efficiency: 0 };

        const projects = get().projects.filter(p => p.departmentId === departmentId);
        const allTaskIds = projects.flatMap(p => p.taskIds);
        const tasks = get().tasks.filter(t => allTaskIds.includes(t.id));

        const totalBudget = projects.reduce((s, p) => s + p.budgetAmount, 0);
        const spentBudget = tasks.reduce((s, t) => s + t.spentAmount, 0);
        const totalHrs = projects.reduce((s, p) => s + p.budgetHrs, 0);
        const spentHrs = tasks.reduce((s, t) => s + t.actualHrs, 0);
        const tasksDone = tasks.filter(t => t.status === 'Done').length;
        const tasksTotal = tasks.length;
        // Efficiency: done tasks / total, penalized by budget overage
        const completionRate = tasksTotal > 0 ? tasksDone / tasksTotal : 0;
        const budgetHealth = totalBudget > 0 ? Math.max(0, 1 - (spentBudget - totalBudget * completionRate) / totalBudget) : 1;
        const efficiency = Math.round(completionRate * budgetHealth * 100);

        return { totalBudget, spentBudget, totalHrs, spentHrs, tasksDone, tasksTotal, efficiency };
      },

      // ------- VIEW ACTIONS -------
      toggleManagerView: () => set(s => ({ isManagerView: !s.isManagerView })),
      setActiveProject: (id) => set({ activeProjectId: id }),
      setActiveDepartment: (id) => set({ activeDepartmentId: id }),
      switchUser: (userId) => set({ currentUserId: userId }),

      // ------- TASK CRUD -------
      addTask: (taskData) => {
        const newTask: Task = { ...taskData, id: `t-${generateId()}`, createdAt: new Date().toISOString() };
        set(s => {
          const updatedProjects = s.projects.map(p =>
            p.id === newTask.projectId ? { ...p, taskIds: [...p.taskIds, newTask.id] } : p
          );
          return { tasks: [...s.tasks, newTask], projects: updatedProjects };
        });
      },
      updateTask: (id, updates) =>
        set(s => ({ tasks: s.tasks.map(t => t.id === id ? { ...t, ...updates } : t) })),
      deleteTask: (id) =>
        set(s => ({
          tasks: s.tasks.filter(t => t.id !== id),
          projects: s.projects.map(p => ({ ...p, taskIds: p.taskIds.filter(tid => tid !== id) })),
        })),
      updateTaskStatus: (id, status) =>
        set(s => ({ tasks: s.tasks.map(t => t.id === id ? { ...t, status } : t) })),

      // ------- PROJECT CRUD -------
      addProject: (projectData) => {
        const newProject: Project = { ...projectData, id: `proj-${generateId()}`, taskIds: [] };
        set(s => {
          const updatedDepts = s.departments.map(d =>
            d.id === newProject.departmentId ? { ...d, projectIds: [...d.projectIds, newProject.id] } : d
          );
          return { projects: [...s.projects, newProject], departments: updatedDepts };
        });
      },
      updateProject: (id, updates) =>
        set(s => ({ projects: s.projects.map(p => p.id === id ? { ...p, ...updates } : p) })),
      deleteProject: (id) =>
        set(s => ({
          projects: s.projects.filter(p => p.id !== id),
          departments: s.departments.map(d => ({ ...d, projectIds: d.projectIds.filter(pid => pid !== id) })),
          tasks: s.tasks.filter(t => t.projectId !== id),
        })),

      // ------- DEPARTMENT CRUD -------
      addDepartment: (deptData) => {
        const newDept: Department = { ...deptData, id: `dept-${generateId()}`, projectIds: [] };
        set(s => ({ departments: [...s.departments, newDept] }));
      },
      updateDepartment: (id, updates) =>
        set(s => ({ departments: s.departments.map(d => d.id === id ? { ...d, ...updates } : d) })),

      // ------- USER CRUD -------
      addUser: (userData) => {
        const newUser: User = { ...userData, id: `u-${generateId()}` };
        set(s => ({ users: [...s.users, newUser] }));
      },
      updateUser: (id, updates) =>
        set(s => ({ users: s.users.map(u => u.id === id ? { ...u, ...updates } : u) })),
      deleteUser: (id) =>
        set(s => ({ users: s.users.filter(u => u.id !== id) })),

      // ------- AI REBALANCE -------
      autoRebalance: (projectId) => {
        const tasks = get().getTasksByProject(projectId);
        const projectUsers = [...new Set(tasks.map(t => t.assigneeId))];
        if (projectUsers.length < 2) return;

        // Find the most overloaded user and the least loaded
        const workloads = projectUsers.map(uid => ({ uid, ...get().getUserWorkload(uid) }));
        const maxUser = workloads.reduce((a, b) => a.allocated > b.allocated ? a : b);
        const minUser = workloads.reduce((a, b) => a.allocated < b.allocated ? a : b);

        // Move one non-Done task from maxUser to minUser
        const taskToMove = tasks.find(t => t.assigneeId === maxUser.uid && t.status !== 'Done');
        if (taskToMove) {
          set(s => ({
            tasks: s.tasks.map(t => t.id === taskToMove.id ? { ...t, assigneeId: minUser.uid } : t),
          }));
        }
      },

      // ------- RESET -------
      resetToDefaults: () => set(getDefaultState()),
    }),
    {
      name: 'workos-demo-store-v2',
    }
  )
);
