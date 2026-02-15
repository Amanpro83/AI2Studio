import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Menu, FileText, Smartphone, Globe, Share2, Database, Calculator, Code2, Folder, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

const categories = [
    {
        id: "started",
        title: "Getting Started",
        icon: <FileText className="w-4 h-4" />,
        intro: "Welcome to the Visual Extension Builder. This tool allows you to create proper App Inventor 2 extensions using blocks. The core concept is simple: Define your extension's Metadata, then add Properties, Methods, and Events.",
        blocks: [
            { name: "Extension", desc: "The main root block. Define your package name (e.g., com.myname.cool), class name, version, and author here. All other checks must go inside Properties, Methods, or Events." },
        ]
    },
    {
        id: "core",
        title: "Extension Core",
        icon: <Code2 className="w-4 h-4" />,
        intro: "These are the building blocks of an App Inventor extension.",
        blocks: [
            { name: "Property", desc: "Define a property that users can read or write in the Designer or Blocks editor. Check 'Read Only' if you only want a Getter." },
            { name: "Method", desc: "Define a function that users can call. Choose a Return Type (void, String, int, etc.) and define parameters (e.g., text:String, num:int)." },
            { name: "Event", desc: "Define an event that triggers in the App Inventor app. Users can drag out a 'When Extension.Event' block." },
            { name: "Dispatch Event", desc: "Trigger an Event you defined. Use this inside a Method or a background task." },
            { name: "Return", desc: "Return a value from a Method. Crucial for methods that are not 'void'." },
            { name: "Set Property", desc: "Update an internal property or variable." }
        ]
    },
    {
        id: "device",
        title: "Device & System",
        icon: <Smartphone className="w-4 h-4" />,
        intro: "Interact with the Android device hardware and system settings.",
        blocks: [
            { name: "device_is_dark_mode", desc: "Returns true if the user's phone is currently in Dark Mode. Great for auto-theming." },
            { name: "device_language", desc: "Returns the 2-letter language code (e.g. 'en', 'es') of the device." },
            { name: "device_info", desc: "Get Model, SDK Level, Brand, Manufacturer, etc." },
            { name: "device_battery_level", desc: "Get the current battery percentage (0-100)." },
            { name: "toast_show", desc: "Show a short 'Toast' message popup at the bottom of the screen." },
            { name: "vibrator_vibrate", desc: "Vibrate the phone for N milliseconds." },
            { name: "clipboard_copy", desc: "Copy text to the system clipboard." },
            { name: "clipboard_get", desc: "Get text from the system clipboard." },
            { name: "share_text", desc: "Open the system 'Share' dialog to share text with other apps." },
            { name: "prefs_store", desc: "Save a value permanently to SharedPreferences." },
            { name: "prefs_get", desc: "Retrieve a saved value from SharedPreferences." }
        ]
    },
    {
        id: "web",
        title: "Web & Network",
        icon: <Globe className="w-4 h-4" />,
        intro: "Connect to the internet, handle URLs, and parsing.",
        blocks: [
            { name: "network_get", desc: "Perform an HTTP GET request to a URL. Runs in background." },
            { name: "network_post", desc: "Perform an HTTP POST request with a body." },
            { name: "open_url", desc: "Open a URL in the user's default browser." },
            { name: "web_url_encode", desc: "Safe URL encoding for query parameters (e.g. space -> %20)." },
            { name: "web_url_decode", desc: "Decode URL-encoded strings." },
            { name: "web_html_decode", desc: "Convert HTML entities (&amp;) back to normal text (&)." },
            { name: "device_is_online", desc: "Check if the device currently has an active internet connection." }
        ]
    },
    {
        id: "map",
        title: "Maps & JSON",
        icon: <Database className="w-4 h-4" />,
        intro: "Work with Dictionaries (Key-Value pairs) and JSON data.",
        blocks: [
            { name: "create map", desc: "Create a new empty HashMap." },
            { name: "put", desc: "Add or update a value for a specific key in a Map." },
            { name: "get", desc: "Retrieve a value by key. Returns null if not found." },
            { name: "remove", desc: "Remove a key and its value from the Map." },
            { name: "is empty?", desc: "Check if the map has no entries." },
            { name: "size", desc: "Get the number of items in the map." },
            { name: "keys", desc: "Get a list of all keys in the map." },
            { name: "values", desc: "Get a list of all values in the map." },
            { name: "contains key?", desc: "Check if a key exists in the map." },
            { name: "json_parse", desc: "Parse a JSON string into a Map (for objects) or List (for arrays)." },
            { name: "json_get", desc: "Quickly extract a value from a complex JSON string without full parsing." }
        ]
    },
    {
        id: "math",
        title: "Math & Logic",
        icon: <Calculator className="w-4 h-4" />,
        intro: "Advanced mathematical operations and logical checks.",
        blocks: [
            { name: "parse int", desc: "Safely convert text to an integer. Returns a default value on error." },
            { name: "parse float", desc: "Safely convert text to a decimal number. Returns a default value on error." },
            { name: "is number?", desc: "Check if a string represents a valid number." },
            { name: "random int", desc: "Generate a random integer between two values." },
            { name: "random float", desc: "Generate a random decimal between 0.0 and 1.0." },
            { name: "min / max", desc: "Return the smaller or larger of two numbers." },
            { name: "constrain", desc: "Force a number to be within a specific range." },
            { name: "trig (sin/cos/tan)", desc: "Perform trigonometric calculations." }
        ]
    },
    {
        id: "text",
        title: "Text & Lists",
        icon: <Share2 className="w-4 h-4" />,
        intro: "Manipulate strings and manage lists of data.",
        blocks: [
            { name: "split text", desc: "Split a text string into a list using a separator." },
            { name: "join list", desc: "Combine a list of strings into one text with a separator." },
            { name: "replace all", desc: "Replace all occurrences of a text segment." },
            { name: "replace regex", desc: "Advanced replacement using Regular Expressions." },
            { name: "contains / starts / ends", desc: "Check text content." },
            { name: "sort list", desc: "Sort a list alphabetically or numerically." },
            { name: "reverse list", desc: "Reverse the order of a list." },
            { name: "shuffle list", desc: "Randomly shuffle the items in a list." },
            { name: "pick random", desc: "Get a random item from a list." },
            { name: "copy list", desc: "Duplicate a list." }
        ]
    },
    {
        id: "files",
        title: "File System",
        icon: <Folder className="w-4 h-4" />,
        intro: "Read and write files in the app's internal storage.",
        blocks: [
            { name: "write file", desc: "Write text content to a file. Overwrites existing content." },
            { name: "read file", desc: "Read the entire content of a file as a string." },
            { name: "file exists", desc: "Check if a file exists at the given path." },
            { name: "delete file", desc: "Delete a file permanently." },
            { name: "list files", desc: "Get a list of all files in a directory." }
        ]
    },
    {
        id: "crypto",
        title: "Cryptography",
        icon: <Lock className="w-4 h-4" />,
        blocks: [
            { name: "hash", desc: "Generate MD5, SHA-1, or SHA-256 hashes of text." },
            { name: "base64 encode", desc: "Convert text to Base64 format." },
            { name: "base64 decode", desc: "Decode Base64 text back to a normal string." }
        ]
    }
];

