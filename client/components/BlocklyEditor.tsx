import React, { useEffect, useMemo, useRef, useState } from "react";
import * as Blockly from "blockly/core";
import "blockly/msg/en";
// NOTE: Do not statically import built-in block definitions before ensuring Blockly.Msg entries.
// We'll dynamically import block definitions after we set safe fallbacks to avoid 'args0/message0' errors.
import { registerAI2Blocks } from "@/lib/blockly/ai2Blocks";
import { generateJavaFromWorkspace } from "@/lib/blockly/javaGenerator";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw, Save, Upload } from "lucide-react";

// Module-level global workspace reference used by error handlers
let globalBlocklyWorkspace: { current: Blockly.WorkspaceSvg | null } = {
  current: null,
};

// Ensure critical Blockly.Msg entries include required %n tokens
function ensureBlocklyMessages() {
  const Msg = (Blockly as any).Msg || (window as any).Blockly?.Msg;
  if (!Msg) return;

  const ensure = (key: string, val: string) => {
    try {
      if (
        Msg[key] === undefined ||
        Msg[key] === null ||
        String(Msg[key]).trim() === ""
      ) {
        Msg[key] = val;
      }
    } catch (e) {
      try {
        Msg[key] = val;
      } catch (e2) {}
    }
  };

  // Only set keys that are missing. Avoid overwriting existing translations to prevent token duplication.
  ensure("LOGIC_NEGATE_TITLE", "not %1");
  ensure("CONTROLS_REPEAT_TITLE", "repeat %1 times");
  ensure("CONTROLS_REPEAT_INPUT_DO", "do %1");
  ensure("MATH_RANDOM_INT_TITLE", "random integer from %1 to %2");
  ensure("MATH_CHANGE_TITLE", "change %1 by %2");
  ensure("MATH_CHANGE_TOOLTIP", "Change the variable by a value");
  ensure(
    "MATH_CHANGE_HELPURL",
    "https://developers.google.com/blockly/guides/blocks/variables",
  );
  ensure("TEXT_LENGTH_TITLE", "length of %1");
  ensure("TEXT_JOIN_TITLE_CREATEWITH", "create text with %1");
  ensure("LISTS_CREATE_WITH_ITEM_TITLE", "%1");
  ensure("CONTROLS_FOR_TITLE", "count with %1 from %2 to %3 by %4");

  // Procedures / functions messages
  ensure("PROCEDURES_DEFNORETURN_TITLE", "to %1");
  ensure("PROCEDURES_DEFNORETURN_PROCEDURE", "procedure");
  ensure("PROCEDURES_DEFNORETURN_DO", "do");
  ensure("PROCEDURES_DEFRETURN_TITLE", "to %1");
  ensure("PROCEDURES_IFRETURN_TITLE", "if %1 then return");
  ensure("PROCEDURES_CALLNORETURN_TITLE", "call %1");
  ensure("PROCEDURES_CALLRETURN_TITLE", "call %1");

  // Variable messages
  ensure("VARIABLES_SET", "set %1 to %2");
  ensure("VARIABLES_GET", "%1");
  ensure("VARIABLES_DEFAULT_NAME", "item");
  // Common context-menu and workspace message fallbacks
  ensure("DUPLICATE_BLOCK", "Duplicate");
  ensure("DELETE_BLOCK", "Delete");
  ensure("DELETE_X_BLOCKS", "Delete %1 blocks");
  ensure("DELETE_ALL_BLOCKS", "Delete all %1 blocks?");
  ensure("CLEAN_UP", "Clean up Blocks");
  ensure("CLEAN_UP_TITLE", "Clean up Blocks");
  ensure("ADD_COMMENT", "Add comment");
  ensure("REMOVE_COMMENT", "Remove comment");
  ensure("ENABLE_BLOCK", "Enable block");
  ensure("DISABLE_BLOCK", "Disable block");
  ensure("EXPAND_ALL", "Expand all");
  ensure("COLLAPSE_ALL", "Collapse all");
  ensure("DELETE_VARIABLE", "Delete variable");
  ensure(
    "DELETE_VARIABLE_CONFIRMATION",
    "Delete %1 uses of the variable '%2'?",
  );
  ensure("RENAME_VARIABLE", "Rename variable");
  ensure("RENAME_VARIABLE_TITLE", "Rename variable '%1' to:");
  ensure("NEW_VARIABLE", "New variable");
  ensure("NEW_VARIABLE_TITLE", "New variable name:");
  ensure("WORKSPACE_COMMENT_DEFAULT_TEXT", "Enter comment...");
  ensure("UNDO", "Undo");
  ensure("REDO", "Redo");
  ensure("CLICK_TO_CONFIGURE", "Click to configure");

  // Force-correct specific message keys that commonly cause token errors
  const forceFix: Record<string, string> = {
    LISTS_LENGTH_TITLE: "length of %1",
    LISTS_LENGTH_INPUT: "length of %1",
    TEXT_IS_EMPTY_TITLE: "is %1 empty?",
    TEXT_IS_EMPTY_INPUT: "is %1 empty?",
    TEXT_ISEMPTY_TITLE: "is %1 empty?",
    TEXT_ISEMPTY_INPUT: "is %1 empty?",
    CONTROLS_REPEAT_TITLE: "repeat %1 times",
    CONTROLS_REPEAT_INPUT_DO: "do %1",
    MATH_RANDOM_INT_TITLE: "random integer from %1 to %2",
    LISTS_CREATE_WITH_INPUT_WITH: "create list with %1",
    CONTROLS_FOREACH_TITLE: "for each %1 in %2",
    CONTROLS_FOREACH_INPUT_DO: "do %1",
  };
  try {
    for (const k of Object.keys(forceFix)) {
      try {
        (Msg as any)[k] = forceFix[k];
      } catch (e) {
        // ignore
      }
    }
  } catch (e) {}

  // Text indexOf block expects three tokens: the search, the text, and the operator (first/last)
  ensure("TEXT_INDEXOF_TITLE", "index of %1 in %2 %3");
  ensure("TEXT_INDEXOF_INPUT", "index of %1 in %2 %3");
  ensure("TEXT_INDEXOF_OPERATOR_FIRST", "first");
  ensure("TEXT_INDEXOF_OPERATOR_LAST", "last");
  ensure(
    "TEXT_INDEXOF_TOOLTIP",
    "Returns the index of the first/last occurrence of the search string in the text. Returns -1 if not found.",
  );
  ensure(
    "TEXT_INDEXOF_HELPURL",
    "https://developers.google.com/blockly/examples/text",
  );

  // lists isEmpty
  ensure("LISTS_ISEMPTY_TITLE", "is %1 empty?");
  ensure("LISTS_ISEMPTY_INPUT", "is %1 empty?");
  ensure("LISTS_ISEMPTY_TOOLTIP", "Returns true if the list is empty.");

  // text charAt and related messages (ensure placeholders present)
  ensure("TEXT_CHARAT_TITLE", "char at %1 of %2");
  ensure("TEXT_CHARAT_INPUT", "char at %1 of %2");
  ensure("TEXT_CHARAT_FROM_START_TITLE", "char # %1 of %2");
  ensure("TEXT_CHARAT_FROM_END_TITLE", "char # from end %1 of %2");
  ensure("TEXT_CHARAT_FIRST", "first");
  ensure("TEXT_CHARAT_LAST", "last");
  ensure(
    "TEXT_CHARAT_TOOLTIP",
    "Returns the character at the specified position.",
  );

  // math modulo
  ensure("MATH_MODULO_TITLE", "remainder of %1 ÷ %2");
  ensure("MATH_MODULO_DIVIDEND", "dividend");
  ensure("MATH_MODULO_DIVISOR", "divisor");
  ensure(
    "MATH_MODULO_HELPURL",
    "https://developers.google.com/blockly/examples/math",
  );

  // controls forEach
  ensure("CONTROLS_FOREACH_TITLE", "for each %1 in %2");
  ensure("CONTROLS_FOREACH_INPUT_DO", "do %1");
  ensure("CONTROLS_FOREACH_TOOLTIP", "Iterate over each item in a list");

  // CATEGORY and label fallbacks when Msg values reference %{BKY_...} tokens
  const categoryFallbacks: Record<string, string> = {
    CATEGORY_LOGIC: "Logic",
    CATEGORY_LOOPS: "Loops",
    CATEGORY_MATH: "Math",
    CATEGORY_TEXT: "Text",
    CATEGORY_LISTS: "Lists",
    CATEGORY_VARIABLES: "Variables",
    CATEGORY_PROCEDURES: "Functions",
    CATEGORY_AI2: "AI2 Extension",
  };

  // Replace any Msg entries pointing to BKY tokens with fallback human text
  try {
    for (const k of Object.keys(Msg)) {
      const v = String(Msg[k] || "");
      if (v.startsWith("%{BKY_") || v.startsWith("%{bky_")) {
        const inside = v.replace(/^%\{(BKY_|bky_)?/, "").replace(/\}$/, "");
        if (categoryFallbacks[inside]) Msg[k] = categoryFallbacks[inside];
        else {
          const human = inside
            .replace(/^BKY_/, "")
            .replace(/_/g, " ")
            .toLowerCase();
          Msg[k] = human.charAt(0).toUpperCase() + human.slice(1);
        }
      }
    }

    // Coerce non-string entries to strings to avoid runtime .replace errors in Blockly internals
    // IMPORTANT: do NOT overwrite undefined/null entries — leaving them undefined allows Blockly to use defaults
    for (const k of Object.keys(Msg)) {
      try {
        if (
          Msg[k] !== undefined &&
          Msg[k] !== null &&
          typeof Msg[k] !== "string"
        ) {
          Msg[k] = String(Msg[k]);
        }
      } catch (e) {
        try {
          if (Msg[k] !== undefined && Msg[k] !== null) Msg[k] = String(Msg[k]);
        } catch (e2) {
          /* ignore */
        }
      }
    }

    // Finally, set readable fallbacks for any remaining undefined or empty entries
    for (const k of Object.keys(Msg)) {
      try {
        const v = Msg[k];
        if (v === undefined || v === null || String(v).trim() === "") {
          let human = k
            .replace(/^BKY_/, "")
            .replace(/^MSG_/, "")
            .replace(/_/g, " ")
            .toLowerCase();
          human = human.charAt(0).toUpperCase() + human.slice(1);
          Msg[k] = human;
        }
      } catch (e) {}
    }
  } catch (e) {
    // ignore
  }
}

