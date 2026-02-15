import { useState, useEffect } from "react";
import BlocklyEditor from "@/components/BlocklyEditor";

export default function Index() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  return (
    <div className="h-screen w-full bg-zinc-950 flex flex-col overflow-hidden">
      {/* Main Editor Area - Full Screen */}
      <main className="flex-1 p-0 sm:p-2 lg:p-4">
        {ready ? <BlocklyEditor /> : <div className="text-white flex items-center justify-center h-full">Loading Editor...</div>}
      </main>
    </div>
  );
}
