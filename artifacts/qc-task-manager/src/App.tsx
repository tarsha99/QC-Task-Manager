import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { WorkspaceShell } from '@/components/WorkspaceShell';
import DashboardPage from '@/pages/DashboardPage';
import TaskDetailPage from '@/pages/TaskDetailPage';
import TaskListPage from '@/pages/TaskListPage';
import { TaskForm } from '@/components/TaskForm';
import NotFound from '@/pages/not-found';
import { getGetTaskQueryKey, useGetTask } from '@workspace/api-client-react';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();

function Router() {
  return (
    <WorkspaceShell>
      <RoutedErrorBoundary>
        <Switch>
          <Route path="/" component={DashboardPage} />
          <Route path="/tasks/new">
            <TaskForm mode="create" />
          </Route>
          <Route path="/tasks/:id/edit">
            <TaskEditRoute />
          </Route>
          <Route path="/tasks/:id" component={TaskDetailPage} />
          <Route path="/tasks" component={TaskListPage} />
          <Route component={NotFound} />
        </Switch>
      </RoutedErrorBoundary>
    </WorkspaceShell>
  );
}

function TaskEditRoute() {
  const [location] = useLocation();
  const taskId = Number(location.split('/')[2]);
  return <TaskEditLoader id={taskId} />;
}

function TaskEditLoader({ id }: { id: number }) {
  const query = useGetTask(id, { query: { queryKey: getGetTaskQueryKey(id), enabled: Number.isFinite(id) } });
  if (query.isLoading) return <div className="mx-auto max-w-[860px]"><div className="skeleton h-4 w-28 rounded" /><div className="mt-9 skeleton h-10 w-2/3 rounded" /><div className="mt-3 skeleton h-4 w-1/2 rounded" /><div className="mt-10 skeleton h-[450px] rounded-2xl" /></div>;
  if (query.isError || !query.data) return <NotFound />;
  return <TaskForm task={query.data} mode="edit" />;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
