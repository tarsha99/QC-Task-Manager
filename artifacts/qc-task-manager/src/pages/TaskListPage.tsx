import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Filter, Plus, Search, SlidersHorizontal, X } from 'lucide-react';
import { Link } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import {
  getGetDashboardStatsQueryKey,
  getGetDueTasksQueryKey,
  getGetRecentActivityQueryKey,
  getGetTaskQueryKey,
  getListTasksQueryKey,
  useCompleteTask,
  useDeleteTask,
  useListTasks,
} from '@workspace/api-client-react';
import type { ListTasksParams, Task } from '@workspace/api-client-react';
import { SkeletonRows, TaskRow } from '@/components/TaskPrimitives';

const filters: Array<{ label: string; value: ListTasksParams['status'] }> = [
  { label: 'All tasks', value: 'All' },
  { label: 'Scheduled', value: 'Scheduled' },
  { label: 'Upcoming', value: 'Upcoming' },
  { label: 'Due now', value: 'Due' },
  { label: 'Completed', value: 'Completed' },
  { label: 'Cancelled', value: 'Cancelled' },
];

export default function TaskListPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ListTasksParams['status']>('All');
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  const [notice, setNotice] = useState('');
  const params = useMemo<ListTasksParams>(() => ({ search: search.trim() || undefined, status, limit: 100 }), [search, status]);
  const tasksQuery = useListTasks(params, { query: { queryKey: getListTasksQueryKey(params) } });
  const completeTask = useCompleteTask();
  const deleteTask = useDeleteTask();

  function refresh() {
    void queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
    void queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
    void queryClient.invalidateQueries({ queryKey: getGetDueTasksQueryKey() });
    void queryClient.invalidateQueries({ queryKey: getGetRecentActivityQueryKey({ limit: 8 }) });
  }

  function complete(task: Task) {
    completeTask.mutate({ id: task.id }, { onSuccess: (updated) => { refresh(); void queryClient.invalidateQueries({ queryKey: getGetTaskQueryKey(updated.id) }); setNotice('Task marked complete.'); window.setTimeout(() => setNotice(''), 2400); } });
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    deleteTask.mutate({ id: deleteTarget.id }, { onSuccess: () => { setDeleteTarget(null); refresh(); setNotice('Task deleted from the queue.'); window.setTimeout(() => setNotice(''), 2400); }, onError: () => setNotice('Could not delete that task.') });
  }

  const tasks = tasksQuery.data ?? [];
  const grouped = tasks.reduce<Record<string, Task[]>>((acc, task) => { const key = task.status === 'Due' ? 'Needs attention' : task.status === 'Completed' ? 'Closed out' : 'Planned'; (acc[key] ||= []).push(task); return acc; }, {});

  return <div className="space-y-6" data-testid="page-task-list">
    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><div className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--chart-4))]"><span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--chart-4))]" /> Work queue</div><h1 className="font-display text-3xl font-bold tracking-[-0.06em] sm:text-[38px]">All tasks.</h1><p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">Search, focus, and keep the handoffs moving.</p></div><Link href="/tasks/new" className="button-primary inline-flex items-center gap-2 self-start rounded-xl px-3.5 py-2.5 text-xs font-bold sm:self-auto" data-testid="link-new-task-list"><Plus size={15} /> New task</Link></div>

    <div className="panel overflow-hidden"><div className="flex flex-col gap-3 border-b border-[hsl(var(--border))] p-4 sm:flex-row sm:items-center sm:justify-between"><div className="relative min-w-0 flex-1 sm:max-w-[390px]"><Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by title or context…" className="field-input h-10 pl-9 pr-8 text-xs" data-testid="input-search-tasks" />{search && <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]" aria-label="Clear search" data-testid="button-clear-search"><X size={14} /></button>}</div><div className="flex items-center gap-2 text-[11px] text-[hsl(var(--muted-foreground))]"><SlidersHorizontal size={14} /><span>Showing</span><strong className="font-mono text-[hsl(var(--foreground))]" data-testid="text-task-count">{tasksQuery.isLoading ? '—' : tasks.length}</strong></div></div>
      <div className="flex gap-1 overflow-x-auto border-b border-[hsl(var(--border))] px-4 py-2 scrollbar-none">{filters.map((filter) => <button key={filter.label} onClick={() => setStatus(filter.value)} className={`whitespace-nowrap rounded-lg px-2.5 py-2 text-[11px] font-bold transition-colors ${status === filter.value ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]' : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))]'}`} data-testid={`button-filter-${filter.label.toLowerCase().replaceAll(' ', '-')}`}><Filter size={12} className="mr-1.5 inline" />{filter.label}</button>)}</div>
      {tasksQuery.isLoading ? <div className="p-5"><SkeletonRows count={6} /></div> : tasksQuery.isError ? <div className="empty-state m-8"><AlertTriangle size={20} /><p>We couldn’t load the queue.</p><span>Check your connection, then try again.</span><button onClick={() => void tasksQuery.refetch()} className="button-primary mt-2 rounded-lg px-3 py-2 text-xs font-bold" data-testid="button-retry-tasks">Retry</button></div> : tasks.length === 0 ? <div className="empty-state m-8"><CheckCircle2 size={21} /><p>{search ? 'No matches found.' : 'Your queue is clear.'}</p><span>{search ? 'Try another phrase or clear the search.' : 'Schedule a task when the next piece of work is ready.'}</span>{search ? <button onClick={() => setSearch('')} className="mt-2 text-xs font-bold text-[hsl(var(--chart-4))]" data-testid="button-empty-clear-search">Clear search</button> : <Link href="/tasks/new" className="button-primary mt-2 rounded-lg px-3 py-2 text-xs font-bold" data-testid="link-empty-new-task">Schedule first task</Link>}</div> : <div className="p-5">{['Needs attention', 'Planned', 'Closed out'].map((group) => grouped[group]?.length ? <div key={group} className="mb-7 last:mb-0"><div className="mb-1 flex items-center justify-between"><h2 className="section-kicker">{group}</h2><span className="font-mono text-[10px] text-[hsl(var(--muted-foreground))]">{grouped[group].length}</span></div>{grouped[group].map((task) => <TaskRow key={task.id} task={task} onComplete={complete} onDelete={setDeleteTarget} />)}</div> : null)}</div>}
    </div>
    {notice && <div className="completion-toast" data-testid="status-task-action"><CheckCircle2 size={17} /> {notice}</div>}
    {deleteTarget && <div className="fixed inset-x-4 bottom-20 z-50 mx-auto max-w-[440px] rounded-2xl border border-[hsl(var(--destructive)/0.25)] bg-[hsl(var(--card))] p-5 shadow-[0_18px_55px_hsl(224_32%_15%/0.2)] sm:inset-x-auto sm:right-8 sm:bottom-8"><div className="flex gap-3"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[hsl(var(--destructive)/0.12)] text-[hsl(var(--destructive))]"><AlertTriangle size={17} /></div><div><h3 className="text-sm font-bold">Delete this task?</h3><p className="mt-1 text-xs leading-relaxed text-[hsl(var(--muted-foreground))]">“{deleteTarget.title}” will be removed permanently.</p><div className="mt-4 flex gap-2"><button onClick={confirmDelete} disabled={deleteTask.isPending} className="rounded-lg bg-[hsl(var(--destructive))] px-3 py-2 text-xs font-bold text-white disabled:opacity-60" data-testid="button-confirm-delete">{deleteTask.isPending ? 'Deleting…' : 'Delete task'}</button><button onClick={() => setDeleteTarget(null)} className="rounded-lg px-3 py-2 text-xs font-bold text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))]" data-testid="button-cancel-delete">Keep it</button></div></div></div></div>}
  </div>;
}