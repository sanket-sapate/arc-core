import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import { Header } from "~/components/shared/Header";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col bg-slate-50">
            <Header />
            <main className="flex-1 flex items-center justify-center p-8 container mx-auto">
                <div className="max-w-md w-full text-center space-y-6">
                    <div className="flex justify-center">
                        <div className="p-4 bg-slate-100 rounded-full">
                            <FileQuestion className="w-16 h-16 text-slate-400" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">404</h1>
                        <h2 className="text-2xl font-semibold tracking-tight text-slate-700">Page not found</h2>
                        <p className="text-slate-500">
                            Sorry, we couldn't find the page you're looking for. It might have been moved or deleted.
                        </p>
                    </div>

                    <div className="pt-4">
                        <Button asChild className="w-full sm:w-auto">
                            <Link to="/">Return to Dashboard</Link>
                        </Button>
                    </div>
                </div>
            </main>
        </div>
    );
}
