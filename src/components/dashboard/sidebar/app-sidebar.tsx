import { NavProjects } from './nav-projects';
import { NavUser } from './nav-user';
import { TeamDisplay } from './team-switcher';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from '@/components/ui/sidebar';
import { Frame, PieChart, MapIcon } from 'lucide-react';
import type { Id } from '@convex/_generated/dataModel';




export function AppSidebar({ projectId, ...props }: React.ComponentProps<typeof Sidebar> & { projectId: Id<'projects'> }) {
const links = [
    {
      name: 'Home',
      url: `/project/${projectId}`,
      icon: Frame,
    },
    {
      name: 'Tasks',
      url: `/project/${projectId}/tasks`,
      icon: PieChart,
    },
    {
      name: 'Users',
      url: `/project/${projectId}/users`,
      icon: MapIcon,
    },

];
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamDisplay />
      </SidebarHeader>
      <SidebarContent>
        <NavProjects projects={links} projectId={projectId} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
