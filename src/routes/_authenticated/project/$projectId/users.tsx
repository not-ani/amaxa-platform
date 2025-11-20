import { createFileRoute } from '@tanstack/react-router';
import { convexQuery, useConvexMutation } from '@convex-dev/react-query';
import { api } from '@convex/_generated/api';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useDashboardContext } from '@/components/dashboard/context';
import { useState, useMemo } from 'react';
import type { Id } from '@convex/_generated/dataModel';

export const Route = createFileRoute('/_authenticated/project/$projectId/users')({
  loader: async ({ context, params }) => {
    const projectId = params.projectId as Id<'projects'>;
    await Promise.all([
      context.queryClient.ensureQueryData(convexQuery(api.userToProject.listUsersForProject, { projectId })),
      context.queryClient.ensureQueryData(convexQuery(api.users.list, {})),
    ]);
  },
  component: RouteComponent,
});

function RouteComponent() {
  const projectId = Route.useParams().projectId as Id<'projects'>;
  const { userRole } = useDashboardContext();
  const isCoach = userRole === 'coach';

  const { data: projectUsers } = useSuspenseQuery(
    convexQuery(api.userToProject.listUsersForProject, { projectId })
  );
  
  const { data: allUsers } = useSuspenseQuery(
    convexQuery(api.users.list, {})
  );

  const assignUser = useConvexMutation(api.userToProject.assign);
  const removeUser = useConvexMutation(api.userToProject.remove);
  const updateRole = useConvexMutation(api.userToProject.updateRole);

  const [newUserId, setNewUserId] = useState('');
  const [newUserRole, setNewUserRole] = useState<'coach' | 'member'>('member');

  // Filter out users already in the project
  const availableUsers = useMemo(() => {
    const projectUserIds = new Set(projectUsers.map((pu) => pu.userId));
    return allUsers.filter((user) => !projectUserIds.has(user.tokenIdentifier));
  }, [allUsers, projectUsers]);

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
              <select
                value={newUserId}
                onChange={(e) => setNewUserId(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-md"
              >
                <option value="">Select a user...</option>
                {availableUsers.map((user) => (
                  <option key={user._id} value={user.tokenIdentifier}>
                    {user.firstName || user.lastName
                      ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                      : user.email || user.tokenIdentifier}
                    {user.email && ` (${user.email})`}
                  </option>
                ))}
              </select>
              <select
                value={newUserRole}
                onChange={(e) => setNewUserRole(e.target.value as 'coach' | 'member')}
                className="px-3 py-2 border rounded-md"
              >
                <option value="member">Member</option>
                <option value="coach">Coach</option>
              </select>
              <Button onClick={handleAddUser} disabled={!newUserId}>
                Add User
              </Button>
            </div>
            {availableUsers.length === 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                All users are already added to this project.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Users ({projectUsers.length})</CardTitle>
          <CardDescription>All users with access to this project</CardDescription>
        </CardHeader>
        <CardContent>
          {projectUsers.length === 0 ? (
            <p className="text-muted-foreground">No users found in this project.</p>
          ) : (
            <div className="space-y-2">
              {projectUsers.map((projectUser) => {
                const user = projectUser.user;
                const displayName = user
                  ? user.firstName || user.lastName
                    ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                    : user.email || 'Unknown User'
                  : projectUser.userId;
                const email = user?.email;
                const initials = user
                  ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'U'
                  : 'U';

                return (
                  <div
                    key={projectUser._id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user?.profilePictureUrl} alt={displayName} />
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{displayName}</p>
                        {email && (
                          <p className="text-sm text-muted-foreground">{email}</p>
                        )}
                        <p className="text-sm text-muted-foreground">
                          Role: <span className="capitalize">{projectUser.role}</span>
                        </p>
                      </div>
                    </div>
                    {isCoach && (
                      <div className="flex gap-2">
                        <select
                          value={projectUser.role}
                          onChange={(e) =>
                            handleUpdateRole(
                              projectUser.userId,
                              e.target.value as 'coach' | 'member'
                            )
                          }
                          className="px-3 py-2 border rounded-md"
                        >
                          <option value="member">Member</option>
                          <option value="coach">Coach</option>
                        </select>
                        <Button
                          variant="destructive"
                          onClick={() => handleRemoveUser(projectUser.userId)}
                        >
                          Remove
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
