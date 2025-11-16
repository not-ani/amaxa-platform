import { Link, createFileRoute } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getAuth, getSignInUrl, getSignUpUrl } from '@workos/authkit-tanstack-react-start';
import { convexQuery } from '@convex-dev/react-query';
import { useSuspenseQuery } from '@tanstack/react-query';
import { api } from '@convex/_generated/api';
import { Authenticated, Unauthenticated } from 'convex/react';

export const Route = createFileRoute('/_authenticated/')({
  component: Home,
  loader: async ({ context }) => {
    const [user, signInUrl, signUpUrl] = await Promise.all([
      getAuth(),
      getSignInUrl(),
      getSignUpUrl(),
      context.queryClient.ensureQueryData(convexQuery(api.projects.list, {})),
    ]);
    return { user, signInUrl, signUpUrl };
  },
});

function Home() {
  return <HomeContent />;
}

function HomeContent() {
  const { data } = useSuspenseQuery(convexQuery(api.projects.list, {}));
  return (
    <>
      <header className="sticky top-0 z-10 bg-background p-4 border-b-2 border-slate-200 dark:border-slate-800 flex flex-row justify-between items-center">
        Amaxa Platform Demo (v0.0.1)
      </header>
      <main className="p-8 flex flex-col gap-8 items-center mx-auto ">
        <div className="grid grid-cols-3  gap-4">
          {data.map((project) => (
            <Card key={project._id}>
              <Link
                to={`/project/$projectId`}
                params={{
                  projectId: project._id,
                }}
              >
                <CardHeader>
                  <CardTitle>{project.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{project.description}</p>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      </main>
    </>
  );
}

function SignInForm({ signInUrl, signUpUrl }: { signInUrl: string; signUpUrl: string }) {
  return (
    <div className="flex flex-col gap-8 w-96 mx-auto">
      <p>Log in to see the numbers</p>
      <a href={signInUrl}>
        <button className="bg-foreground text-background px-4 py-2 rounded-md">Sign in</button>
      </a>
      <a href={signUpUrl}>
        <button className="bg-foreground text-background px-4 py-2 rounded-md">Sign up</button>
      </a>
    </div>
  );
}
