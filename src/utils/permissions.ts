/**
 * permissions.ts — Centralized role-based access control for WorkOS demo.
 *
 * ALL role-based decisions go through this module.
 * No component should implement inline role checks.
 *
 * Role Hierarchy & Rules:
 *   CEO         → Full visibility across all departments. Can reassign any task.
 *   Director    → Sees only their department. Can reassign tasks within their dept.
 *   Manager     → Sees only their department. Can reassign tasks within their dept.
 *   Contributor → Sees only their dept + only projects they are assigned to.
 *                 Cannot reassign tasks.
 */

import type { User, Task, Project, Department } from '../store/demoStore';

// ──────────────────────────────────────────────────
// Precomputation helpers (call once per render cycle)
// ──────────────────────────────────────────────────

/**
 * Build a map of projectId → departmentId for O(1) lookup.
 * Call at the top of the component before filtering.
 */
export function buildProjectDeptMap(projects: Project[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const p of projects) map.set(p.id, p.departmentId);
  return map;
}

/**
 * Build the Set of projectIds where userId has ≥1 assigned task.
 * Used exclusively for Contributor visibility.
 */
export function buildUserProjectSet(userId: string, tasks: Task[]): Set<string> {
  const set = new Set<string>();
  for (const t of tasks) {
    if (t.assigneeId === userId) set.add(t.projectId);
  }
  return set;
}

// ──────────────────────────────────────────────────
// Visibility predicates
// ──────────────────────────────────────────────────

/**
 * Can the user see this department in the sidebar / nav?
 * 'dept-exec' is always excluded from navigation regardless of role.
 */
export function canViewDept(user: User, deptId: string): boolean {
  if (deptId === 'dept-exec') return false;
  if (user.role === 'CEO') return true;
  return user.departmentId === deptId;
}

/**
 * Returns the departments the user may see (pre-filtered list).
 */
export function getVisibleDepts(user: User, allDepts: Department[]): Department[] {
  return allDepts.filter(d => canViewDept(user, d.id));
}

/**
 * Can the user see this project?
 * - CEO: always yes
 * - Director / Manager: yes if project is in their department
 * - Contributor: yes only if they have ≥1 task in the project
 */
export function canViewProject(
  user: User,
  project: Project,
  userProjectIds: Set<string>,
): boolean {
  if (user.role === 'CEO') return true;
  if (project.departmentId !== user.departmentId) return false;
  if (user.role === 'Contributor') return userProjectIds.has(project.id);
  return true; // Director, Manager
}

/**
 * Can the user see this task?
 * - CEO: always yes
 * - Director / Manager: yes if task belongs to their department
 * - Contributor: yes only if they work on the same project
 */
export function canViewTask(
  user: User,
  task: Task,
  projectDeptMap: Map<string, string>,
  userProjectIds: Set<string>,
): boolean {
  if (user.role === 'CEO') return true;
  const deptId = projectDeptMap.get(task.projectId);
  if (deptId !== user.departmentId) return false;
  if (user.role === 'Contributor') return userProjectIds.has(task.projectId);
  return true; // Director, Manager
}

// ──────────────────────────────────────────────────
// Edit predicates
// ──────────────────────────────────────────────────

/**
 * Can the user reassign (change the owner of) a given task?
 * - CEO: always yes
 * - Director / Manager: yes, but ONLY within their own department
 * - Contributor: never
 *
 * @param taskDeptId  The departmentId of the project the task belongs to.
 */
export function canReassignTask(user: User, taskDeptId: string): boolean {
  if (user.role === 'CEO') return true;
  if (user.role === 'Contributor') return false;
  return user.departmentId === taskDeptId; // Director, Manager: own dept only
}
