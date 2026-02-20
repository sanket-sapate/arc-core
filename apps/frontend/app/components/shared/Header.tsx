import { Button } from "~/components/ui/button";

export const Header = () => {
    return (
        <header className="flex items-center justify-between p-4 border-b">
            <h1 className="text-xl font-bold">ARC App</h1>
            <nav className="flex gap-4">
                <Button variant="ghost">Home</Button>
                <Button variant="ghost">Features</Button>
                <Button>Login</Button>
            </nav>
        </header>
    );
};
