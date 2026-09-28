import { useEffect, useRef, useState } from 'react';
import { Link } from 'wouter';
import { AlertTriangle, ArrowRight, Check, CheckCircle2, ChevronRight, Clock3, Database, Gauge, ListChecks, RefreshCw, Server, Sparkles, TimerReset, TrendingUp } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import {
  getGetDashboardStatsQueryKey,
  getGetDueTasksQueryKey,
  getGetRecentActivityQueryKey,
  getHealthCheckQueryKey,
  getGetTaskQueryKey,
  useCompleteTask,
  useGetDashboardStats,
  useGetDueTasks,
  useGetRecentActivity,
  useHealthCheck,
} from '@workspace/api-client-react';
import type { Activity, HealthStatus, Task } from '@workspace/api-client-react';
import { formatTaskDate, formatTaskTime, relativeTime, SkeletonRows, StatusPill, TaskRow } from '@/components/TaskPrimitives';

function StatCard({ label, value, note, accent, testId }: { label: string; value: number | string; note: string; accent: string; testId: string }) {
  return <div className="stat-card" data-testid={testId}><div className={`stat-accent ${accent}`} /><div className="flex items-start justify-between"><span className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">{label}</span><TrendingUp size={14} className="text-[hsl(var(--muted-foreground)/0.7)]" /></div><div className="mt-3 font-display text-3xl font-bold tracking-[-0.06em] text-[hsl(var(--foreground))]">{value}</div><div className="mt-1 text-[11px] text-[hsl(var(--muted-foreground))]">{note}</div></div>;
}

function HealthCard({ health, isLoading, isError }: { health?: HealthStatus; isLoading: boolean; isError: boolean }) {
  const checks = health ? [{ label: 'Database', value: health.database, icon: Database }, { label: 'Scheduler', value: health.scheduler, icon: TimerReset }, { label: 'API', value: health.api, icon: Server }] : [];
  return <section className="panel overflow-hidden" data-testid="card-system-health">
    <div className="flex items-center justify-between border-b border-[hsl(var(--border))] px-5 py-4"><div><p className="section-kicker">System pulse</p><h2 className="mt-1 font-display text-base font-bold tracking-[-0.03em]">Health check</h2></div><div className={`flex items-center gap-2 rounded-full px-2.5 py-1 text-[10px] font-bold ${health?.status === 'healthy' ? 'bg-[hsl(145_56%_40%/0.12)] text-[hsl(145_56%_32%)]' : 'bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))]'}`} data-testid="status-system-health"><span className={`h-1.5 w-1.5 rounded-full ${health?.status === 'healthy' ? 'bg-[hsl(145_56%_40%)]' : 'bg-[hsl(var(--muted-foreground))]'}`} />{health?.status === 'healthy' ? 'Operational' : isError ? 'Unavailable' : 'Checking'}</div></div>
    {isLoading ? <div className="space-y-3 p-5"><div className="skeleton h-10 rounded-xl" /><div className="skeleton h-10 rounded-xl" /></div> : <div className="grid grid-cols-3 divide-x divide-[hsl(var(--border))] p-5">{checks.map(({ label, value, icon: Icon }) => <div key={label} className="px-3 first:pl-0 last:pr-0"><Icon size={15} className="mb-2 text-[hsl(var(--chart-4))]" /><div className="text-[11px] font-semibold">{label}</div><div className="mt-1 font-mono text-[10px] capitalize text-[hsl(var(--muted-foreground))]">{value || '—'}</div></div>)}</div>}
  </section>;
}

