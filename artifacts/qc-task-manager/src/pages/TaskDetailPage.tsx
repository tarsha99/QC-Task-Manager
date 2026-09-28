import { useState } from 'react';
import { AlertTriangle, ArrowLeft, CalendarDays, Check, CheckCircle2, Clock3, FileText, History, Loader2, Pencil, RotateCcw, Trash2 } from 'lucide-react';
import { Link, useLocation, useParams } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import {
  getGetDashboardStatsQueryKey,
  getGetDueTasksQueryKey,
  getGetRecentActivityQueryKey,
  getGetTaskQueryKey,
  getListTasksQueryKey,
  useCompleteTask,
  useDeleteTask,
  useGetTask,
  useUpdateTask,
} from '@workspace/api-client-react';
import { formatTaskDate, formatTaskTime, relativeTime, StatusPill } from '@/components/TaskPrimitives';

export default function TaskDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const taskQuery = useGetTask(id, { query: { queryKey: getGetTaskQueryKey(id), enabled: Number.isFinite(id) } });
  const completeTask = useCompleteTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [notice, setNotice] = useState('');

  function refresh() {
    void queryClient.invalidateQueries({ queryKey: getGetTaskQueryKey(id) });
    void queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
    void queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
    void queryClient.invalidateQueries({ queryKey: getGetDueTasksQueryKey() });
    void queryClient.invalidateQueries({ queryKey: getGetRecentActivityQueryKey({ limit: 8 }) });
  }

  if (taskQuery.isLoading) return <div className="mx-auto max-w-[920px]" data-testid="loading-task-detail"><div className="skeleton h-4 w-28 rounded" /><div className="mt-9 skeleton h-10 w-3/4 rounded" /><div className="mt-3 skeleton h-4 w-1/2 rounded" /><div className="mt-12 grid gap-5 lg:grid-cols-[1fr_300px]"><div className="skeleton h-64 rounded-2xl" /><div className="skeleton h-48 rounded-2xl" /></div></div>;
  if (taskQuery.isError || !taskQuery.data) return <div className="empty-state mx-auto mt-12 max-w-[480px]" data-testid="error-task-detail"><AlertTriangle size={22} /><p>Task not found.</p><span>This task may have been deleted or the link is out of date.</span><div className="mt-3 flex gap-2"><button onClick={() => void taskQuery.refetch()} className="button-primary rounded-lg px-3 py-2 text-xs font-bold" data-testid="button-retry-task-detail">Retry</button><Link href="/tasks" className="rounded-lg border border-[hsl(var(--border))] px-3 py-2 text-xs font-bold" data-testid="link-back-task-list">Back to queue</Link></div></div>;

  const task = taskQuery.data;
  const isBusy = completeTask.isPending || updateTask.isPending || deleteTask.isPending;

  function complete() {
    completeTask.mutate({ id: task.id }, { onSuccess: () => { refresh(); setNotice('Task completed.'); window.setTimeout(() => setNotice(''), 2600); } });
  }

  function cancel() {
    updateTask.mutate({ id: task.id, data: { status: 'Cancelled' } }, { onSuccess: () => { refresh(); setNotice('Task cancelled.'); window.setTimeout(() => setNotice(''), 2600); } });
  }

  function remove() {
    deleteTask.mutate({ id: task.id }, { onSuccess: () => { refresh(); setLocation('/tasks'); }, onError: () => { setNotice('Could not delete this task.'); setConfirmDelete(false); } });
  }

  return <div className="mx-auto max-w-[920px] space-y-7" data-testid="page-task-detail">
    <div className="flex items-center justify-between"><Link href="/tasks" className="inline-flex items-center gap-2 text-xs font-semibold text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]" data-testid="link-back-tasks"><ArrowLeft size={15} /> Back to queue</Link><span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[hsl(var(--muted-foreground))]">Task #{String(task.id).padStart(4, '0')}</span></div>
    <div className="flex flex-col justify-between gap-5 border-b border-[hsl(var(--border))] pb-7 sm:flex-row sm:items-end"><div><div className="mb-3"><StatusPill status={task.status} /></div><h1 className={`max-w-[730px] font-display text-3xl font-bold tracking-[-0.06em] sm:text-[42px] ${task.status === 'Completed' ? 'text-[hsl(var(--muted-foreground))] line-through decoration-[hsl(var(--border))]' : ''}`} data-testid="text-task-detail-title">{task.title}</h1><p className="mt-3 text-xs text-[hsl(var(--muted-foreground))]">Updated {relativeTime(task.updatedAt)}</p></div><div className="flex flex-wrap items-center gap-2"><Link href={`/tasks/${task.id}/edit`} className="inline-flex items-center gap-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3.5 py-2.5 text-xs font-bold hover:bg-[hsl(var(--secondary))]" data-testid="link-edit-task-detail"><Pencil size={14} /> Edit</Link>{task.status !== 'Completed' && task.status !== 'Cancelled' && <button onClick={complete} disabled={isBusy} className="button-primary inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-bold disabled:opacity-60" data-testid="button-complete-detail">{completeTask.isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Complete</button>}</div></div>

    <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
      <article className="panel overflow-hidden"><div className="border-b border-[hsl(var(--border))] px-5 py-4"><p className="section-kicker">Task brief</p></div><div className="p-5 sm:p-7"><div className="flex items-start gap-3"><FileText size={17} className="mt-0.5 text-[hsl(var(--chart-4))]" /><div className="min-w-0"><h2 className="text-xs font-bold uppercase tracking-[0.08em]">Context</h2>{task.description ? <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[hsl(var(--foreground)/0.78)]" data-testid="text-task-description">{task.description}</p> : <p className="mt-4 text-sm italic text-[hsl(var(--muted-foreground))]" data-testid="text-task-description-empty">No context added yet. Add a note to make the handoff easier.</p>}</div></div></div><div className="border-t border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.32)] px-5 py-4 sm:px-7"><div className="flex flex-wrap gap-4 text-[10px] text-[hsl(var(--muted-foreground))]"><span className="flex items-center gap-1.5"><History size={13} /> Created {relativeTime(task.createdAt)}</span>{task.completedAt && <span className="flex items-center gap-1.5 text-[hsl(145_56%_32%)]"><CheckCircle2 size={13} /> Completed {relativeTime(task.completedAt)}</span>}</div></div></article>
      <aside className="space-y-5"><section className="panel overflow-hidden"><div className="border-b border-[hsl(var(--border))] px-5 py-4"><p className="section-kicker">Schedule</p></div><div className="space-y-5 p-5"><div className="flex items-start gap-3"><div className="grid h-8 w-8 place-items-center rounded-lg bg-[hsl(var(--secondary))]"><CalendarDays size={15} className="text-[hsl(var(--chart-4))]" /></div><div><div className="text-[11px] font-bold">Date</div><div className="mt-1 text-xs text-[hsl(var(--muted-foreground))]" data-testid="text-task-date">{formatTaskDate(task)}</div></div></div><div className="flex items-start gap-3"><div className="grid h-8 w-8 place-items-center rounded-lg bg-[hsl(var(--secondary))]"><Clock3 size={15} className="text-[hsl(var(--chart-4))]" /></div><div><div className="text-[11px] font-bold">Time</div><div className="mt-1 font-mono text-xs text-[hsl(var(--muted-foreground))]" data-testid="text-task-time">{formatTaskTime(task)}</div></div></div><Link href={`/tasks/${task.id}/edit`} className="flex items-center justify-between rounded-lg border border-dashed border-[hsl(var(--border))] px-3 py-2.5 text-[11px] font-bold text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--foreground)/0.4)] hover:text-[hsl(var(--foreground))]" data-testid="link-reschedule-task"><span className="flex items-center gap-2"><RotateCcw size={13} /> Reschedule</span><span>→</span></Link></div></section>
        <section className="rounded-2xl border border-[hsl(var(--destructive)/0.22)] bg-[hsl(var(--destructive)/0.05)] p-5"><p className="section-kicker text-[hsl(var(--destructive))]">Danger zone</p><p className="mt-2 text-xs leading-relaxed text-[hsl(var(--muted-foreground))]">Cancel or delete this task if the plan has changed.</p><div className="mt-4 flex gap-2">{task.status !== 'Cancelled' && task.status !== 'Completed' && <button onClick={cancel} disabled={isBusy} className="inline-flex items-center gap-1.5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-2.5 py-2 text-[11px] font-bold hover:bg-[hsl(var(--secondary))]" data-testid="button-cancel-task"><XIcon /> Cancel task</button>}<button onClick={() => setConfirmDelete(true)} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[11px] font-bold text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive)/0.1)]" data-testid="button-delete-detail"><Trash2 size={13} /> Delete</button></div></section></aside>
    </div>
    {notice && <div className="completion-toast" data-testid="status-task-detail-action"><CheckCircle2 size={17} /> {notice}</div>}
    {confirmDelete && <div className="fixed inset-x-4 bottom-20 z-50 mx-auto max-w-[430px] rounded-2xl border border-[hsl(var(--destructive)/0.25)] bg-[hsl(var(--card))] p-5 shadow-[0_18px_55px_hsl(224_32%_15%/0.2)] sm:inset-x-auto sm:right-8 sm:bottom-8"><h3 className="text-sm font-bold">Permanently delete this task?</h3><p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">This cannot be undone.</p><div className="mt-4 flex justify-end gap-2"><button onClick={() => setConfirmDelete(false)} className="rounded-lg px-3 py-2 text-xs font-bold text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))]" data-testid="button-cancel-delete-detail">Keep task</button><button onClick={remove} disabled={deleteTask.isPending} className="rounded-lg bg-[hsl(var(--destructive))] px-3 py-2 text-xs font-bold text-white disabled:opacity-60" data-testid="button-confirm-delete-detail">{deleteTask.isPending ? 'Deleting…' : 'Delete task'}</button></div></div>}
  </div>;
}

function XIcon() {
  return <span className="grid h-3.5 w-3.5 place-items-center rounded-full border border-current text-[9px] leading-none">×</span>;
}