import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { useConvexMutation } from '@convex-dev/react-query';
import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';

export type TaskNodeData = {
  label: string;
  description?: string;
  status?: 'todo' | 'in_progress' | 'completed' | 'blocked';
  assignedTo?: string;
  dueDate?: number;
  priority?: 'low' | 'medium' | 'high';
};

const statusColors = {
  todo: 'bg-gray-100 border-gray-300',
  in_progress: 'bg-blue-50 border-blue-400',
  completed: 'bg-green-50 border-green-400',
  blocked: 'bg-red-50 border-red-400',
};

const priorityColors = {
  low: 'text-gray-600',
  medium: 'text-yellow-600',
  high: 'text-red-600',
};

export const TaskNode = memo(({ data, id }: NodeProps) => {
  const taskData = data as TaskNodeData;
  const updateData = useConvexMutation(api.tasks.updateData);

  const status = taskData.status || 'todo';
  const priority = taskData.priority || 'medium';

  const handleStatusChange = (newStatus: typeof status) => {
    updateData({
      taskId: id as Id<'tasks'>,
      data: {
        ...taskData,
        status: newStatus,
      },
    });
  };

  return (
    <div className={`px-4 text-black py-3 shadow-md rounded-lg border-2 ${statusColors[status]}`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3" />

      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-sm">{taskData.label}</h3>
          <span className={`text-xs font-medium ${priorityColors[priority]}`}>{priority.toUpperCase()}</span>
        </div>

        {taskData.description && <p className="text-xs line-clamp-2">{taskData.description}</p>}

        <div className="flex items-center gap-1">
          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value as typeof status)}
            className="text-xs px-2 py-1 rounded border cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          >
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>

        {taskData.assignedTo && <div className="text-xs text-gray-500">👤 {taskData.assignedTo}</div>}
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
});

TaskNode.displayName = 'TaskNode';
