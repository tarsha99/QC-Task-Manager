import { Link } from 'wouter';
import { ArrowUpRight, Check, Clock3, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import type { Task, TaskStatus } from '@workspace/api-client-react';

export const statusMeta: Record<TaskStatus, { label: string; tone: string; dot: string }> = {
  Scheduled: { label: 'Scheduled', tone: 'status-neutral', dot: 'bg-[hsl(var(--muted-foreground))]' },
  Upcoming: { label: 'Upcoming', tone: 'status-upcoming', dot: 'bg-[hsl(var(--chart-4))]' },
  Due: { label: 'Due now', tone: 'status-due', dot: 'bg-[hsl(var(--destructive))]' },
  Completed: { label: 'Completed', tone: 'status-completed', dot: 'bg-[hsl(145_56%_40%)]' },
  Cancelled: { label: 'Cancelled', tone: 'status-cancelled', dot: 'bg-[hsl(var(--muted-foreground))]' },
};

export function StatusPill({ status }: { status: TaskStatus }) {
  const meta = statusMeta[status];
  return <span className={`status-pill ${meta.tone}`} data-testid={`status-task-${status.toLowerCase()}`}><span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${meta.dot}`} />{meta.label}</span>;
}

export function formatTaskDate(task: Pick<Task, 'scheduledDate' | 'scheduledTime' | 'scheduledAt'>) {
  const date = scheduledTaskInstant(task);
  if (Number.isNaN(date.getTime())) return `${task.scheduledDate} · ${task.scheduledTime}`;
  return new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'Asia/Kolkata' }).format(date);
}

export function formatTaskTime(task: Pick<Task, 'scheduledDate' | 'scheduledTime' | 'scheduledAt'>) {
  const date = scheduledTaskInstant(task);
  if (Number.isNaN(date.getTime())) return task.scheduledTime;
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' }).format(date);
}

function scheduledTaskInstant(task: Pick<Task, 'scheduledDate' | 'scheduledTime' | 'scheduledAt'>) {
  const rawDate = String(task.scheduledDate);
  const calendarDate = rawDate.includes('T') ? rawDate.slice(0, 10) : rawDate;
  return new Date(`${calendarDate}T${task.scheduledTime}:00+05:30`);
}

export function relativeTime(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

type TaskRowProps = {
  task: Task;
  onComplete?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  compact?: boolean;
};

export function TaskRow({ task, onComplete, onDelete, compact = false }: TaskRowProps) {
  return (
    <div className={`task-row group ${compact ? 'py-3' : 'py-4'}`} data-testid={`row-task-${task.id}`}>
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <button
          onClick={() => onComplete?.(task)}
          disabled={task.status === 'Completed' || task.status === 'Cancelled'}
          className={`task-check mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 transition-all ${task.status === 'Completed' ? 'border-[hsl(145_56%_40%)] bg-[hsl(145_56%_40%)] text-white' : 'border-[hsl(var(--border))] hover:border-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent)/0.35)]'} disabled:cursor-default`}
          aria-label={task.status === 'Completed' ? 'Task completed' : `Complete ${task.title}`}
          data-testid={`button-complete-task-${task.id}`}
        >
          {task.status === 'Completed' && <Check size={12} strokeWidth={3} />}
        </button>
        <div className="min-w-0 flex-1">
          <Link href={`/tasks/${task.id}`} className={`block truncate text-[13px] font-bold tracking-[-0.01em] transition-colors hover:text-[hsl(var(--chart-4))] ${task.status === 'Completed' ? 'text-[hsl(var(--muted-foreground))] line-through decoration-[hsl(var(--border))]' : ''}`} data-testid={`link-task-${task.id}`}>{task.title}</Link>
          {!compact && task.description && <p className="mt-1 line-clamp-1 text-[11px] text-[hsl(var(--muted-foreground))]">{task.description}</p>}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] uppercase tracking-[0.04em] text-[hsl(var(--muted-foreground))]">
            <span className="flex items-center gap-1"><Clock3 size={11} />{formatTaskDate(task)} · {formatTaskTime(task)}</span>
            {!compact && <StatusPill status={task.status} />}
          </div>
        </div>
      </div>
      <div className="ml-3 flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
        <Link href={`/tasks/${task.id}/edit`} className="rounded-lg p-2 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))]" aria-label={`Edit ${task.title}`} data-testid={`link-edit-task-${task.id}`}><Pencil size={14} /></Link>
        {onDelete && <button onClick={() => onDelete(task)} className="rounded-lg p-2 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--destructive)/0.12)] hover:text-[hsl(var(--destructive))]" aria-label={`Delete ${task.title}`} data-testid={`button-delete-task-${task.id}`}><Trash2 size={14} /></button>}
        <Link href={`/tasks/${task.id}`} className="rounded-lg p-2 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))]" aria-label={`View ${task.title}`} data-testid={`link-view-task-${task.id}`}><ArrowUpRight size={14} /></Link>
      </div>
      <MoreHorizontal size={16} className="ml-2 shrink-0 text-[hsl(var(--border))] sm:hidden" />
    </div>
  );
}

export function SkeletonRows({ count = 4 }: { count?: number }) {
  return <div className="space-y-1" aria-label="Loading tasks" data-testid="loading-task-skeleton">{Array.from({ length: count }).map((_, index) => <div key={index} className="flex items-center gap-3 border-b border-[hsl(var(--border)/0.55)] py-4"><div className="skeleton h-5 w-5 rounded-full" /><div className="flex-1 space-y-2"><div className="skeleton h-3.5 w-2/5 rounded" /><div className="skeleton h-2.5 w-1/4 rounded" /></div></div>)}</div>;
}