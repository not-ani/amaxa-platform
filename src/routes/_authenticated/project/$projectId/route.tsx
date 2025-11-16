import { createFileRoute, Outlet } from '@tanstack/react-router';
import { Id } from '@convex/_generated/dataModel';
import { DashboardProvider } from '@/components/dashboard/context';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/dashboard/sidebar/app-sidebar';

export const Route = createFileRoute('/_authenticated/project/$projectId')({
  component: RouteComponent,
});

function RouteComponent() {
  const projectId = Route.useParams({
    select: (params) => params.projectId as Id<'projects'>,
  });

  return (
    <DashboardProvider projectId={projectId}>
      <SidebarProvider>
        <AppSidebar projectId={projectId} />
        <main className="flex-1">
          <Outlet />
        </main>
      </SidebarProvider>
    </DashboardProvider>
  );
}