export default function Docs() {
    const [activeTab, setActiveTab] = useState("started");
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="h-screen w-full bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-indigo-500/30">
            {/* Header */}
            <header className="h-14 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur flex items-center justify-between px-4 shrink-0 z-30 sticky top-0">
                <div className="flex items-center gap-3">
                    <Link to="/">
                        <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white hover:bg-zinc-800">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div className="flex flex-col">
                        <span className="font-bold text-lg leading-tight">Documentation</span>
                        <span className="text-[10px] text-zinc-500 font-mono">v3.2 Reference</span>
                    </div>
                </div>
                <Button variant="ghost" size="icon" className="md:hidden text-zinc-400" onClick={() => setSidebarOpen(!sidebarOpen)}>
                    <Menu className="w-5 h-5" />
                </Button>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar */}
                <aside className={`
            fixed md:relative inset-y-0 left-0 z-20 w-72 bg-zinc-900 border-r border-zinc-800 
            transform transition-transform duration-200 ease-in-out md:translate-x-0
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            flex flex-col py-6
        `}>
                    <div className="px-6 mb-6">
                        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Categories</h3>
                    </div>
                    <nav className="flex-1 overflow-y-auto space-y-1 px-3">
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => { setActiveTab(cat.id); setSidebarOpen(false); }}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                    ${activeTab === cat.id
                                        ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-sm'
                                        : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 border border-transparent'
                                    }`}
                            >
                                <span className={activeTab === cat.id ? "text-indigo-400" : "text-zinc-500 group-hover:text-zinc-300"}>
                                    {cat.icon}
                                </span>
                                {cat.title}
                            </button>
                        ))}
                    </nav>
                </aside>

                {/* Backdrop for mobile sidebar */}
                {sidebarOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-10 md:hidden" onClick={() => setSidebarOpen(false)} />}

                {/* Content */}
                <main className="flex-1 overflow-y-auto bg-zinc-950 scroll-smooth">
                    <div className="max-w-4xl mx-auto p-6 md:p-12 space-y-16 pb-32">

                        {categories.map(cat => (
                            <section
                                key={cat.id}
                                id={cat.id}
                                className={`${activeTab === cat.id ? 'block' : 'hidden'} animate-in fade-in slide-in-from-bottom-4 duration-300`}
                            >
                                <header className="mb-10 pb-6 border-b border-zinc-800">
                                    <div className="flex items-center gap-3 mb-2 text-indigo-500">
                                        {cat.icon}
                                        <span className="text-sm font-bold uppercase tracking-widest">Reference</span>
                                    </div>
                                    <h2 className="text-4xl font-bold text-zinc-100 mb-4">{cat.title}</h2>
                                    {cat.intro && <p className="text-lg text-zinc-400 max-w-2xl">{cat.intro}</p>}
                                </header>

                                <div className="grid gap-6">
                                    {cat.blocks.map((block, i) => (
                                        <div key={i} className="group bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl p-5 transition-all duration-200">
                                            <div className="flex flex-col sm:flex-row sm:items-baseline gap-3 mb-2">
                                                <code className="px-2.5 py-1 bg-zinc-950 rounded-md text-emerald-400 font-mono text-sm border border-zinc-800 group-hover:border-emerald-500/30 transition-colors shadow-sm">
                                                    {block.name}
                                                </code>
                                            </div>
                                            <p className="text-zinc-400 text-sm leading-relaxed max-w-3xl">
                                                {block.desc}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        ))}

                        <div className="mt-20 p-8 rounded-2xl bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border border-indigo-500/20 text-center">
                            <h4 className="text-indigo-300 font-bold mb-2">Need more blocks?</h4>
                            <p className="text-zinc-400 text-sm mb-4">You can always create your own custom functions using the Java Source editor or ask the AI Assistant to implement complex logic for you.</p>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
