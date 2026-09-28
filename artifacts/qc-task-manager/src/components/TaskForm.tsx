import { useEffect, useState } from 'react';
import { ArrowLeft, CalendarDays, Check, Clock3, FileText, Loader2, Save } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import {
  getGetDashboardStatsQueryKey,
  getGetRecentActivityQueryKey,
  getGetTaskQueryKey,
  getGetDueTasksQueryKey,
  getListTasksQueryKey,
  useCreateTask,
  useUpdateTask,
} from '@workspace/api-client-react';
import type { Task } from '@workspace/api-client-react';

type TaskFormProps = { task?: Task; mode: 'create' | 'edit' };

function localDate(value?: string) {
  if (value) return value.slice(0, 10);
  return new Date().toISOString().slice(0, 10);
}

function localTime(value?: string) {
  if (!value) return '09:00';
  const date = new Date(value);
  if (!Number.isNaN(date.getTime()) && value.includes('T')) return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  return value.slice(0, 5);
}

export function TaskForm({ task, mode }: TaskFormProps) {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [scheduledDate, setScheduledDate] = useState(localDate(task?.scheduledDate));
  const [scheduledTime, setScheduledTime] = useState(localTime(task?.scheduledTime));
  const [error, setError] = useState('');

  useEffect(() => {
    setTitle(task?.title ?? '');
    setDescription(task?.description ?? '');
    setScheduledDate(localDate(task?.scheduledDate));
    setScheduledTime(localTime(task?.scheduledTime));
  }, [task?.id]);

  const isPending = createTask.isPending || updateTask.isPending;

  function refreshWorkspace(id?: number) {
    void queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
    void queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
    void queryClient.invalidateQueries({ queryKey: getGetDueTasksQueryKey() });
    void queryClient.invalidateQueries({ queryKey: getGetRecentActivityQueryKey({ limit: 8 }) });
    if (id) void queryClient.invalidateQueries({ queryKey: getGetTaskQueryKey(id) });
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (!title.trim()) {
      setError('Give this task a clear title before scheduling it.');
      return;
    }
    if (!scheduledDate || !scheduledTime) {
      setError('Choose a date and time for this task.');
      return;
    }
    const data = { title: title.trim(), description: description.trim() || undefined, scheduledDate, scheduledTime };
    if (mode === 'edit' && task) {
      updateTask.mutate({ id: task.id, data }, {
        onSuccess: (updated) => {
          refreshWorkspace(updated.id);
          setLocation(`/tasks/${updated.id}`);
        },
        onError: () => setError('Could not save this change. Check the connection and try again.'),
      });
    } else {
      createTask.mutate({ data }, {
        onSuccess: (created) => {
          refreshWorkspace(created.id);
          setLocation(`/tasks/${created.id}`);
        },
        onError: () => setError('Could not create this task. Check the connection and try again.'),
      });
    }
  }

  return (
    <div className="mx-auto max-w-[860px]">
      <Link href={mode === 'edit' && task ? `/tasks/${task.id}` : '/tasks'} className="mb-8 inline-flex items-center gap-2 text-xs font-semibold text-[hsl(var(--muted-foreground))] transition-colors hover:text-[hsl(var(--foreground))]" data-testid="link-back-form"><ArrowLeft size={15} /> Back to {mode === 'edit' ? 'task' : 'queue'}</Link>
      <div className="mb-8 flex items-end justify-between gap-5">
        <div>
          <div className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--chart-4))]"><span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--chart-4))]" /> {mode === 'edit' ? 'Edit schedule' : 'New work item'}</div>
          <h1 className="font-display text-3xl font-bold tracking-[-0.05em] text-[hsl(var(--foreground))] sm:text-4xl">{mode === 'edit' ? 'Adjust the plan.' : 'Put it on the board.'}</h1>
          <p className="mt-2 max-w-[520px] text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">{mode === 'edit' ? 'Change the details or move this task to a better moment.' : 'Make the next important thing visible, specific, and scheduled.'}</p>
        </div>
        {mode === 'edit' && task && <div className="hidden text-right sm:block"><div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">Task ID</div><div className="mt-1 font-mono text-sm font-semibold text-[hsl(var(--foreground))]">#{String(task.id).padStart(4, '0')}</div></div>}
      </div>

      <form onSubmit={submit} className="overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-[0_12px_40px_hsl(224_32%_15%/0.05)]" data-testid={`form-task-${mode}`}>
        <div className="space-y-7 p-5 sm:p-8">
          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-[hsl(var(--foreground))]"><FileText size={14} className="text-[hsl(var(--chart-4))]" /> Task title <span className="text-[hsl(var(--destructive))]">*</span></span>
            <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={160} autoFocus placeholder="e.g. Review research proposal" className="field-input text-base font-semibold" data-testid="input-task-title" />
            <span className="mt-2 block text-[11px] text-[hsl(var(--muted-foreground))]">{title.length}/160 · Start with a verb so the next action is obvious.</span>
          </label>
          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-[hsl(var(--foreground))]"><FileText size={14} className="text-[hsl(var(--chart-4))]" /> Context <span className="font-normal normal-case tracking-normal text-[hsl(var(--muted-foreground))]">(optional)</span></span>
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={500} rows={4} placeholder="Add a link, handoff note, or the definition of done." className="field-input resize-none leading-relaxed" data-testid="input-task-description" />
            <span className="mt-2 block text-[11px] text-[hsl(var(--muted-foreground))]">{description.length}/500</span>
          </label>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-[hsl(var(--foreground))]"><CalendarDays size={14} className="text-[hsl(var(--chart-4))]" /> Date <span className="text-[hsl(var(--destructive))]">*</span></span>
              <input type="date" value={scheduledDate} onChange={(event) => setScheduledDate(event.target.value)} className="field-input font-mono text-sm" data-testid="input-task-date" />
            </label>
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-[hsl(var(--foreground))]"><Clock3 size={14} className="text-[hsl(var(--chart-4))]" /> Time <span className="text-[hsl(var(--destructive))]">*</span></span>
              <input type="time" value={scheduledTime} onChange={(event) => setScheduledTime(event.target.value)} className="field-input font-mono text-sm" data-testid="input-task-time" />
            </label>
          </div>
        </div>
        {error && <div className="mx-5 mb-1 rounded-xl border border-[hsl(var(--destructive)/0.25)] bg-[hsl(var(--destructive)/0.08)] px-4 py-3 text-xs font-semibold text-[hsl(var(--destructive))] sm:mx-8" role="alert" data-testid="status-form-error">{error}</div>}
        <div className="flex items-center justify-between gap-4 border-t border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.38)] px-5 py-4 sm:px-8">
          <p className="hidden text-[11px] text-[hsl(var(--muted-foreground))] sm:block">You can always reschedule this later.</p>
          <div className="ml-auto flex items-center gap-2">
            <Link href={mode === 'edit' && task ? `/tasks/${task.id}` : '/tasks'} className="rounded-xl px-4 py-2.5 text-xs font-bold text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))]" data-testid="link-cancel-form">Cancel</Link>
            <button type="submit" disabled={isPending} className="button-primary inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold disabled:cursor-wait disabled:opacity-60" data-testid="button-submit-task">
              {isPending ? <Loader2 size={15} className="animate-spin" /> : mode === 'edit' ? <Save size={15} /> : <Check size={15} />}
              {isPending ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Schedule task'}
            </button>
          </div>
        </div>
      </form>
      <div className="mt-5 flex items-start gap-3 rounded-xl border border-dashed border-[hsl(var(--border))] px-4 py-3.5 text-[11px] text-[hsl(var(--muted-foreground))]"><span className="font-mono font-semibold text-[hsl(var(--chart-4))]">TIP</span><span>Tasks are automatically surfaced as upcoming or due as their scheduled time approaches.</span></div>
    </div>
  );
}