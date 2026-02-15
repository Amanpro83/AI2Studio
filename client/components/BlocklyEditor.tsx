import React, { useEffect, useMemo, useRef, useState } from "react";
import * as Blockly from "blockly/core";
import "blockly/msg/en";
// NOTE: Do not statically import built-in block definitions before ensuring Blockly.Msg entries.
// We'll dynamically import block definitions after we set safe fallbacks to avoid 'args0/message0' errors.
import { registerAI2Blocks } from "@/lib/blockly/ai2Blocks";
import { generateJavaFromWorkspace } from "@/lib/blockly/javaGenerator";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw, Save, Upload, Book } from "lucide-react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetTrigger
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea"; // Assuming exists or use standard textarea

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
      } catch (e2) { }
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
  } catch (e) { }

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

  // Logic / Math / Loops Category Names (Critical Fix)
  ensure("LOGIC_HUE", "210");
  ensure("LOOPS_HUE", "120");
  ensure("MATH_HUE", "230");
  ensure("TEXTS_HUE", "160");
  ensure("LISTS_HUE", "260");
  ensure("COLOUR_HUE", "20");
  ensure("VARIABLES_HUE", "330");
  ensure("VARIABLES_DYNAMIC_HUE", "310");
  ensure("PROCEDURES_HUE", "290");

  // Explicitly overwrite Category names if they are BKY tokens
  // These are often used by the toolbox XML if it refers to %{BKY_...}
  ensure("CAT_LOGIC", "Logic");
  ensure("CAT_LOOPS", "Loops");
  ensure("CAT_MATH", "Math");
  ensure("CAT_TEXT", "Text");
  ensure("CAT_LISTS", "Lists");
  ensure("CAT_COLOUR", "Color");
  ensure("CAT_VARIABLES", "Variables");
  ensure("CAT_PROCEDURES", "Functions");

  // Common blocks that might have missing titles
  ensure("MATH_ADDITION_SYMBOL", "+");
  ensure("MATH_SUBTRACTION_SYMBOL", "-");
  ensure("MATH_DIVISION_SYMBOL", "÷");
  ensure("MATH_MULTIPLICATION_SYMBOL", "×");
  ensure("MATH_POWER_SYMBOL", "^");
  ensure("MATH_TRIG_SIN", "sin");
  ensure("MATH_TRIG_COS", "cos");
  ensure("MATH_TRIG_TAN", "tan");
  ensure("MATH_TRIG_ASIN", "asin");
  ensure("MATH_TRIG_ACOS", "acos");
  ensure("MATH_TRIG_ATAN", "atan");
  ensure("MATH_ARITHMETIC_TOOLTIP_ADD", "Return the sum of the two numbers.");
  ensure("MATH_ARITHMETIC_HELPURL", "https://en.wikipedia.org/wiki/Arithmetic");
  ensure("LOGIC_OPERATION_TOOLTIP_AND", "Return true if both inputs are true.");
  ensure("LOGIC_OPERATION_AND", "and");
  ensure("LOGIC_OPERATION_OR", "or");
  ensure("LOGIC_COMPARE_TOOLTIP_EQ", "Return true if both inputs equal each other.");
  ensure("LOGIC_COMPARE_HELPURL", "https://en.wikipedia.org/wiki/Inequality_(mathematics)");
  ensure("LOGIC_BOOLEAN_TRUE", "true");
  ensure("LOGIC_BOOLEAN_FALSE", "false");
  ensure("LOGIC_NULL", "null");

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
      } catch (e) { }
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
    <block type="controls_try_catch"></block>
    <block type="logic_compare"></block>
    <block type="logic_operation"></block>
    <block type="logic_negate"></block>
    <block type="logic_boolean"></block>
    <block type="logic_null"></block>
    <block type="logic_ternary"></block>
  </category>
  <sep></sep>
  <category id="cat_loops" name="Loops" colour="#0EA5E9">
    <block type="controls_repeat"></block>
    <block type="controls_for"></block>
    <block type="controls_whileUntil"></block>
    <block type="controls_forEach"></block>
  </category>
  <sep></sep>
  <category id="cat_device" name="Device" colour="120">
    <block type="toast_show"></block>
    <block type="android_log"></block>
    <block type="clipboard_copy"></block>
    <block type="android_clipboard_get"></block>
    <block type="android_clipboard_set"></block>
    <block type="device_info"></block>
    <block type="device_battery_level"></block>
    <block type="vibrator_vibrate"></block>
    <block type="android_share_text"></block>
    <block type="device_get_language"></block>
    <block type="device_is_dark_mode"></block>
    <block type="prefs_store"></block>
    <block type="prefs_get"></block>
  </category>
  <sep></sep>
  <category id="cat_web" name="Web" colour="40">
    <block type="network_get"></block>
    <block type="network_post"></block>
    <block type="android_open_url"></block>
    <block type="device_is_online"></block>
    <block type="web_url_encode"></block>
    <block type="web_url_decode"></block>
    <block type="web_html_decode"></block>
    <block type="base64_encode"></block>
    <block type="base64_decode"></block>
  </category>
  <sep></sep>
  <category id="cat_files" name="Files" colour="200">
    <block type="file_write"></block>
    <block type="file_read"></block>
    <block type="file_exists"></block>
    <block type="file_delete"></block>
    <block type="file_list"></block>
  </category>
  <sep></sep>
  <category id="cat_crypto" name="Crypto" colour="0">
    <block type="crypto_hash"></block>
  </category>
  <sep></sep>
  <category id="cat_map" name="Map" colour="290">
    <block type="maps_create_with"></block>
    <block type="map_put"></block>
    <block type="map_get"></block>
    <block type="map_remove"></block>
    <block type="map_is_empty"></block>
    <block type="map_keys"></block>
    <block type="map_values"></block>
    <block type="map_contains_key"></block>
    <block type="map_size"></block>
    <block type="json_parse"></block>
    <block type="json_get"></block>
  </category>
  <sep></sep>
  <category id="cat_math" name="Math+" colour="230">
    <block type="math_number"></block>
    <block type="math_arithmetic"></block>
    <block type="math_parse_int"></block>
    <block type="math_parse_float"></block>
    <block type="math_random_int"></block>
    <block type="math_random_float"></block>
    <block type="math_min_max"></block>
    <block type="math_constrain"></block>
    <block type="math_is_number"></block>
    <block type="math_single"></block>
    <block type="math_trig"></block>
    <block type="math_trig_simple"></block>
    <block type="math_modulo"></block>
  </category>
  <sep></sep>
  <category id="cat_text" name="Text" colour="#10B981">
    <block type="text"></block>
    <block type="text_join"></block>
    <block type="text_join_list"></block>
    <block type="text_length"></block>
    <block type="text_isEmpty"></block>
    <block type="text_indexOf"></block>
    <block type="text_charAt"></block>
    <block type="text_getSubstring"></block>
    <block type="text_changeCase"></block>
    <block type="text_count"></block>
    <block type="text_replace_all"></block>
    <block type="text_replace_regex"></block>
    <block type="text_split"></block>
    <block type="text_contains"></block>
    <block type="text_startswith"></block>
    <block type="text_endswith"></block>
    <block type="text_trim"></block>
    <block type="text_reverse"></block>
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
    <block type="lists_sort"></block>
    <block type="lists_reverse"></block>
    <block type="lists_shuffle"></block>
    <block type="lists_pick_random"></block>
    <block type="lists_copy"></block>
  </category>
  <sep></sep>
  <category id="cat_maps" name="Maps / JSON" colour="#EF4444">
    <block type="maps_create_with"></block>
    <block type="map_put"></block>
    <block type="map_get"></block>
    <block type="map_keys"></block>
    <block type="map_values"></block>
    <block type="map_contains_key"></block>
    <block type="map_remove"></block>
    <block type="map_size"></block>
    <block type="json_parse"></block>
    <block type="json_get"></block>
  </category>
  <sep></sep>
  <category id="cat_network" name="Network" colour="#06B6D4">
    <block type="http_get"></block>
    <block type="network_get"></block>
    <block type="network_post"></block>
    <block type="device_is_online"></block>
    <block type="android_open_url"></block>
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
    <block type="file_exists"></block>
    <block type="file_delete"></block>
    <block type="file_list"></block>
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
  <category id="cat_date" name="Date & Time" colour="#EC407A">
    <block type="date_now_millis"></block>
    <block type="date_format"></block>
    <block type="date_parse"></block>
  </category>
  <sep></sep>
  <category id="cat_device" name="Device & Info" colour="#78909C">
    <block type="device_info"></block>
    <block type="device_battery_level"></block>
    <block type="vibrator_vibrate"></block>
    <block type="device_vibrate"></block>
  </category>
  <sep></sep>
  <category id="cat_crypto" name="Crypto" colour="#AB47BC">
    <block type="crypto_hash"></block>
  </category>
  <sep></sep>
  <category id="cat_android" name="Android" colour="#4CAF50">
    <block type="toast_show"></block>
    <block type="android_toast"></block>
    <block type="android_log"></block>
    <block type="clipboard_copy"></block>
    <block type="android_clipboard_get"></block>
    <block type="android_clipboard_set"></block>
    <block type="android_share_text"></block>
    <block type="prefs_store"></block>
    <block type="prefs_get"></block>
  </category>
  <sep></sep>
  <category id="cat_variables" name="Variables" colour="#FFA500" custom="VARIABLE" expanded="true"></category>
  <sep></sep>
  <category id="cat_functions" name="Functions" colour="#9C27B0" custom="PROCEDURE"></category>
  <sep></sep>
  <category id="cat_advanced" name="Advanced" colour="#607D8B">
    <block type="ai2_custom_code"></block>
    <block type="ai2_custom_expression"></block>
    <block type="native_call"></block>
    <block type="native_field_get"></block>
    <block type="native_field_set"></block>
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
                } catch (e2) { }
              }
            }
          }
        } catch (e) { }
        return;
      }
      console.error("Global error:", ev.error || ev.message);
    } catch (e) { }
  });
  window.addEventListener("unhandledrejection", (ev: any) => {
    try {
      console.error("Unhandled rejection:", ev.reason);
    } catch (e) { }
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

  // AI Preview State
  const [isAiSheetOpen, setIsAiSheetOpen] = useState(false);
  const [aiCodePreview, setAiCodePreview] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Enhancement Workspace State
  const [isEnhanceOpen, setIsEnhanceOpen] = useState(false);
  const [enhancedCode, setEnhancedCode] = useState("");
  const [isEnhancing, setIsEnhancing] = useState(false);

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

        // Define a custom Dark Theme to match the app's aesthetic
        const DarkTheme = Blockly.Theme.defineTheme('dark', {
          name: 'dark',
          base: Blockly.Themes.Classic,
          componentStyles: {
            workspaceBackgroundColour: '#1e1e20',
            toolboxBackgroundColour: '#27272a',
            toolboxForegroundColour: '#fff',
            flyoutBackgroundColour: '#27272a',
            flyoutForegroundColour: '#ccc',
            flyoutOpacity: 1,
            scrollbarColour: '#555',
            markerColour: '#fff',
            cursorColour: '#fff',
          },
          fontStyle: {
            family: 'Inter, sans-serif',
            weight: 'bold',
            size: 10
          },
          startHats: true,
        });

        const updateTheme = () => {
          const isDark = document.documentElement.classList.contains("dark");
          if (workspaceRef.current) {
            workspaceRef.current.setTheme(isDark ? DarkTheme : Blockly.Themes.Classic);
          }
        };

        // Watch for class changes on html element
        const observer = new MutationObserver(updateTheme);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

        // Initial theme set
        updateTheme();

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

        return () => {
          observer.disconnect();
          if (createdWorkspace) createdWorkspace.dispose();
          workspaceRef.current = null;
          globalBlocklyWorkspace.current = null;
        };
      } catch (e: any) {
        console.error("Error initializing Blockly workspace:", e);
        setError(String(e?.message || e));
      }
    })();
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

  // Responsive Layout State
  const [isVertical, setIsVertical] = useState(false);

  // Theme State
  const [isDark, setIsDark] = useState(true);

  // Help Dialog State
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  useEffect(() => {
    const checkSize = () => setIsVertical(window.innerWidth < 1024);
    checkSize();
    window.addEventListener("resize", checkSize);

    // Initial Theme Check
    if (document.documentElement.classList.contains("dark")) setIsDark(true);
    else setIsDark(false);

    return () => window.removeEventListener("resize", checkSize);
  }, []);

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    if (newDark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  };

  return (
    <div className="h-[calc(100vh-2rem)] w-full bg-gray-50 dark:bg-zinc-950 transition-colors duration-300 text-zinc-900 dark:text-zinc-100 font-sans border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden shadow-2xl flex flex-col">
      {/* Top Bar */}
      <div className="h-14 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between px-4 shrink-0 transition-colors duration-300">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-indigo-500/20">AI2</div>
            <div className="flex flex-col">
              <span className="font-bold tracking-tight text-zinc-800 dark:text-zinc-100 leading-none">Extension Builder</span>
              <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">v3.2 Light/Dark</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Docs Button */}
          <Button size="icon" variant="ghost" className="rounded-full h-9 w-9 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white" onClick={() => window.open('/docs', '_blank')} title="Open Documentation">
            <Book className="w-5 h-5" />
          </Button>

          {/* Help Button */}
          <Button size="icon" variant="ghost" className="rounded-full h-9 w-9 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white" onClick={() => setIsHelpOpen(true)}>
            <span className="text-lg font-serif italic">i</span>
          </Button>

          {/* Theme Toggle */}
          <Button size="icon" variant="ghost" className="rounded-full h-9 w-9 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-all" onClick={toggleTheme}>
            {isDark ? "🌙" : "☀️"}
          </Button>

          <div className="h-6 w-[1px] bg-zinc-200 dark:bg-zinc-800 mx-2"></div>

          <Button size="sm" variant="ghost" className="h-9 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white hidden sm:flex" onClick={() => workspaceRef.current?.cleanUp()}>
            <RefreshCw className="w-4 h-4 mr-2" /> Clean
          </Button>
          <Button size="sm" variant="ghost" className="h-9 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white" onClick={exportWorkspace}>
            <Save className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">Save XML</span>
          </Button>
          <Button size="sm" className="h-9 bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-500 shadow-md shadow-indigo-500/10 px-4" onClick={async () => {
            try {
              const res = await fetch("/api/build", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ javaCode: code, jarFiles: [] })
              });
              if (!res.ok) throw new Error(await res.text());
              const blob = await res.blob();
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "extension.aix";
              a.click();
            } catch (e: any) { alert("Build Result: " + e.message); }
          }}>
            Build .aix
          </Button>
        </div>
      </div>

      <ResizablePanelGroup direction={isVertical ? "vertical" : "horizontal"} className="flex-1 bg-gray-100 dark:bg-black">

        {/* PANE 1: BLOCKLY (MAIN) */}
        <ResizablePanel order={1} defaultSize={isVertical ? 50 : 50} minSize={30} className="bg-white dark:bg-[#1e1e20] relative flex flex-col border-r border-zinc-200 dark:border-zinc-800 shadow-sm z-10">
          <div className="absolute top-2 left-2 z-10 pointer-events-none">
            <span className="px-2 py-1 bg-white/90 dark:bg-zinc-800/80 backdrop-blur text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 rounded border border-zinc-200 dark:border-zinc-700 shadow-sm">BLOCKS</span>
          </div>
          <div className="flex-1 w-full h-full" ref={blocklyDiv} />
        </ResizablePanel>

        <ResizableHandle withHandle className="bg-zinc-200 dark:bg-zinc-800 w-1.5 transition-colors hover:bg-indigo-400 dark:hover:bg-indigo-600 data-[panel-group-direction=vertical]:h-1.5 data-[panel-group-direction=vertical]:w-full" />

        {/* PANE 2: JAVA SOURCE */}
        <ResizablePanel order={2} defaultSize={isVertical ? 25 : 25} minSize={15} className={`bg-white dark:bg-[#0f0f11] flex flex-col ${isVertical ? 'border-b' : 'border-r'} border-zinc-200 dark:border-zinc-800 transition-colors duration-300`}>
          <div className="h-10 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-3 bg-gray-50 dark:bg-zinc-900/50 shrink-0">
            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Java Preview</span>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded" onClick={downloadJava}>
              <Download className="w-3.5 h-3.5" />
            </Button>
          </div>
          <div className="flex-1 overflow-auto relative group bg-white dark:bg-[#0f0f11]">
            <pre className="p-4 text-xs font-mono text-blue-700 dark:text-blue-200 leading-5 whitespace-pre-wrap transition-colors">
              {code}
            </pre>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle className="bg-zinc-200 dark:bg-zinc-800 w-1.5 transition-colors hover:bg-indigo-400 dark:hover:bg-indigo-600 data-[panel-group-direction=vertical]:h-1.5 data-[panel-group-direction=vertical]:w-full" />

        {/* PANE 3: AI ASSISTANT (PERMANENT) */}
        <ResizablePanel order={3} defaultSize={isVertical ? 25 : 25} minSize={10} className="bg-gray-50 dark:bg-zinc-900 flex flex-col transition-colors duration-300">
          <div className="h-10 border-b border-zinc-200 dark:border-zinc-800 flex items-center px-4 gap-2 bg-white dark:bg-zinc-900 shrink-0">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-200">AI ASSISTANT</span>
            <span className="ml-auto text-[10px] text-zinc-400 dark:text-zinc-500 hidden sm:inline">Gemini 2.5</span>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-zinc-900">
            {/* Chat Output Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">

              {/* AI OUTPUT TEXT AREA */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">AI Generated Block Code</label>
                <textarea
                  className="w-full h-32 sm:h-64 bg-gray-50 dark:bg-black/40 border border-zinc-200 dark:border-zinc-700 rounded-md p-3 text-xs font-mono text-green-700 dark:text-green-300 focus:border-green-500 focus:outline-none resize-none transition-colors shadow-inner"
                  value={aiCodePreview}
                  onChange={(e) => setAiCodePreview(e.target.value)}
                  placeholder="// AI output will appear here..."
                />
                <Button size="sm" className="w-full bg-green-600 hover:bg-green-500 text-white h-8 text-xs font-semibold shadow-sm" disabled={!aiCodePreview} onClick={() => {
                  const ws = workspaceRef.current;
                  if (ws && aiCodePreview) {
                    const block = ws.newBlock('ai2_custom_expression');
                    block.setFieldValue(aiCodePreview, 'CODE');
                    block.initSvg(); block.render(); block.moveBy(50, 50);
                    alert("Block inserted!");
                  }
                }}>
                  Insert as Block
                </Button>
              </div>
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 shrink-0">
              <div className="relative">
                <textarea
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg p-3 pr-10 text-xs text-zinc-800 dark:text-zinc-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 focus:outline-none resize-none h-16 sm:h-24 shadow-sm transition-colors"
                  placeholder="Type instruction (e.g., 'Make a math block')..."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      setIsGenerating(true);
                      try {
                        const res = await fetch("/api/ai-generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: aiPrompt }) });
                        const d = await res.json();
                        setAiCodePreview(d.code || d.error);
                      } catch (e: any) { setAiCodePreview("Error: " + e.message); }
                      setIsGenerating(false);
                    }
                  }}
                />
                <Button size="icon" className="absolute bottom-3 right-3 h-7 w-7 bg-indigo-600 hover:bg-indigo-500 text-white shadow-md rounded-md" onClick={async () => {
                  setIsGenerating(true);
                  try {
                    const res = await fetch("/api/ai-generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: aiPrompt }) });
                    const d = await res.json();
                    setAiCodePreview(d.code || d.error);
                  } catch (e: any) { setAiCodePreview("Error: " + e.message); }
                  setIsGenerating(false);
                }}>
                  ➤
                </Button>
              </div>
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      {error && (
        <div className="absolute top-16 right-4 z-50 bg-red-500 text-white text-xs px-4 py-2 rounded shadow-xl border border-red-600 animate-in fade-in slide-in-from-top-2">
          {error} <button className="ml-2 font-bold hover:text-red-100" onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* HELP DIALOG */}
      <Dialog open={isHelpOpen} onOpenChange={setIsHelpOpen}>
        <DialogContent className="max-w-[800px] h-[80vh] flex flex-col bg-zinc-950 border border-zinc-800 text-zinc-100 overflow-hidden">
          <DialogHeader className="border-b border-zinc-800 pb-4">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <span className="text-2xl">📚</span> Help & Documentation
            </DialogTitle>
            <DialogDescription>Everything you need to know to build AI2 Extensions.</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            <section>
              <h3 className="text-lg font-bold text-indigo-400 mb-2">1. Getting Started</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Welcome to the **Visual Extension Builder**. Use the blocks on the left to create your extension logic.
                For a complete reference of all available blocks, including Device, Web, and Map utilities, check the full documentation.
              </p>
              <div className="mt-4">
                <Button className="bg-indigo-600 hover:bg-indigo-500 text-white w-full sm:w-auto" onClick={() => window.open('/docs', '_blank')}>
                  📖 View Full Documentation
                </Button>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-bold text-emerald-400 mb-2">2. AI Assistant (Gemini)</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                The **AI Assistant** panel on the right allows you to generate code using natural language.
                <br />
                - **Generate**: Type "Create a method to reverse a string" and press Enter. The AI will output code.
                <br />
                - **Insert**: Click "Insert as Block" to add the generated code as a "Custom Code" block to your workspace.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-bold text-purple-400 mb-2">3. Building .aix</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                When you are ready, click the **Build .aix** button in the top bar.
                The server will compile your Java code and download the `.aix` file, which you can import directly into MIT App Inventor.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-bold text-zinc-300 mb-2">4. Shortcuts</h3>
              <ul className="list-disc pl-5 text-sm text-zinc-500 space-y-1">
                <li>**Ctrl + S**: Export Workspace XML</li>
                <li>**Ctrl + Enter**: Trigger AI Generation (in prompt box)</li>
              </ul>
            </section>
          </div>
          <DialogFooter className="border-t border-zinc-800 pt-4">
            <Button onClick={() => setIsHelpOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
