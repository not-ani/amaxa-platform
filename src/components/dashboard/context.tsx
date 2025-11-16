import { convexQuery } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createContext, useContext } from "react";
import type { Id } from "@convex/_generated/dataModel";

interface Project {
  name: string;
}

export const DashboardContext = createContext<{
  project: Project;
}>({
  project: {
    name: '',
  },
});

export const useDashboardContext = () => {
  return useContext(DashboardContext);
};

export const DashboardProvider = ({ children, projectId }: { children: React.ReactNode, projectId: Id<'projects'> }) => {
  const { data: project } = useSuspenseQuery(convexQuery(api.projects.get, { projectId }));
  if (!project) return <div>Project not found</div>;

  return <DashboardContext.Provider value={{ project: { name: project.name }}}>{children}</DashboardContext.Provider>;
};