// call now to ensure messages exist
ensureBlocklyMessages();
// register AI2 blocks synchronously (will run after built-in blocks are imported inside the workspace setup)
// registerAI2Blocks();  // moved to useEffect to ensure core blocks are available first

const toolboxXml = `
<xml xmlns="https://developers.google.com/blockly/xml" style="display: none">
  <category id="cat_ai2" name="AI2 Extension" colour="#7C3AED" expanded="true">
    <block type="ai2_extension"></block>
    <block type="ai2_property"></block>
    <block type="ai2_method"></block>
    <block type="ai2_event"></block>
    <block type="ai2_set"></block>
    <block type="ai2_return"></block>
    <block type="ai2_dispatch"></block>
  </category>
  <sep></sep>
  <category id="cat_logic" name="Logic" colour="#5C6BC0">
    <block type="controls_if"></block>
    <block type="logic_compare"></block>
    <block type="logic_operation"></block>
    <block type="logic_negate"></block>
    <block type="logic_boolean"></block>
    <block type="logic_null"></block>
  </category>
  <sep></sep>
  <category id="cat_loops" name="Loops" colour="#0EA5E9">
    <block type="controls_repeat"></block>
    <block type="controls_for"></block>
    <block type="controls_whileUntil"></block>
    <block type="controls_forEach"></block>
  </category>
  <sep></sep>
  <category id="cat_math" name="Math" colour="#F59E0B">
    <block type="math_number"></block>
    <block type="math_arithmetic"></block>
    <block type="math_random_int"></block>
    <block type="math_single"></block>
    <block type="math_trig"></block>
    <block type="math_trig_simple"></block>
    <block type="math_modulo"></block>
  </category>
  <sep></sep>
  <category id="cat_text" name="Text" colour="#10B981">
    <block type="text"></block>
    <block type="text_join"></block>
    <block type="text_length"></block>
    <block type="text_isEmpty"></block>
    <block type="text_indexOf"></block>
    <block type="text_charAt"></block>
    <block type="text_getSubstring"></block>
    <block type="text_changeCase"></block>
    <block type="text_contains"></block>
    <block type="text_startswith"></block>
    <block type="text_endswith"></block>
  </category>
  <sep></sep>
  <category id="cat_lists" name="Lists" colour="#8B5CF6">
    <block type="lists_create_with"></block>
    <block type="lists_getIndex"></block>
    <block type="lists_setIndex"></block>
    <block type="lists_length"></block>
    <block type="lists_isEmpty"></block>
    <block type="lists_append"></block>
    <block type="lists_remove_at"></block>
    <block type="lists_index_of"></block>
  </category>
  <sep></sep>
  <category id="cat_maps" name="Maps / JSON" colour="#EF4444">
    <block type="maps_create_with"></block>
    <block type="map_put"></block>
    <block type="map_get"></block>
    <block type="json_parse"></block>
    <block type="json_get"></block>
  </category>
  <sep></sep>
  <category id="cat_network" name="Network" colour="#06B6D4">
    <block type="http_get"></block>
  </category>
  <sep></sep>
  <category id="cat_async" name="Concurrency / Timers" colour="#7C3AED">
    <block type="thread_run"></block>
    <block type="timer_delay"></block>
  </category>
  <sep></sep>
  <category id="cat_files" name="Files & Encoding" colour="#64748B">
    <block type="file_write"></block>
    <block type="file_read"></block>
    <block type="base64_encode"></block>
    <block type="base64_decode"></block>
  </category>
  <sep></sep>
  <category id="cat_colour" name="Color" colour="#FF6B6B">
    <block type="colour_picker"></block>
    <block type="colour_random"></block>
    <block type="colour_rgb"></block>
  </category>
  <sep></sep>
  <category id="cat_variables" name="Variables" colour="#FFA500" custom="VARIABLE" expanded="true"></category>
  <sep></sep>
  <category id="cat_functions" name="Functions" colour="#9C27B0" custom="PROCEDURE"></category>
  <sep></sep>
  <category id="cat_misc" name="Other" colour="#9E9E9E">
    <block type="text_print"></block>
    <block type="controls_flow_statements"></block>
  </category>
</xml>`;

