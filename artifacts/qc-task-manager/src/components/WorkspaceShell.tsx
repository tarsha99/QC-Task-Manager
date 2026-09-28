import { useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import {
  Activity,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Command,
  LayoutDashboard,
  Menu,
  Plus,
  Search,
  X,
} from 'lucide-react';

type WorkspaceShellProps = {
  children: ReactNode;
};

const navItems = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/tasks', label: 'Task queue', icon: ClipboardList },
];

export function WorkspaceShell({ children }: WorkspaceShellProps) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-[100dvh] bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[254px] flex-col border-r border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar))] px-4 py-5 text-[hsl(var(--sidebar-foreground))] transition-transform duration-300 md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        data-testid="sidebar-workspace"
      >
        <div className="mb-8 flex items-center justify-between px-2">
          <Link href="/" className="group flex items-center gap-3" data-testid="link-brand">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[hsl(var(--sidebar-primary))] text-[hsl(var(--sidebar-primary-foreground))] shadow-[0_5px_0_hsl(224_32%_8%/0.25)]">
              <CheckCircle2 size={20} strokeWidth={2.4} />
            </span>
            <span>
              <span className="block font-display text-[15px] font-bold tracking-[-0.03em]">qc / ops</span>
              <span className="mt-0.5 block font-mono text-[9px] uppercase tracking-[0.2em] text-[hsl(var(--sidebar-foreground)/0.5)]">task manager</span>
            </span>
          </Link>
          <button className="rounded-lg p-1.5 text-[hsl(var(--sidebar-foreground)/0.6)] hover:bg-[hsl(var(--sidebar-accent))] md:hidden" onClick={() => setMobileOpen(false)} aria-label="Close navigation" data-testid="button-close-navigation">
            <X size={17} />
          </button>
        </div>

        <div className="mb-3 px-2 font-mono text-[9px] font-medium uppercase tracking-[0.2em] text-[hsl(var(--sidebar-foreground)/0.38)]">Workspace</div>
        <nav className="space-y-1" aria-label="Primary navigation">
          {navItems.map((item) => {
            const active = item.href === '/' ? location === '/' : location.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`group flex items-center justify-between rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-all ${
                  active
                    ? 'bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-foreground))] shadow-[inset_3px_0_0_hsl(var(--sidebar-primary))]'
                    : 'text-[hsl(var(--sidebar-foreground)/0.62)] hover:bg-[hsl(var(--sidebar-accent)/0.7)] hover:text-[hsl(var(--sidebar-foreground))]'
                }`}
                data-testid={`link-nav-${item.label.toLowerCase().replace(' ', '-')}`}
              >
                <span className="flex items-center gap-3"><Icon size={17} strokeWidth={active ? 2.3 : 1.8} /><span>{item.label}</span></span>
                {active && <ChevronRight size={14} className="text-[hsl(var(--sidebar-primary))]" />}
              </Link>
            );
          })}
        </nav>

        <div className="mt-8 px-2 font-mono text-[9px] font-medium uppercase tracking-[0.2em] text-[hsl(var(--sidebar-foreground)/0.38)]">Shortcuts</div>
        <div className="mt-3 space-y-1.5 px-2 text-[11px] text-[hsl(var(--sidebar-foreground)/0.52)]">
          <div className="flex items-center justify-between"><span className="flex items-center gap-2"><Command size={13} /> Search tasks</span><kbd className="rounded border border-[hsl(var(--sidebar-border))] px-1.5 py-0.5 font-mono text-[9px]">⌘ K</kbd></div>
          <div className="flex items-center justify-between"><span className="flex items-center gap-2"><Plus size={13} /> New task</span><kbd className="rounded border border-[hsl(var(--sidebar-border))] px-1.5 py-0.5 font-mono text-[9px]">N</kbd></div>
        </div>

        <div className="mt-auto rounded-2xl border border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-accent)/0.65)] p-3.5">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold"><span className="h-1.5 w-1.5 rounded-full bg-[hsl(145_56%_53%)] shadow-[0_0_0_3px_hsl(145_56%_53%/0.14)]" /> All systems operational</div>
          <p className="text-[10px] leading-relaxed text-[hsl(var(--sidebar-foreground)/0.46)]">Your workspace is synced and watching the queue.</p>
        </div>
      </aside>

      {mobileOpen && <button className="fixed inset-0 z-30 bg-[hsl(224_32%_10%/0.52)] md:hidden" onClick={() => setMobileOpen(false)} aria-label="Close navigation overlay" data-testid="button-navigation-overlay" />}

      <div className="md:pl-[254px]">
        <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-[hsl(var(--border)/0.75)] bg-[hsl(var(--background)/0.92)] px-5 backdrop-blur-xl sm:px-8">
          <div className="flex items-center gap-3">
            <button className="rounded-xl border border-[hsl(var(--border))] p-2 text-[hsl(var(--muted-foreground))] md:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation" data-testid="button-open-navigation"><Menu size={18} /></button>
            <div className="hidden items-center gap-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.55)] px-3 py-2 text-[11px] text-[hsl(var(--muted-foreground))] sm:flex">
              <Search size={14} /><span>Jump to anything</span><kbd className="ml-3 rounded border border-[hsl(var(--border))] px-1.5 py-0.5 font-mono text-[9px]">⌘ K</kbd>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-[hsl(var(--muted-foreground))] sm:hidden"><Activity size={14} className="text-[hsl(var(--chart-4))]" /> Live workspace</div>
          </div>
          <div className="flex items-center gap-2.5">
            <Link href="/tasks/new" className="button-primary inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-bold shadow-[0_3px_0_hsl(224_32%_8%/0.2)] transition-transform hover:-translate-y-0.5 active:translate-y-0" data-testid="link-new-task-header"><Plus size={15} strokeWidth={2.5} /><span className="hidden sm:inline">New task</span><span className="sm:hidden">New</span></Link>
            <div className="hidden h-8 w-px bg-[hsl(var(--border))] sm:block" />
            <div className="grid h-9 w-9 place-items-center rounded-full bg-[hsl(var(--secondary))] font-display text-xs font-bold text-[hsl(var(--foreground))]" data-testid="avatar-user">QC</div>
          </div>
        </header>
        <main className="mx-auto max-w-[1500px] px-5 py-7 pb-24 sm:px-8 lg:px-10 lg:py-9">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 flex h-[66px] items-center justify-around border-t border-[hsl(var(--border))] bg-[hsl(var(--card)/0.95)] px-6 backdrop-blur-xl md:hidden" aria-label="Mobile navigation">
        {navItems.map((item) => {
          const active = item.href === '/' ? location === '/' : location.startsWith(item.href);
          const Icon = item.icon;
          return <Link href={item.href} key={item.href} className={`flex flex-col items-center gap-1 text-[10px] font-semibold ${active ? 'text-[hsl(var(--foreground))]' : 'text-[hsl(var(--muted-foreground))]'}`} data-testid={`link-mobile-${item.label.toLowerCase().replace(' ', '-')}`}><Icon size={18} /><span>{item.label}</span></Link>;
        })}
        <Link href="/tasks/new" className="flex flex-col items-center gap-1 text-[10px] font-semibold text-[hsl(var(--muted-foreground))]" data-testid="link-mobile-new"><CalendarClock size={18} /><span>Schedule</span></Link>
      </nav>
    </div>
  );
}