import { convexQuery, useConvexMutation } from '@convex-dev/react-query';
import { Button } from '@/components/ui/button';
import { api } from '@convex/_generated/api';
import { createFileRoute } from '@tanstack/react-router';
import type { Id } from '@convex/_generated/dataModel';
import { useSuspenseQuery } from '@tanstack/react-query';
import { memo, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  type Connection,
  type NodeTypes,
  type OnNodesChange,
  type OnEdgesChange,
  type NodeChange,
  type EdgeChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import xyFlow from '@xyflow/react/dist/base.css?url';
import { TaskNode } from '@/components/dashboard/sidebar/TaskNode';

export const Route = createFileRoute('/_authenticated/project/$projectId/tasks')({
  loader: async ({ context, params }) => {
    const projectId = params.projectId as Id<'projects'>;
    await Promise.all([
      context.queryClient.ensureQueryData(convexQuery(api.projects.get, { projectId })),
      context.queryClient.ensureQueryData(convexQuery(api.tasks.listForProject, { projectId })),
      context.queryClient.ensureQueryData(convexQuery(api.edges.listForProject, { projectId })),
    ]);
  },
  head: () => ({
    links: [{ rel: 'stylesheet', href: xyFlow }],
  }),
  component: RouteComponent,
});

const nodeTypes: NodeTypes = {
  task: TaskNode,
  default: TaskNode,
};

function RouteComponent() {
  const projectId = Route.useParams().projectId as Id<'projects'>;

  const { data: project } = useSuspenseQuery(convexQuery(api.projects.get, { projectId }));
  const { data: convexNodes } = useSuspenseQuery(convexQuery(api.tasks.listForProject, { projectId }));
  const { data: convexEdges } = useSuspenseQuery(convexQuery(api.edges.listForProject, { projectId }));

  const createTask = useConvexMutation(api.tasks.create);
  const updatePosition = useConvexMutation(api.tasks.updatePosition);
  const removeTask = useConvexMutation(api.tasks.remove);
  const createEdge = useConvexMutation(api.edges.create);
  const removeEdge = useConvexMutation(api.edges.remove);

  const nodes = useMemo(() => (convexNodes || []) as Node[], [convexNodes]);
  const edges = useMemo(() => (convexEdges || []) as Edge[], [convexEdges]);

  // Stable objects to prevent unnecessary re-renders
  const layoutStyle = useMemo(
    () => ({ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column' }),
    [],
  );
  const onConnect = useCallback(
    (connection: Connection) => {
      if (connection.source && connection.target) {
        createEdge({
          projectId,
          source: connection.source as Id<'tasks'>,
          target: connection.target as Id<'tasks'>,
          type: 'default',
          sourceHandle: connection.sourceHandle ?? undefined,
          targetHandle: connection.targetHandle ?? undefined,
        });
      }
    },
    [createEdge, projectId],
  );

  const onNodeDragStop = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      updatePosition({
        taskId: node.id as Id<'tasks'>,
        position: node.position,
      });
    },
    [updatePosition],
  );

  const onNodesChange: OnNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const removedNodes = changes.filter((change) => change.type === 'remove');
      if (removedNodes.length > 0) {
        removedNodes.forEach((change) => {
          if (change.type === 'remove') {
            removeTask({ taskId: change.id as Id<'tasks'> });
          }
        });
      }
    },
    [removeTask],
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const removedEdges = changes.filter((change) => change.type === 'remove');
      if (removedEdges.length > 0) {
        removedEdges.forEach((change) => {
          if (change.type === 'remove') {
            removeEdge({ edgeId: change.id as Id<'edges'> });
          }
        });
      }
    },
    [removeEdge],
  );

  const addNewTask = useCallback(() => {
    const position = {
      x: Math.random() * 500,
      y: Math.random() * 500,
    };

    createTask({
      projectId,
      type: 'task',
      position,
      data: {
        label: `Task ${nodes.length + 1}`,
        status: 'todo',
        priority: 'medium',
      },
    });
  }, [createTask, projectId, nodes.length]);

  return (
    <div style={layoutStyle}>
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <h1 className="text-2xl font-bold">{project?.name ?? 'Project'}</h1>
        <Button
        type='button'
          onClick={addNewTask}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Add Task
        </Button>
      </div>
      <TasksGraph
        nodes={nodes}
        edges={edges}
        onConnect={onConnect}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
      />
    </div>
  );
}

type TasksGraphProps = {
  nodes: Node[];
  edges: Edge[];
  onConnect: (connection: Connection) => void;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onNodeDragStop: (_event: React.MouseEvent, node: Node) => void;
};

const TasksGraph = memo(function TasksGraph({
  nodes,
  edges,
  onConnect,
  onNodesChange,
  onEdgesChange,
  onNodeDragStop,
}: TasksGraphProps) {
  const layoutStyle = useMemo(
    () => ({ flex: 1, width: '100%', height: '100%', backgroundColor: '#ffffff' }),
    [],
  );
  const fitViewOptions = useMemo(() => ({ padding: 2 }), []);
  const defaultEdgeOptions = useMemo(() => ({ type: 'default' as const }), []);
  const proOptions = useMemo(() => ({ hideAttribution: true }), []);
  const snapGrid = useMemo(() => [15, 15] as [number, number], []);

  return (
    <div style={layoutStyle}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        zoomOnScroll={true}
        onlyRenderVisibleElements
        onConnect={onConnect}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
        fitView
        fitViewOptions={fitViewOptions}
        defaultEdgeOptions={defaultEdgeOptions}
        proOptions={proOptions}
        snapToGrid
        snapGrid={snapGrid}
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
});