// Add global error listeners for runtime debugging
if (typeof window !== "undefined") {
  let flyoutErrorRecoveries = 0;
  window.addEventListener("error", (ev: any) => {
    try {
      const msg = ev?.error?.message || ev?.message || "";
      if (
        msg &&
        msg.includes("Block not present in workspace's list of top-most blocks")
      ) {
        try {
          const ws = globalBlocklyWorkspace.current;
          if (ws) {
            const flyout = (ws as any).getFlyout && (ws as any).getFlyout();
            if (flyout && flyout.hide) flyout.hide();
            if (flyoutErrorRecoveries < 3) {
              flyoutErrorRecoveries++;
              try {
                const freshDom = Blockly.utils.xml.textToDom(toolboxXml);
                ws.updateToolbox && ws.updateToolbox(freshDom);
              } catch (e) {
                try {
                  ws.updateToolbox && ws.updateToolbox(toolboxXml as any);
                } catch (e2) {}
              }
            }
          }
        } catch (e) {}
        return;
      }
      console.error("Global error:", ev.error || ev.message);
    } catch (e) {}
  });
  window.addEventListener("unhandledrejection", (ev: any) => {
    try {
      console.error("Unhandled rejection:", ev.reason);
    } catch (e) {}
  });
}

const STORAGE_KEY = "ai2-blockly-workspace";

