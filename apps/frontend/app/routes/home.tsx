import { Header } from "~/components/shared/Header";
import { useStore } from "~/store/useStore";
import { Button } from "~/components/ui/button";
import { useHealthCheck } from "~/hooks/use-health-check";


export default function Home() {
  const { count, increment } = useStore();
  const { data: health, isLoading } = useHealthCheck();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 p-8 container mx-auto">
        <div className="max-w-2xl mx-auto space-y-8">
          <section className="space-y-4">
            <h2 className="text-3xl font-bold tracking-tight">Welcome to ARC Frontend</h2>
            <p className="text-muted-foreground">
              This is a React Router v7 application using Tailwind CSS, shadcn/ui, Zustand, and TanStack Query.
            </p>
          </section>

          <section className="p-6 border rounded-lg space-y-4">
            <h3 className="text-xl font-semibold">State Management (Zustand)</h3>
            <div className="flex items-center gap-4">
              <span className="text-2xl font-mono">{count}</span>
              <Button onClick={increment}>Increment Count</Button>
            </div>
          </section>

          <section className="p-6 border rounded-lg space-y-4">
            <h3 className="text-xl font-semibold">Data Fetching (TanStack Query)</h3>
            <div>
              {isLoading ? (
                <p>Checking API health...</p>
              ) : (
                <pre className="bg-muted p-4 rounded text-sm overflow-auto">
                  {JSON.stringify(health || { status: "API not connected (mock)" }, null, 2)}
                </pre>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
