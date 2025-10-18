import { useEffect, useState } from "react";
import BlocklyEditor from "@/components/BlocklyEditor";
import { Button } from "@/components/ui/button";
import { Wand2 } from "lucide-react";

export default function Index() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 text-white">
        <div className="absolute inset-0 opacity-30 [background:radial-gradient(1000px_600px_at_100%_0%,rgba(255,255,255,.12),rgba(255,255,255,0)),radial-gradient(800px_400px_at_0%_100%,rgba(255,255,255,.1),rgba(255,255,255,0))]"></div>
        <div className="relative px-6 py-12 sm:px-10 sm:py-16 lg:px-16">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium ring-1 ring-inset ring-white/20 backdrop-blur">
              <Wand2 className="h-3.5 w-3.5" /> Visual AI2 Extension Builder
            </div>
            <h1 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
              Build MIT App Inventor extensions from Blockly blocks
            </h1>
            <p className="mt-4 text-white/80 text-sm sm:text-base max-w-2xl">
              Design properties, methods, and events using a visual editor.
              Generate production-ready Java code for MIT App Inventor (AI2)
              extensions instantly.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <a href="#editor">
                <Button
                  size="lg"
                  className="bg-white text-zinc-900 hover:bg-white/90"
                >
                  Start Building
                </Button>
              </a>
              <a
                href="https://ai2.appinventor.mit.edu/reference/components/extensions.html"
                target="_blank"
                rel="noreferrer"
              >
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-transparent text-white border-white/40 hover:bg-white/10"
                >
                  AI2 Extension Guide
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="editor" className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Editor</h2>
        {ready && <BlocklyEditor />}
      </section>
    </div>
  );
}
