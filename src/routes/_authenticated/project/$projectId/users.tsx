import { createFileRoute } from '@tanstack/react-router';
import { convexQuery, useConvexMutation } from '@convex-dev/react-query';
import { api } from '@convex/_generated/api';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useDashboardContext } from '@/components/dashboard/context';
import { useState } from 'react';
import type { Id } from '@convex/_generated/dataModel';

export const Route = createFileRoute('/_authenticated/project/$projectId/users')({
  loader: async ({ context, params }) => {
    const projectId = params.projectId as Id<'projects'>;
    await Promise.all([
      context.queryClient.ensureQueryData(convexQuery(api.userToProject.listUsersForProject, { projectId })),
    ]);
  },
  component: RouteComponent,
});

function RouteComponent() {
  const projectId = Route.useParams().projectId as Id<'projects'>;
  const { userRole } = useDashboardContext();
  const isCoach = userRole === 'coach';

  const { data: users } = useSuspenseQuery(
    convexQuery(api.userToProject.listUsersForProject, { projectId })
  );

  const assignUser = useConvexMutation(api.userToProject.assign);
  const removeUser = useConvexMutation(api.userToProject.remove);
  const updateRole = useConvexMutation(api.userToProject.updateRole);

  const [newUserId, setNewUserId] = useState('');
  const [newUserRole, setNewUserRole] = useState<'coach' | 'member'>('member');

  const handleAddUser = async () => {
    if (!newUserId.trim()) return;
    try {
      await assignUser({
        userId: newUserId.trim(),
        projectId,
        role: newUserRole,
      });
      setNewUserId('');
      setNewUserRole('member');
    } catch (error) {
      alert(`Failed to add user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this user from the project?')) return;
    try {
      await removeUser({ userId, projectId });
    } catch (error) {
      alert(`Failed to remove user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleUpdateRole = async (userId: string, role: 'coach' | 'member') => {
    try {
      await updateRole({ userId, projectId, role });
    } catch (error) {
      alert(`Failed to update role: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Project Users</h1>
        <p className="text-muted-foreground">
          Manage users and their roles in this project. Your role: <strong>{userRole || 'None'}</strong>
        </p>
      </div>

      {isCoach && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Add User</CardTitle>
            <CardDescription>Add a new user to this project</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                placeholder="User ID"
                value={newUserId}
                onChange={(e) => setNewUserId(e.target.value)}
                className="flex-1"
              />
              <select
                value={newUserRole}
                onChange={(e) => setNewUserRole(e.target.value as 'coach' | 'member')}
                className="px-3 py-2 border rounded-md"
              >
                <option value="member">Member</option>
                <option value="coach">Coach</option>
              </select>
              <Button onClick={handleAddUser}>Add User</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Users ({users.length})</CardTitle>
          <CardDescription>All users with access to this project</CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-muted-foreground">No users found in this project.</p>
          ) : (
            <div className="space-y-2">
              {users.map((user) => (
                <div
                  key={user._id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{user.userId}</p>
                    <p className="text-sm text-muted-foreground">
                      Role: <span className="capitalize">{user.role}</span>
                    </p>
                  </div>
                  {isCoach && (
                    <div className="flex gap-2">
                      <select
                        value={user.role}
                        onChange={(e) =>
                          handleUpdateRole(user.userId, e.target.value as 'coach' | 'member')
                        }
                        className="px-3 py-2 border rounded-md"
                      >
                        <option value="member">Member</option>
                        <option value="coach">Coach</option>
                      </select>
                      <Button
                        variant="destructive"
                        onClick={() => handleRemoveUser(user.userId)}
                      >
                        Remove
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
