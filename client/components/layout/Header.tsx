import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Blocks, Github } from "lucide-react";

export default function Header() {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur",
      )}
    >
      <div className="container flex h-14 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-violet-500 to-indigo-600 text-white">
            <Blocks className="h-5 w-5" />
          </span>
          <span className="text-sm font-bold tracking-tight">
            AI2 Extension Studio
          </span>
        </Link>
        <nav className="flex items-center gap-2">
          <a
            href="https://appinventor.mit.edu/extensions"
            target="_blank"
            rel="noreferrer"
          >
            <Button variant="ghost" size="sm">
              AI2 Docs
            </Button>
          </a>
          <a
            href="https://github.com/mit-cml/appinventor-sources"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:inline-flex"
          >
            <Button variant="ghost" size="sm">
              <Github className="w-4 h-4 mr-1" />
              Sources
            </Button>
          </a>
        </nav>
      </div>
    </header>
  );
}