export default function BlocklyEditor() {
  const blocklyDiv = useRef<HTMLDivElement | null>(null);
  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);
  const [code, setCode] = useState<string>(
    "// Your Java code will appear here\n",
  );

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!blocklyDiv.current) return;

    let createdWorkspace: Blockly.WorkspaceSvg | null = null;

    (async () => {
      try {
        // refresh messages and load core blocks before creating workspace
        ensureBlocklyMessages();
        try {
          await import("blockly/blocks");
        } catch (e) {
          console.warn("blockly/blocks import failed", e);
        }
        try {
          registerAI2Blocks();
        } catch (e) {
          console.warn("registerAI2Blocks failed", e);
        }

        // Monkeypatch BlockSvg.jsonInit to auto-populate missing messageN when argsN exist
        try {
          const proto =
            (Blockly as any).BlockSvg && (Blockly as any).BlockSvg.prototype;
          if (proto && !proto.__patched_fillMessages) {
            const origJsonInit = proto.jsonInit;
            proto.jsonInit = function (json: any) {
              try {
                for (let idx = 0; idx < 10; idx++) {
                  const argsKey = `args${idx}`;
                  const msgKey = `message${idx}`;
                  const args = json[argsKey];
                  if (
                    args &&
                    (!json[msgKey] || String(json[msgKey]).trim() === "")
                  ) {
                    const n = Array.isArray(args)
                      ? args.length
                      : Object.keys(args).length;
                    // create placeholders %1..%n; join with space
                    const parts: string[] = [];
                    for (let j = 0; j < n; j++) parts.push(`%${j + 1}`);
                    json[msgKey] = parts.join(" ");
                  }

                  // If there is an existing message, validate it against args and sanitise duplicates/out-of-range
                  if (args && json[msgKey]) {
                    try {
                      const msg = String(json[msgKey]);
                      const matches = Array.from(
                        msg.matchAll(/%([0-9]+)/g),
                      ).map((m) => Number(m[1]));
                      if (matches.length > 0) {
                        const maxArgIndex = Math.max(...matches);
                        const n = Array.isArray(args)
                          ? args.length
                          : Object.keys(args).length;
                        const unique = new Set(matches);
                        // if any index out of range or duplicates present, replace with safe placeholder sequence
                        if (maxArgIndex > n || unique.size !== matches.length) {
                          const parts: string[] = [];
                          for (let j = 0; j < n; j++) parts.push(`%${j + 1}`);
                          json[msgKey] = parts.join(" ");
                        }
                      }
                    } catch (e) {
                      // ignore per-block sanitise failures
                    }
                  }
                }
              } catch (e) {
                // ignore
              }
              return origJsonInit.call(this, json);
            };
            proto.__patched_fillMessages = true;
          }
        } catch (e) {
          console.warn("Failed to patch BlockSvg.jsonInit", e);
        }

        const workspace = Blockly.inject(blocklyDiv.current as HTMLDivElement, {
          toolbox: toolboxXml,
          trashcan: true,
          grid: { spacing: 20, length: 3, colour: "#eee", snap: true },
          zoom: { controls: true, wheel: true },
          renderer: "zelos",
          theme: Blockly.Themes.Classic,
        });

        // ensure toolbox rendered with current blocks — create a fresh DOM for update to avoid reuse issues
        try {
          if (workspace.updateToolbox) {
            const freshDom = Blockly.utils.xml.textToDom(toolboxXml);
            workspace.updateToolbox(freshDom);
          }
        } catch (e) {
          try {
            // fallback to passing string
            workspace.updateToolbox &&
              workspace.updateToolbox(toolboxXml as any);
          } catch (err) {
            console.warn("updateToolbox failed", err);
          }
        }

        workspaceRef.current = workspace;
        globalBlocklyWorkspace.current = workspace;
        createdWorkspace = workspace;

        // Load from local storage or initialize with a starter block
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          try {
            const xml = Blockly.utils.xml.textToDom(saved);
            Blockly.Xml.domToWorkspace(xml, workspace);
          } catch (e) {
            console.warn(
              "Failed to parse saved workspace, creating a fresh one.",
              e,
            );
            const xmlText = `
      <xml xmlns="https://developers.google.com/blockly/xml">
        <block type="ai2_extension" deletable="false" x="40" y="40">
          <statement name="PROPERTIES"></statement>
          <statement name="METHODS"></statement>
          <statement name="EVENTS"></statement>
        </block>
      </xml>`;
            const xml = Blockly.utils.xml.textToDom(xmlText);
            Blockly.Xml.domToWorkspace(xml, workspace);
          }
        } else {
          const xmlText = `
      <xml xmlns="https://developers.google.com/blockly/xml">
        <block type="ai2_extension" deletable="false" x="40" y="40">
          <statement name="PROPERTIES"></statement>
          <statement name="METHODS"></statement>
          <statement name="EVENTS"></statement>
        </block>
      </xml>`;
          const xml = Blockly.utils.xml.textToDom(xmlText);
          Blockly.Xml.domToWorkspace(xml, workspace);
        }

        const onChange = () => {
          try {
            const java = generateJavaFromWorkspace(workspace);
            setCode(java);
            const xml = Blockly.Xml.workspaceToDom(workspace);
            const text = Blockly.Xml.domToText(xml);
            localStorage.setItem(STORAGE_KEY, text);
          } catch (e: any) {
            console.error("Error generating java:", e);
            setError(String(e?.message || e));
          }
        };

        workspace.addChangeListener(onChange);
        onChange();
      } catch (e: any) {
        console.error("Error initializing Blockly workspace:", e);
        setError(String(e?.message || e));
      }
    })();

    return () => {
      try {
        if (createdWorkspace) createdWorkspace.dispose();
      } catch (e) {
        console.warn("Error disposing workspace", e);
      }
      workspaceRef.current = null;
      globalBlocklyWorkspace.current = null;
    };
  }, []);

  const downloadJava = () => {
    if (!workspaceRef.current) return;
    // Try to get package and classname from workspace
    const blocks = workspaceRef.current.getTopBlocks(true);
    const root = blocks.find((b) => b.type === "ai2_extension");
    let fileName = "Extension.java";
    if (root) {
      const pkg = (root.getFieldValue("PACKAGE") as string) || "com.example";
      const cls = (root.getFieldValue("CLASSNAME") as string) || "MyExtension";
      const pkgPath = pkg.replace(/\./g, "/");
      fileName = `${pkgPath}/${cls}.java`;
    }
    const blob = new Blob([code], { type: "text/x-java-source" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const exportWorkspace = () => {
    const ws = workspaceRef.current;
    if (!ws) return;
    const xml = Blockly.Xml.workspaceToDom(ws);
    const text = Blockly.Xml.domToPrettyText(xml);
    const blob = new Blob([text], { type: "text/xml" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "workspace.xml";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importWorkspace = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result || "");
        const xml = Blockly.utils.xml.textToDom(text);
        if (workspaceRef.current) {
          workspaceRef.current.clear();
          Blockly.Xml.domToWorkspace(xml, workspaceRef.current);
        }
      } catch (e) {
        console.error("Invalid workspace xml", e);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="w-full grid grid-cols-1 xl:grid-cols-2 gap-6">
      {error && (
        <div className="col-span-full p-4 rounded-md bg-destructive/10 border border-destructive text-destructive-foreground">
          <strong className="block">Blockly Error</strong>
          <pre className="whitespace-pre-wrap text-sm mt-2">{error}</pre>
        </div>
      )}

      <div className="flex flex-col rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b bg-gradient-to-r from-primary/10 to-transparent">
          <h2 className="text-sm font-semibold">Blockly Workspace</h2>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const ws = workspaceRef.current;
                if (!ws) return;
                ws.cleanUp();
              }}
            >
              <RefreshCw className="w-4 h-4" /> Cleanup
            </Button>
            <Button size="sm" variant="outline" onClick={exportWorkspace}>
              <Save className="w-4 h-4" /> Export XML
            </Button>
            <label className="inline-flex items-center gap-2 text-sm px-3 py-2 border rounded-md cursor-pointer hover:bg-accent">
              <Upload className="w-4 h-4" /> Import XML
              <input
                type="file"
                accept=".xml"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) importWorkspace(f);
                }}
              />
            </label>
          </div>
        </div>
        <div className="h-[600px] xl:h-[720px]" ref={blocklyDiv} />
      </div>

      <div className="flex flex-col rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b bg-gradient-to-r from-primary/10 to-transparent">
          <h2 className="text-sm font-semibold">
            Generated Java (AI2 Extension)
          </h2>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={downloadJava}>
              <Download className="w-4 h-4" /> Download .java
            </Button>
          </div>
        </div>
        <div className="p-0">
          <pre className="h-[600px] xl:h-[720px] overflow-auto text-sm leading-6 p-4 bg-zinc-950 text-zinc-100">
            <code>{code}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