function ActivityFeed({ activities, isLoading, isError }: { activities?: Activity[]; isLoading: boolean; isError: boolean }) {
  return <section className="panel" data-testid="card-recent-activity"><div className="flex items-center justify-between border-b border-[hsl(var(--border))] px-5 py-4"><div><p className="section-kicker">The paper trail</p><h2 className="mt-1 font-display text-base font-bold tracking-[-0.03em]">Recent activity</h2></div><Link href="/tasks" className="text-[11px] font-bold text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]" data-testid="link-view-all-activity">View queue <ArrowRight size={13} className="ml-1 inline" /></Link></div>
    {isLoading ? <div className="p-5"><SkeletonRows count={3} /></div> : isError ? <div className="empty-state mx-5 my-5"><AlertTriangle size={18} /><p>Activity is taking a breather.</p><span>Refresh the page to try again.</span></div> : activities?.length ? <div className="divide-y divide-[hsl(var(--border)/0.65)] px-5">{activities.slice(0, 6).map((activity) => <div key={activity.id} className="flex gap-3 py-3.5" data-testid={`activity-${activity.id}`}><div className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg ${activity.type === 'completed' ? 'bg-[hsl(145_56%_40%/0.12)] text-[hsl(145_56%_32%)]' : activity.type === 'due' ? 'bg-[hsl(var(--destructive)/0.11)] text-[hsl(var(--destructive))]' : 'bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))]'}`}>{activity.type === 'completed' ? <Check size={14} /> : activity.type === 'due' ? <AlertTriangle size={14} /> : <Clock3 size={14} />}</div><div className="min-w-0"><p className="text-[12px] font-medium leading-snug text-[hsl(var(--foreground))]">{activity.message}</p><div className="mt-1 flex items-center gap-2 text-[10px] text-[hsl(var(--muted-foreground))]"><span>{relativeTime(activity.timestamp)}</span><span>·</span><Link href={`/tasks/${activity.task.id}`} className="truncate hover:text-[hsl(var(--foreground))]" data-testid={`link-activity-task-${activity.id}`}>{activity.task.title}</Link></div></div></div>)}</div> : <div className="empty-state m-5"><Sparkles size={18} /><p>Nothing has moved yet.</p><span>Your task activity will show up here.</span></div>}
  </section>;
}

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const statsQuery = useGetDashboardStats({ query: { queryKey: getGetDashboardStatsQueryKey() } });
  const healthQuery = useHealthCheck({ query: { queryKey: getHealthCheckQueryKey(), retry: 1, refetchInterval: 15_000 } });
  const dueQuery = useGetDueTasks({ query: { queryKey: getGetDueTasksQueryKey(), refetchInterval: 15_000 } });
  const activityQuery = useGetRecentActivity({ limit: 8 }, { query: { queryKey: getGetRecentActivityQueryKey({ limit: 8 }), refetchInterval: 15_000 } });
  const completeTask = useCompleteTask();
  const [completedId, setCompletedId] = useState<number | null>(null);
  const [reminderTask, setReminderTask] = useState<Task | null>(null);
  const seenDueIds = useRef<Set<number>>(new Set());

  function complete(task: Task) {
    setCompletedId(task.id);
    completeTask.mutate({ id: task.id }, {
      onSuccess: (updated) => {
        void queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
        void queryClient.invalidateQueries({ queryKey: getGetDueTasksQueryKey() });
        void queryClient.invalidateQueries({ queryKey: getGetRecentActivityQueryKey({ limit: 8 }) });
        void queryClient.invalidateQueries({ queryKey: getGetTaskQueryKey(updated.id) });
        window.setTimeout(() => setCompletedId(null), 450);
      },
      onError: () => setCompletedId(null),
    });
  }

  const stats = statsQuery.data;
  const nextTask = stats?.nextTask;
  const dueTasks = dueQuery.data ?? [];

  useEffect(() => {
    if (!dueTasks.length) return;
    const stored = window.localStorage.getItem('qc-task-manager-seen-due');
    if (stored) {
      try {
        seenDueIds.current = new Set(JSON.parse(stored) as number[]);
      } catch {
        seenDueIds.current = new Set();
      }
    }
    const freshTask = dueTasks.find((task) => !seenDueIds.current.has(task.id));
    if (!freshTask) return;

    seenDueIds.current.add(freshTask.id);
    window.localStorage.setItem('qc-task-manager-seen-due', JSON.stringify([...seenDueIds.current]));
    setReminderTask(freshTask);
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('Task reminder', { body: `${freshTask.title} is due now.` });
      } else if (Notification.permission === 'default') {
        void Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            new Notification('Task reminder', { body: `${freshTask.title} is due now.` });
          }
        });
      }
    }
  }, [dueTasks]);

  const todayLabel = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date());

  return <div className="space-y-8" data-testid="page-dashboard">
    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><div className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--chart-4))]"><span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--chart-4))]" /> {todayLabel}, workspace control</div><h1 className="font-display text-3xl font-bold tracking-[-0.06em] sm:text-[40px]">Good morning, team.</h1><p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">Here’s the signal. Keep the important work moving.</p></div><Link href="/tasks" className="inline-flex items-center gap-2 self-start rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3.5 py-2.5 text-xs font-bold transition-colors hover:bg-[hsl(var(--secondary))] sm:self-auto" data-testid="link-open-task-queue"><ListChecks size={15} /> Open task queue <ArrowRight size={14} /></Link></div>

    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5 lg:gap-4">
      <StatCard label="All tasks" value={statsQuery.isLoading ? '—' : stats?.total ?? 0} note="across this workspace" accent="accent-ink" testId="stat-total" />
      <StatCard label="Scheduled" value={statsQuery.isLoading ? '—' : stats?.scheduled ?? 0} note="planned work" accent="accent-lime" testId="stat-scheduled" />
      <StatCard label="Upcoming" value={statsQuery.isLoading ? '—' : stats?.upcoming ?? 0} note="on the horizon" accent="accent-teal" testId="stat-upcoming" />
      <StatCard label="Due now" value={statsQuery.isLoading ? '—' : stats?.due ?? 0} note="needs attention" accent="accent-coral" testId="stat-due" />
      <StatCard label="Completed" value={statsQuery.isLoading ? '—' : stats?.completed ?? 0} note="closed out" accent="accent-green" testId="stat-completed" />
    </div>

    <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
      <section className="hero-panel relative overflow-hidden" data-testid="card-next-task"><div className="absolute right-0 top-0 h-40 w-40 translate-x-12 -translate-y-12 rounded-full border-[22px] border-[hsl(var(--accent)/0.35)]" /><div className="absolute bottom-0 right-24 h-16 w-16 rounded-full bg-[hsl(var(--accent)/0.14)] blur-xl" /><div className="relative p-6 sm:p-8"><div className="flex items-center justify-between"><div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--accent))]"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[hsl(var(--accent))]" /> Next in line</div>{nextTask && <StatusPill status={nextTask.status} />}</div>{statsQuery.isLoading ? <div className="mt-14 space-y-3"><div className="skeleton skeleton-dark h-8 w-3/4 rounded" /><div className="skeleton skeleton-dark h-4 w-1/2 rounded" /></div> : nextTask ? <div className="mt-12 max-w-[650px]"><h2 className="font-display text-2xl font-bold leading-tight tracking-[-0.05em] text-[hsl(var(--card))] sm:text-3xl" data-testid="text-next-task-title">{nextTask.title}</h2><p className="mt-3 line-clamp-2 max-w-[550px] text-sm leading-relaxed text-[hsl(var(--card)/0.62)]">{nextTask.description || 'No additional context added for this task.'}</p><div className="mt-8 flex flex-wrap items-center gap-3"><span className="inline-flex items-center gap-2 rounded-lg bg-[hsl(var(--card)/0.1)] px-3 py-2 font-mono text-[11px] text-[hsl(var(--card)/0.78)]"><Clock3 size={14} className="text-[hsl(var(--accent))]" />{formatTaskDate(nextTask)} · {formatTaskTime(nextTask)}</span><Link href={`/tasks/${nextTask.id}`} className="inline-flex items-center gap-1.5 rounded-lg bg-[hsl(var(--accent))] px-3 py-2 text-[11px] font-bold text-[hsl(var(--primary))] hover:brightness-95" data-testid="link-next-task">Open task <ArrowRight size={13} /></Link></div></div> : <div className="mt-12"><h2 className="font-display text-2xl font-bold tracking-[-0.05em] text-[hsl(var(--card))]">Clear runway.</h2><p className="mt-2 text-sm text-[hsl(var(--card)/0.62)]">No upcoming tasks. Add the next important thing to keep momentum.</p><Link href="/tasks/new" className="button-lime mt-6 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold" data-testid="link-create-from-empty"><Sparkles size={14} /> Schedule something</Link></div>}</div></section>
      <HealthCard health={healthQuery.data} isLoading={healthQuery.isLoading} isError={healthQuery.isError} />
    </div>

    <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
      <section className="panel" data-testid="card-due-reminders"><div className="flex items-center justify-between border-b border-[hsl(var(--border))] px-5 py-4"><div><p className="section-kicker text-[hsl(var(--destructive))]">Attention lane</p><h2 className="mt-1 font-display text-base font-bold tracking-[-0.03em]">Due reminders</h2></div><span className="rounded-full bg-[hsl(var(--destructive)/0.1)] px-2 py-1 font-mono text-[10px] font-bold text-[hsl(var(--destructive))]" data-testid="text-due-count">{dueTasks.length} open</span></div>{dueQuery.isLoading ? <div className="p-5"><SkeletonRows count={2} /></div> : dueQuery.isError ? <div className="empty-state m-5"><AlertTriangle size={18} /><p>Couldn’t load due work.</p><span>Try again from the task queue.</span></div> : dueTasks.length ? <div className="px-5">{dueTasks.slice(0, 4).map((task) => <TaskRow task={task} key={task.id} onComplete={complete} compact />)}</div> : <div className="empty-state m-5"><CheckCircle2 size={19} /><p>Nothing is due.</p><span>Nice. The queue is under control.</span></div>}</section>
      <ActivityFeed activities={activityQuery.data} isLoading={activityQuery.isLoading} isError={activityQuery.isError} />
    </div>
     {completedId && <div className="completion-toast" data-testid="status-task-completed"><CheckCircle2 size={17} /> Task completed. Nice work.</div>}
     {reminderTask && <div className="fixed bottom-5 right-5 z-50 flex max-w-sm items-start gap-3 rounded-2xl border border-[hsl(var(--destructive)/0.25)] bg-[hsl(var(--card))] p-4 shadow-2xl" role="alert" data-testid="alert-task-reminder"><AlertTriangle size={18} className="mt-0.5 shrink-0 text-[hsl(var(--destructive))]" /><div className="min-w-0 flex-1"><p className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[hsl(var(--destructive))]">Task reminder</p><p className="mt-1 text-sm font-bold">{reminderTask.title} is due now.</p><div className="mt-3 flex items-center gap-3"><Link href={`/tasks/${reminderTask.id}`} onClick={() => setReminderTask(null)} className="rounded-lg bg-[hsl(var(--foreground))] px-3 py-2 text-[11px] font-bold text-[hsl(var(--background))]">Open task</Link><button type="button" onClick={() => setReminderTask(null)} className="text-[11px] font-bold text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">Dismiss</button></div></div></div>}
  </div>;
}