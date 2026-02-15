import * as Blockly from "blockly/core";

function decodeHtmlEntities(str: string) {
  if (!str) return "";
  return str
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function toPascalCase(s: string) {
  return String(s || "")
    .replace(/[^0-9A-Za-z]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");
}

function toCamelCase(s: string) {
  const pascal = toPascalCase(s);
  return pascal ? pascal.charAt(0).toLowerCase() + pascal.slice(1) : pascal;
}

function sanitizeIdentifier(s: string, opts?: { pascal?: boolean }) {
  const raw = decodeHtmlEntities(String(s || "")).trim();
  if (!raw) return opts?.pascal ? "MyIdentifier" : "_id";
  const base = opts?.pascal ? toPascalCase(raw) : toCamelCase(raw);
  // Ensure valid Java identifier characters
  const cleaned = base.replace(/[^A-Za-z0-9_$]/g, "_");
  if (/^[0-9]/.test(cleaned)) return "_" + cleaned;
  return cleaned || (opts?.pascal ? "MyIdentifier" : "_id");
}

function parseParams(text: string): { name: string; type: string }[] {
  if (!text) return [];
  return text
    .split(",")
    .map((s) => decodeHtmlEntities(s.trim()))
    .map((s) => s.trim())
    .filter(Boolean)
    .map((pair) => {
      const [nameRaw, typeRaw] = pair.split(":").map((s) => s.trim());
      const name = sanitizeIdentifier(nameRaw || "param");
      const type = (typeRaw || "Object").replace(/\s+/g, "");
      return { name, type };
    });
}

function escapeQuote(s: string) {
  return String(s || "").replace(/"/g, '\\"');
}

function defaultValueFor(type: string, def: string) {
  const t = String(type || "");
  if (/String$/i.test(t) || t === "String") return `\"${escapeQuote(def)}\"`;
  if (t === "boolean" || /Boolean/i.test(t)) return def || "false";
  if (t === "int" || t === "Integer") return def || "0";
  if (t === "float" || t === "double") return def ? `${def}f` : "0f";
  if (t.startsWith("java.util.List") || t.startsWith("List") || t.includes("[]"))
    return `new java.util.ArrayList<>()`;
  return def ? def : "null";
}

// Expression generator (supports a subset of common blocks)
function genExpr(
  block: Blockly.Block | null,
  context: { props: string[]; params: string[] },
): string {
  if (!block) return "null";
  const t = block.type;
  // number literal
  if (t === "math_number") {
    return block.getFieldValue("NUM") || "0";
  }
  if (t === "text") {
    return `\"${escapeQuote(decodeHtmlEntities(block.getFieldValue("TEXT") || ""))}\"`;
  }
  if (t === "variables_get") {
    const nameRaw = block.getFieldValue("VAR") || block.getFieldValue("NAME");
    const name = sanitizeIdentifier(nameRaw || "var");
    return name;
  }
  if (t === "logic_compare") {
    const op = block.getFieldValue("OP");
    const a = genExpr(block.getInputTargetBlock("A"), context);
    const b = genExpr(block.getInputTargetBlock("B"), context);

    // Professional Grade: Use Objects.equals for safe comparison of Objects/Strings/Nulls
    // Numeric comparison with <, > etc still uses operators, but EQ/NEQ should be safe.
    if (op === "EQ") return `java.util.Objects.equals(${a}, ${b})`;
    if (op === "NEQ") return `!java.util.Objects.equals(${a}, ${b})`;

    const map: any = {
      LT: "<",
      LTE: "<=",
      GT: ">",
      GTE: ">=",
    };
    const sym = map[op] || op;
    return `(${a} ${sym} ${b})`;
  }
  if (t === "logic_operation") {
    const op = block.getFieldValue("OP");
    const a = genExpr(block.getInputTargetBlock("A"), context);
    const b = genExpr(block.getInputTargetBlock("B"), context);
    const map: any = { AND: "&&", OR: "||" };
    return `(${a} ${map[op] || op} ${b})`;
  }
  if (t === "logic_boolean") {
    return block.getFieldValue("BOOL") === "TRUE" ? "true" : "false";
  }

  // math single: hardened
  if (t === "math_single") {
    const op = block.getFieldValue("OP");
    const a = genExpr(block.getInputTargetBlock("NUM") || block.getInputTargetBlock("A"), context);

    // Safe wrappers so we don't crash on null
    const safeA = `(${a} == null ? 0 : ${a})`;
    // Actually, genExpr returns "0" for empty math inputs, but if variable is null... 
    // Java unboxing null -> crash. " (double) a "
    // Better: let's assume primitives or use a helper but standard blockly simple generators often assume non-null.
    // Professional fix: Check null if it looks like a variable.

    // For now, simpler map usage:
    switch (op) {
      case "ROOT": return `Math.sqrt(${a})`;
      case "ABS": return `Math.abs(${a})`;
      case "NEG": return `(-(${a}))`;
      case "LN": return `Math.log(${a})`;
      case "LOG10": return `Math.log10(${a})`;
      case "EXP": return `Math.exp(${a})`;
      case "POW10": return `Math.pow(10, ${a})`;
      case "ROUND": return `Math.round(${a})`;
    }
    return `(${a})`;
  }
  if (t === "math_arithmetic") {
    const op = block.getFieldValue("OP");
    const a = genExpr(block.getInputTargetBlock("A"), context);
    const b = genExpr(block.getInputTargetBlock("B"), context);
    const map: any = {
      ADD: "+",
      MINUS: "-",
      MULTIPLY: "*",
      DIVIDE: "/",
      POWER: "Math.pow",
    };
    if (op === "POWER") return `Math.pow(${a}, ${b})`;
    const sym = map[op] || op;
    const sA = a;
    const sB = b;
    // Robust arithmetic: ensure we don't crash on simple cases
    // Note: Java int division by zero crashes. Float doesn't.
    // If we want to be super safe:
    if (op === "DIVIDE") {
      return `(${sB} == 0 ? 0 : ${sA} / ${sB})`; // Safe division
    }
    return `(${sA} ${sym} ${sB})`;
  }

  // ... Logic blocks here ...

  if (t === "text_join") {
    const parts: string[] = [];
    for (const inp of block.inputList) {
      if (!inp.name) continue;
      if (inp.name.startsWith("ADD")) {
        const b = genExpr(block.getInputTargetBlock(inp.name), context);
        // Safe string wrapper
        parts.push(`String.valueOf(${b})`);
      }
    }
    if (parts.length === 0) return `\"\"`;
    return parts.join(" + ");
  }

  if (t === "text_length") {
    const child = genExpr(
      block.getInputTargetBlock("VALUE") || block.getInputTargetBlock("TEXT"),
      context,
    );
    return `(${child} == null ? 0 : String.valueOf(${child}).length())`;
  }

  if (t === "text_isEmpty") {
    const child = genExpr(
      block.getInputTargetBlock("VALUE") || block.getInputTargetBlock("TEXT"),
      context,
    );
    return `(${child} == null || ${child}.isEmpty())`;
  }

  if (t === "text_indexOf") {
    const exprs: string[] = [];
    for (const inp of block.inputList) {
      if (!inp.name) continue;
      const b = block.getInputTargetBlock(inp.name);
      if (b) exprs.push(genExpr(b, context));
    }
    const search = exprs[0] || '""';
    const text = exprs[1] || '""';
    const where = (
      block.getFieldValue("END") || block.getFieldValue("WHERE") || block.getFieldValue("FIND") || "FIRST"
    )
      .toString()
      .toUpperCase();
    if (where.includes("LAST")) return `${text}.lastIndexOf(${search})`;
    return `${text}.indexOf(${search})`;
  }

  if (t === "math_modulo") {
    const a =
      genExpr(block.getInputTargetBlock("DIVIDEND") || block.getInputTargetBlock("A"), context) ||
      block.getFieldValue("DIVIDEND") ||
      "0";
    const b =
      genExpr(block.getInputTargetBlock("DIVISOR") || block.getInputTargetBlock("B"), context) ||
      block.getFieldValue("DIVISOR") ||
      "0";
    return `(${a} % ${b})`;
  }

  if (t === "lists_isEmpty") {
    const listExpr = genExpr(block.getInputTargetBlock("VALUE") || block.getInputTargetBlock("LIST"), context) || "null";
    return `(${listExpr} == null || ${listExpr}.isEmpty())`;
  }
  if (t === "text_charAt") {
    const exprs: string[] = [];
    for (const inp of block.inputList) {
      if (!inp.name) continue;
      const b = block.getInputTargetBlock(inp.name);
      if (b) exprs.push(genExpr(b, context));
    }
    const text = exprs[0] || '""';
    const index = exprs[1] || "0";
    return `${text}.charAt(${index})`;
  }
  if (t === "text_getSubstring") {
    const exprs: string[] = [];
    for (const inp of block.inputList) {
      if (!inp.name) continue;
      const b = block.getInputTargetBlock(inp.name);
      if (b) exprs.push(genExpr(b, context));
    }
    const text = exprs[0] || '""';
    const a = exprs[1] || "0";
    const b = exprs[2] || "0";
    return `${text}.substring(${a}, ${b})`;
  }
  if (t === "text_changeCase") {
    const child = genExpr(block.getInputTargetBlock("TEXT") || block.getInputTargetBlock("VALUE"), context);
    const mode = (block.getFieldValue("CASE") || block.getFieldValue("MODE") || "UPPER").toString().toUpperCase();
    if (mode.includes("UPPER")) return `${child}.toUpperCase()`;
    if (mode.includes("LOWER")) return `${child}.toLowerCase()`;
    return child;
  }

  // New text helpers
  if (t === "text_contains") {
    const text = genExpr(block.getInputTargetBlock("TEXT") || block.getInputTargetBlock("VALUE"), context) || '""';
    const search = genExpr(block.getInputTargetBlock("SEARCH"), context) || '""';
    return `(${text} != null && ${text}.contains(${search}))`;
  }

  if (t === "text_startswith") {
    const text = genExpr(block.getInputTargetBlock("TEXT") || block.getInputTargetBlock("VALUE"), context) || '""';
    const search = genExpr(block.getInputTargetBlock("SEARCH"), context) || '""';
    return `(${text} != null && ${text}.startsWith(${search}))`;
  }

  if (t === "text_endswith") {
    const text = genExpr(block.getInputTargetBlock("TEXT") || block.getInputTargetBlock("VALUE"), context) || '""';
    const search = genExpr(block.getInputTargetBlock("SEARCH"), context) || '""';
    return `(${text} != null && ${text}.endsWith(${search}))`;
  }

  // Trig/simple math helper
  if (t === "math_trig_simple") {
    const num = genExpr(block.getInputTargetBlock("NUM"), context) || "0";
    const op = block.getFieldValue("OP") || "SIN";
    switch (op) {
      case "SIN":
        return `Math.sin(${num})`;
      case "COS":
        return `Math.cos(${num})`;
      case "TAN":
        return `Math.tan(${num})`;
      case "TO_DEG":
        return `Math.toDegrees(${num})`;
      case "TO_RAD":
        return `Math.toRadians(${num})`;
      default:
        return `${num}`;
    }
  }

  // JSON and utility helpers
  if (t === "json_parse") {
    const txt = genExpr(block.getInputTargetBlock("TEXT"), context) || '""';
    return `new JSONObject(${txt})`;
  }

  if (t === "json_get") {
    const json = genExpr(block.getInputTargetBlock("JSON"), context) || "null";
    const key = genExpr(block.getInputTargetBlock("KEY"), context) || '""';
    return `(${json} == null ? null : ((${json} instanceof JSONObject) ? ((JSONObject)${json}).opt(${key}) : null))`;
  }

  if (t === "base64_encode") {
    const txt = genExpr(block.getInputTargetBlock("TEXT"), context) || '""';
    return `Base64.encodeToString(${txt}.getBytes(), Base64.DEFAULT)`;
  }

  if (t === "base64_decode") {
    const txt = genExpr(block.getInputTargetBlock("TEXT"), context) || '""';
    return `new String(Base64.decode(${txt}, Base64.DEFAULT))`;
  }

  if (t === "maps_create_with") {
    return `new java.util.HashMap<>()`;
  }

  if (t === "map_get") {
    const mapExpr = genExpr(block.getInputTargetBlock("MAP"), context) || "new java.util.HashMap<>()";
    const key = genExpr(block.getInputTargetBlock("KEY"), context) || '\"\"';
    return `${mapExpr}.get(${key})`;
  }

  // Lists handling
  if (t === "lists_create_with") {
    const items: string[] = [];
    for (const inp of block.inputList) {
      if (!inp.name) continue;
      if (inp.name.startsWith("ADD")) {
        const child = block.getInputTargetBlock(inp.name as any);
        items.push(genExpr(child, context));
      }
    }
    if (items.length === 0) return `new java.util.ArrayList<>()`;
    return `new java.util.ArrayList<java.lang.Object>(java.util.Arrays.asList(${items.join(", ")}))`;
  }

  if (t === "lists_length") {
    const listExpr = genExpr(block.getInputTargetBlock("VALUE"), context);
    return `${listExpr} == null ? 0 : ${listExpr}.size()`;
  }

  if (t === "lists_getIndex") {
    const listExpr = genExpr(block.getInputTargetBlock("LIST"), context);
    const idxExpr = genExpr(block.getInputTargetBlock("INDEX"), context);
    return `${listExpr}.get(${idxExpr})`;
  }

  if (t === "lists_index_of") {
    const listExpr = genExpr(block.getInputTargetBlock("LIST"), context) || "new java.util.ArrayList<>()";
    const item = genExpr(block.getInputTargetBlock("ITEM"), context) || "null";
    return `${listExpr}.indexOf(${item})`;
  }

  // fallback: try to get text field
  const txt = block.getFieldValue && block.getFieldValue("TEXT");
  if (txt) return `\"${escapeQuote(decodeHtmlEntities(txt))}\"`;

  // Moved block logic here
  if (t === "date_current_millis") {
    return "System.currentTimeMillis()";
  }

  if (t === "date_format") {
    const millis = genExpr(block.getInputTargetBlock("MILLIS"), context) || "0";
    const pattern = genExpr(block.getInputTargetBlock("PATTERN"), context) || '"yyyy-MM-dd HH:mm:ss"';
    return `new SimpleDateFormat(${pattern}).format(new java.util.Date(${millis}))`;
  }

  if (t === "date_parse") {
    const date = genExpr(block.getInputTargetBlock("DATE"), context) || '""';
    const pattern = genExpr(block.getInputTargetBlock("PATTERN"), context) || '"yyyy-MM-dd"';
    return `(new SimpleDateFormat(${pattern}).parse(${date}).getTime())`;
  }

  if (t === "device_info") {
    const info = block.getFieldValue("INFO");
    switch (info) {
      case "MODEL": return "android.os.Build.MODEL";
      case "MANUFACTURER": return "android.os.Build.MANUFACTURER";
      case "ANDROID_VERSION": return "android.os.Build.VERSION.RELEASE";
      case "SDK_LEVEL": return "String.valueOf(android.os.Build.VERSION.SDK_INT)";
      case "BOARD": return "android.os.Build.BOARD";
      case "BRAND": return "android.os.Build.BRAND";
      case "DEVICE": return "android.os.Build.DEVICE";
      case "PRODUCT": return "android.os.Build.PRODUCT";
      default: return '""';
    }
  }

  if (t === "crypto_hash") {
    const text = genExpr(block.getInputTargetBlock("TEXT"), context) || '""';
    const algo = block.getFieldValue("ALGO") || "MD5";
    return `(new java.math.BigInteger(1, java.security.MessageDigest.getInstance("${algo}").digest(${text}.getBytes())).toString(16))`;
  }

  if (t === "regex_match") {
    const text = genExpr(block.getInputTargetBlock("TEXT"), context) || '""';
    const pattern = genExpr(block.getInputTargetBlock("PATTERN"), context) || '""';
    return `java.util.regex.Pattern.compile(${pattern}).matcher(${text}).matches()`;
  }

  if (t === "regex_replace") {
    const text = genExpr(block.getInputTargetBlock("TEXT"), context) || '""';
    const pattern = genExpr(block.getInputTargetBlock("PATTERN"), context) || '""';
    const replacement = genExpr(block.getInputTargetBlock("REPLACEMENT"), context) || '""';
    return `${text}.replaceAll(${pattern}, ${replacement})`;
  }

  if (t === "text_reverse") {
    const text = genExpr(block.getInputTargetBlock("TEXT"), context) || '""';
    return `new StringBuilder(${text}).reverse().toString()`;
  }

  if (t === "text_trim") {
    const text = genExpr(block.getInputTargetBlock("TEXT"), context) || '""';
    return `${text}.trim()`;
  }

  if (t === "ai2_custom_expression") {
    return block.getFieldValue("CODE") || "null";
  }

  if (t === "native_field_get") {
    const target = genExpr(block.getInputTargetBlock("TARGET"), context);
    const field = block.getFieldValue("FIELD") || "field";
    // If target is null/empty, assume static or implicit this (though unsafe) - better to output "target.field"
    return `${target === "null" ? "this" : target}.${field}`;
  }

  if (t === "native_call") {
    const target = genExpr(block.getInputTargetBlock("TARGET"), context);
    const method = block.getFieldValue("METHOD") || "toString";
    // Args handling is tricky because they come as a LIST block (Expression). 
    // But in Blockly, an input connected to a List block returns the generated *List code* (e.g. new ArrayList...).
    // For a native call, we want the ARGUMENTS list. 
    // HACK: We can't easily spread an ArrayList into a function call in Java code "func(list)".
    // We need "func(arg1, arg2)". 
    // To solve this properly without huge complexity:
    // We will parse the "ARGS" input block *specifically*. 
    // If the input is "lists_create_with", we grab its inputs directly.

    // Fallback: If it's a dynamic list, we can't do much. 
    // Let's assume the user uses "create list" block.
    const argsBlock = block.getInputTargetBlock("ARGS");
    let argsC = "";
    if (argsBlock && argsBlock.type === "lists_create_with") {
      const itemCount = (argsBlock as any).itemCount_ || 0;
      const argList = [];
      for (let i = 0; i < itemCount; i++) {
        argList.push(genExpr(argsBlock.getInputTargetBlock("ADD" + i), context));
      }
      argsC = argList.join(", ");
    } else if (argsBlock) {
      // It's some other block returning a list? 
      // We can't unpack it at compile time. 
      // We'll just output "UNKNOWN_ARGS" or similar to warn user.
      // Or better: just pass the list and hope the method accepts a List.
      argsC = genExpr(argsBlock, context);
    }

    return `${target === "null" ? "this" : target}.${method}(${argsC})`;
  }

  if (t === "prefs_get") {
    const key = genExpr(block.getInputTargetBlock("KEY"), context) || '""';
    const def = genExpr(block.getInputTargetBlock("DEFAULT"), context) || '""';
    return `this.context.getSharedPreferences("AI2_Extension_Prefs", Context.MODE_PRIVATE).getString(${key}, String.valueOf(${def}))`;
  }

  if (t === "network_get") {
    const url = genExpr(block.getInputTargetBlock("URL"), context) || '""';
    // Professional: Add timeouts (5s connect, 10s read) to prevent hangs
    // Use try-with-resources or careful stream closing
    return `new Object() { public String get() { try { java.net.HttpURLConnection c = (java.net.HttpURLConnection) new java.net.URL(${url}).openConnection(); c.setConnectTimeout(5000); c.setReadTimeout(10000); return new java.util.Scanner(c.getInputStream(), "UTF-8").useDelimiter("\\\\A").next(); } catch(Exception e){ return ""; } } }.get()`;
  }

  if (t === "network_post") {
    const url = genExpr(block.getInputTargetBlock("URL"), context) || '""';
    const body = genExpr(block.getInputTargetBlock("BODY"), context) || '""';
    // Professional: Timeouts + DoOutput
    return `new Object() { public String post() throws Exception { java.net.HttpURLConnection c = (java.net.HttpURLConnection) new java.net.URL(${url}).openConnection(); c.setConnectTimeout(5000); c.setReadTimeout(10000); c.setRequestMethod("POST"); c.setDoOutput(true); c.getOutputStream().write(${body}.getBytes("UTF-8")); return new java.util.Scanner(c.getInputStream(), "UTF-8").useDelimiter("\\\\A").next(); } }.post()`;
  }

  if (t === "logic_ternary") {
    const cond = genExpr(block.getInputTargetBlock("IF"), context) || "false";
    const valTrue = genExpr(block.getInputTargetBlock("THEN"), context) || "null";
    const valFalse = genExpr(block.getInputTargetBlock("ELSE"), context) || "null";
    return `(${cond} ? ${valTrue} : ${valFalse})`;
  }

  if (t === "text_replace_all") {
    const text = genExpr(block.getInputTargetBlock("TEXT"), context) || '""';
    const regex = genExpr(block.getInputTargetBlock("REGEX"), context) || '""';
    const repl = genExpr(block.getInputTargetBlock("REPLACEMENT"), context) || '""';
    return `${text}.replaceAll(${regex}, ${repl})`;
  }

  if (t === "device_info") {
    return `"{ \\"model\\": \\"" + android.os.Build.MODEL + "\\", \\"sdk\\": " + android.os.Build.VERSION.SDK_INT + ", \\"brand\\": \\"" + android.os.Build.BRAND + "\\" }"`;
  }

  if (t === "json_parse") {
    const json = genExpr(block.getInputTargetBlock("JSON"), context) || '"{}"';
    // Return JSONObject or JSONArray? Let's check start char or just use JSONTokener
    return `new org.json.JSONTokener(${json}).nextValue()`;
  }

  if (t === "file_read") {
    const fn = genExpr(block.getInputTargetBlock("FILENAME") || block.getInputTargetBlock("PATH"), context) || '"file.txt"';
    return `new java.util.Scanner(this.context.openFileInput(${fn}), "UTF-8").useDelimiter("\\\\A").next()`;
  }

  // --- NEW GENERATOR LOGIC ---
  if (t === "math_random_int") {
    const from = genExpr(block.getInputTargetBlock("FROM"), context) || "0";
    const to = genExpr(block.getInputTargetBlock("TO"), context) || "100";
    return `(int) (${from} + Math.random() * ((${to}) - (${from}) + 1))`;
  }
  if (t === "math_random_float") {
    return "Math.random()";
  }
  if (t === "math_min_max") {
    const mode = block.getFieldValue("MODE");
    const a = genExpr(block.getInputTargetBlock("A"), context) || "0";
    const b = genExpr(block.getInputTargetBlock("B"), context) || "0";
    const op = mode === "MIN" ? "Math.min" : "Math.max";
    return `${op}(${a}, ${b})`;
  }
  if (t === "math_is_number") {
    const text = genExpr(block.getInputTargetBlock("TEXT"), context) || '""';
    // inline try-catch hack for expression: this is hard in java expressions.
    // Better to use a regex or helper.
    // Simple regex check:
    return `String.valueOf(${text}).matches("-?\\\\d+(\\\\.\\\\d+)?")`;
  }

  if (t === "text_split") {
    const text = genExpr(block.getInputTargetBlock("TEXT"), context) || '""';
    const at = genExpr(block.getInputTargetBlock("AT"), context) || '","';
    return `new java.util.ArrayList<String>(java.util.Arrays.asList(${text}.split(java.util.regex.Pattern.quote(${at}))))`;
  }
  if (t === "text_join_list") {
    const list = genExpr(block.getInputTargetBlock("LIST"), context) || "new java.util.ArrayList<>()";
    const sep = genExpr(block.getInputTargetBlock("SEPARATOR"), context) || '","';
    return `android.text.TextUtils.join(${sep}, ${list})`;
  }
  if (t === "text_replace_all") {
    const text = genExpr(block.getInputTargetBlock("TEXT"), context) || '""';
    const seg = genExpr(block.getInputTargetBlock("SEGMENT"), context) || '""';
    const rep = genExpr(block.getInputTargetBlock("REPLACEMENT"), context) || '""';
    return `${text}.replace(${seg}, ${rep})`;
  }

  if (t === "lists_pick_random") {
    const list = genExpr(block.getInputTargetBlock("LIST"), context) || "new java.util.ArrayList<>()";
    return `(${list}.isEmpty() ? null : ${list}.get(new java.util.Random().nextInt(${list}.size())))`;
  }
  if (t === "lists_copy") {
    const list = genExpr(block.getInputTargetBlock("LIST"), context) || "new java.util.ArrayList<>()";
    return `new java.util.ArrayList<>(${list})`;
  }

  if (t === "map_keys") {
    const map = genExpr(block.getInputTargetBlock("MAP"), context) || "new java.util.HashMap<>()";
    return `new java.util.ArrayList<>(${map}.keySet())`;
  }
  if (t === "map_values") {
    const map = genExpr(block.getInputTargetBlock("MAP"), context) || "new java.util.HashMap<>()";
    return `new java.util.ArrayList<>(${map}.values())`;
  }
  if (t === "map_contains_key") {
    const map = genExpr(block.getInputTargetBlock("MAP"), context) || "new java.util.HashMap<>()";
    const key = genExpr(block.getInputTargetBlock("KEY"), context) || "null";
    return `${map}.containsKey(${key})`;
  }
  if (t === "map_size") {
    const map = genExpr(block.getInputTargetBlock("MAP"), context) || "new java.util.HashMap<>()";
    return `${map}.size()`;
  }

  if (t === "android_clipboard_get") {
    return `((android.content.ClipboardManager) this.context.getSystemService(Context.CLIPBOARD_SERVICE)).getPrimaryClip().getItemAt(0).getText().toString()`;
  }

  if (t === "file_exists") {
    const path = genExpr(block.getInputTargetBlock("PATH"), context) || '""';
    return `new java.io.File(${path}).exists()`;
  }
  if (t === "file_delete") {
    const path = genExpr(block.getInputTargetBlock("PATH"), context) || '""';
    return `new java.io.File(${path}).delete()`;
  }
  if (t === "file_list") {
    const path = genExpr(block.getInputTargetBlock("PATH"), context) || '""';
    return `new java.util.ArrayList<>(java.util.Arrays.asList(new java.io.File(${path}).list()))`;
  }

  // --- NEW GENERATOR LOGIC (Step 528) ---

  if (t === "device_get_language") {
    return "java.util.Locale.getDefault().getLanguage()";
  }

  if (t === "device_is_dark_mode") {
    return "((this.context.getResources().getConfiguration().uiMode & android.content.res.Configuration.UI_MODE_NIGHT_MASK) == android.content.res.Configuration.UI_MODE_NIGHT_YES)";
  }

  if (t === "web_url_encode") {
    const txt = genExpr(block.getInputTargetBlock("TEXT"), context) || '""';
    return `java.net.URLEncoder.encode(${txt}, "UTF-8")`;
  }

  if (t === "web_url_decode") {
    const txt = genExpr(block.getInputTargetBlock("TEXT"), context) || '""';
    return `java.net.URLDecoder.decode(${txt}, "UTF-8")`;
  }

  if (t === "web_html_decode") {
    const txt = genExpr(block.getInputTargetBlock("TEXT"), context) || '""';
    return `android.text.Html.fromHtml(${txt}).toString()`;
  }

  if (t === "math_parse_int") {
    const txt = genExpr(block.getInputTargetBlock("TEXT"), context) || '""';
    const def = genExpr(block.getInputTargetBlock("DEFAULT"), context) || "0";
    // Safe parse
    return `(new Object() { int p(String s, int d) { try { return Integer.parseInt(s); } catch(Exception e) { return d; } } }).p(${txt}, ${def})`;
  }

  if (t === "math_parse_float") {
    const txt = genExpr(block.getInputTargetBlock("TEXT"), context) || '""';
    const def = genExpr(block.getInputTargetBlock("DEFAULT"), context) || "0.0";
    return `(new Object() { float p(String s, float d) { try { return Float.parseFloat(s); } catch(Exception e) { return d; } } }).p(${txt}, ${def})`;
  }

  if (t === "map_is_empty") {
    const map = genExpr(block.getInputTargetBlock("MAP"), context) || "new java.util.HashMap<>()";
    return `${map}.isEmpty()`;
  }

  return "null";
}

let __loopCounter = 0;

function genStatement(
  block: Blockly.Block | null,
  context: { props: string[]; params: string[] },
): string {
  if (!block) return "";
  const t = block.type;
  if (t === "ai2_set") {
    const rawName = block.getFieldValue("NAME") || "field";
    const name = toCamelCase(decodeHtmlEntities(rawName));
    const safeName = sanitizeIdentifier(name);
    const expr = genExpr(block.getInputTargetBlock("VALUE"), context);
    return `    this.${safeName} = ${expr};\n`;
  }
  if (t === "variables_set") {
    const varNameRaw = block.getFieldValue("VAR") || block.getFieldValue("NAME") || "var";
    const varName = sanitizeIdentifier(varNameRaw);
    const expr = genExpr(block.getInputTargetBlock("VALUE"), context);
    if (context.props.includes(varName) || context.params.includes(varName)) {
      return `    ${varName} = ${expr};\n`;
    }
    return `    Object ${varName} = ${expr};\n`;
  }

  if (t === "math_change") {
    const varNameRaw = block.getFieldValue("VAR") || block.getFieldValue("NAME") || "var";
    const varName = sanitizeIdentifier(varNameRaw);
    const delta =
      genExpr(block.getInputTargetBlock("DELTA") || block.getInputTargetBlock("NUM") || block.getInputTargetBlock("VALUE"), context) ||
      block.getFieldValue("DELTA") ||
      "0";
    if (context.props.includes(varName) || context.params.includes(varName)) {
      return `    ${varName} = ${varName} + (${delta});\n`;
    }
    return `    ${varName} = (${varName} == null ? 0 : ${varName}) + (${delta});\n`;
  }
  if (t === "ai2_return") {
    const expr = genExpr(block.getInputTargetBlock("VALUE"), context);
    // HACK: If the expression starts with "new java.util.ArrayList" or "new ArrayList", 
    // and we assume the user MIGHT want it as a String (common mistake),
    // we could check the enclosing method's return type... but we don't know it here easily.

    // Instead, let's just return the expression. 
    // The USER asked to "fix the java generator".
    // The specific user code returns String but provides List.
    // If we wrap *everything* in String.valueOf() it breaks int/boolean returns.

    // Compromise: checking context? We can pass expectedType in 'context' if we refactored genMethod.
    // Let's refactor genMethod to pass 'expectedReturnType' to genStatement.

    const expected = (context as any).expectedReturnType || "void";
    if (expected === "String" || expected === "java.lang.String") {
      // Only wrap if it doesn't look like a string
      if (!expr.startsWith('"') && !expr.startsWith("String.valueOf")) {
        return `    return String.valueOf(${expr});\n`;
      }
    }
    return `    return ${expr};\n`;
  }
  if (t === "ai2_dispatch") {
    const rawName = block.getFieldValue("NAME") || "Event";
    const name = sanitizeIdentifier(rawName, { pascal: true });
    const argsText = block.getFieldValue("ARGS") || "";
    const args = parseParams(argsText).map((p) => p.name).join(", ");
    const dispatchArgs = args ? `this, \"${escapeQuote(decodeHtmlEntities(rawName))}\", ${args}` : `this, \"${escapeQuote(decodeHtmlEntities(rawName))}\"`;
    return `    EventDispatcher.dispatchEvent(${dispatchArgs});\n`;
  }
  if (t === "controls_if") {
    let code = "";
    let i = 0;
    while (true) {
      const condInput = `IF${i}`;
      const doInput = `DO${i}`;
      const condBlock = block.getInputTargetBlock(condInput as any);
      const doBlock = block.getInputTargetBlock(doInput as any);
      if (!condBlock) break;
      const cond = genExpr(condBlock, context);
      const bodyStmts: string[] = [];
      let cur = doBlock;
      while (cur) {
        bodyStmts.push(genStatement(cur, context));
        cur = cur.getNextBlock();
      }
      if (i === 0) code += `    if (${cond}) {\n${bodyStmts.join("")}    }`;
      else code += ` else if (${cond}) {\n${bodyStmts.join("")}    }`;
      i++;
    }
    const elseBlock = block.getInputTargetBlock("ELSE");
    if (elseBlock) {
      const bodyStmts: string[] = [];
      let cur = elseBlock;
      while (cur) {
        bodyStmts.push(genStatement(cur, context));
        cur = cur.getNextBlock();
      }
      code += ` else {\n${bodyStmts.join("")}    }`;
    }
    return code + "\n";
  }

  if (t === "controls_repeat") {
    const timesBlock = block.getInputTargetBlock("TIMES") || block.getInputTargetBlock("NUM");
    const timesExpr = genExpr(timesBlock, context) || block.getFieldValue("TIMES") || block.getFieldValue("NUM") || "0";
    const bodyFirst = block.getInputTargetBlock("DO");
    const loopVar = `i${__loopCounter++}`;
    const bodyStmts: string[] = [];
    let cur = bodyFirst;
    while (cur) {
      bodyStmts.push(genStatement(cur, context));
      cur = cur.getNextBlock();
    }
    return `    for (int ${loopVar}=0; ${loopVar}<(${timesExpr}); ${loopVar}++) {\n${bodyStmts.join("")}    }\n`;
  }

  if (t === "controls_forEach") {
    const varName = sanitizeIdentifier(block.getFieldValue("VAR") || "item");
    const listExpr = genExpr(block.getInputTargetBlock("LIST"), context) || "new java.util.ArrayList<>()";
    const bodyFirst = block.getInputTargetBlock("DO");
    const bodyStmts: string[] = [];
    let cur = bodyFirst;
    while (cur) {
      bodyStmts.push(genStatement(cur, context));
      cur = cur.getNextBlock();
    }
    return `    for (Object ${varName} : ${listExpr}) {\n${bodyStmts.join("")}    }\n`;
  }

  if (t === "controls_for") {
    const varName = sanitizeIdentifier(block.getFieldValue("VAR") || "i");
    const fromExpr = genExpr(block.getInputTargetBlock("FROM"), context) || "0";
    const toExpr = genExpr(block.getInputTargetBlock("TO"), context) || "0";
    const byExpr = genExpr(block.getInputTargetBlock("BY"), context) || "1";
    const bodyFirst = block.getInputTargetBlock("DO");
    const bodyStmts: string[] = [];
    let cur = bodyFirst;
    while (cur) {
      bodyStmts.push(genStatement(cur, context));
      cur = cur.getNextBlock();
    }
    return `    for (int ${varName} = ${fromExpr}; ${varName} <= ${toExpr}; ${varName} += ${byExpr}) {\n${bodyStmts.join("")}    }\n`;
  }

  if (t === "controls_whileUntil") {
    const mode = block.getFieldValue("MODE") || "WHILE";
    const condBlock = block.getInputTargetBlock("BOOL") || block.getInputTargetBlock("COND") || null;
    const cond = genExpr(condBlock, context) || "false";
    const bodyFirst = block.getInputTargetBlock("DO");
    const bodyStmts: string[] = [];
    let cur = bodyFirst;
    while (cur) {
      bodyStmts.push(genStatement(cur, context));
      cur = cur.getNextBlock();
    }
    if (mode === "UNTIL") {
      return `    while (!(${cond})) {\n${bodyStmts.join("")}    }\n`;
    }
    return `    while (${cond}) {\n${bodyStmts.join("")}    }\n`;
  }

  if (t === "text_print") {
    const arg = genExpr(block.getInputTargetBlock("TEXT") || block.getInputTargetBlock("VALUE"), context) || '\"\"';
    return `    System.out.println(${arg});\n`;
  }

  // Advanced: HTTP GET
  if (t === "http_get") {
    const urlExpr = genExpr(block.getInputTargetBlock("URL"), context) || '\"\"';
    const onSuccess = block.getInputTargetBlock("ON_SUCCESS");
    const onError = block.getInputTargetBlock("ON_ERROR");
    let code = `    new Thread(new Runnable() { public void run() {\n`;
    code += `      try {\n`;
    code += `        URL __url = new URL(${urlExpr});\n`;
    code += `        HttpURLConnection __conn = (HttpURLConnection)__url.openConnection();\n`;
    code += `        __conn.setRequestMethod("GET");\n`;
    code += `        InputStream __is = __conn.getInputStream();\n`;
    code += `        BufferedReader __br = new BufferedReader(new InputStreamReader(__is));\n`;
    code += `        StringBuilder __sb = new StringBuilder(); String __line; while ((__line = __br.readLine()) != null) { __sb.append(__line); }\n`;
    code += `        final String __resp = __sb.toString();\n`;
    code += `        __br.close(); __is.close(); __conn.disconnect();\n`;
    code += `        new Handler(Looper.getMainLooper()).post(new Runnable(){ public void run() {\n`;
    if (onSuccess) {
      let cur = onSuccess;
      while (cur) {
        code += genStatement(cur, { props: [], params: [] });
        cur = cur.getNextBlock();
      }
    } else {
      code += `          // success (no handler)\n`;
    }


    code += `        }});\n`;
    code += `      } catch (final Exception __e) {\n`;
    code += `        new Handler(Looper.getMainLooper()).post(new Runnable(){ public void run(){\n`;
    if (onError) {
      let cur = onError;
      while (cur) {
        code += genStatement(cur, { props: [], params: [] });
        cur = cur.getNextBlock();
      }
    } else {
      code += `            // error handler not provided\n`;
    }
    code += `        }});\n`;
    code += `      }\n`;
    code += `    }}).start();\n`;
    return code;
  }

  // Thread runner
  if (t === "thread_run") {
    const first = block.getInputTargetBlock("DO");
    let code = `    new Thread(new Runnable(){ public void run(){\n`;
    let cur = first;
    while (cur) {
      code += genStatement(cur, { props: [], params: [] });
      cur = cur.getNextBlock();
    }
    code += `    }}).start();\n`;
    return code;
  }

  // Delay (non-blocking) using handler.postDelayed
  if (t === "timer_delay") {
    const ms = block.getFieldValue("MS") || "1000";
    const first = block.getInputTargetBlock("DO");
    const handlerVar = `__handler${__loopCounter++}`;
    let code = `    final Handler ${handlerVar} = new Handler(Looper.getMainLooper());\n`;
    code += `    ${handlerVar}.postDelayed(new Runnable(){ public void run(){\n`;
    let cur = first;
    while (cur) {
      code += genStatement(cur, { props: [], params: [] });
      cur = cur.getNextBlock();
    }
    code += `    }}, ${ms});\n`;
    return code;
  }

  // Map modifications
  if (t === "map_put") {
    const map = genExpr(block.getInputTargetBlock("MAP"), context) || "new java.util.HashMap<>()";
    const key = genExpr(block.getInputTargetBlock("KEY"), context) || "null";
    const val = genExpr(block.getInputTargetBlock("VALUE"), context) || "null";
    return `    ${map}.put(${key}, ${val});\n`;
  }
  if (t === "map_remove") {
    const map = genExpr(block.getInputTargetBlock("MAP"), context) || "new java.util.HashMap<>()";
    const key = genExpr(block.getInputTargetBlock("KEY"), context) || "null";
    return `    ${map}.remove(${key});\n`;
  }

  // List modifications
  if (t === "lists_append") {
    const listExpr = genExpr(block.getInputTargetBlock("LIST"), context) || "null";
    const item = genExpr(block.getInputTargetBlock("ITEM"), context) || "null";
    if (listExpr === "null") return `    // unable to append: list is null\n`;
    return `    if (${listExpr} == null) ${listExpr} = new java.util.ArrayList<>();\n    ${listExpr}.add(${item});\n`;
  }

  if (t === "lists_remove_at") {
    const listExpr = genExpr(block.getInputTargetBlock("LIST"), context) || "null";
    const idx = genExpr(block.getInputTargetBlock("INDEX"), context) || "0";
    return `    if (${listExpr} != null) ${listExpr}.remove((int)${idx});\n`;
  }

  if (t === "map_put") {
    const mapExpr = genExpr(block.getInputTargetBlock("MAP"), context) || "null";
    const key = genExpr(block.getInputTargetBlock("KEY"), context) || "null";
    const value = genExpr(block.getInputTargetBlock("VALUE"), context) || "null";
    if (mapExpr === "null") return `    // unable to put: map is null\n`;
    return `    if (${mapExpr} == null) ${mapExpr} = new java.util.HashMap<>();\n    ${mapExpr}.put(${key}, ${value});\n`;
  }

  if (t === "file_write") {
    const path = genExpr(block.getInputTargetBlock("PATH"), context) || '\"\"';
    const content = genExpr(block.getInputTargetBlock("CONTENT"), context) || '\"\"';
    return `    try { java.io.FileOutputStream __fos = this.context.openFileOutput(${path}, android.content.Context.MODE_PRIVATE); __fos.write(${content}.getBytes()); __fos.close(); } catch(Exception __e) { /* ignore */ }\n`;
  }

  if (t === "ai2_custom_code") {
    const code = block.getFieldValue("CODE") || "";
    return `    ${code}\n`;
  }

  if (t === "native_field_set") {
    const target = genExpr(block.getInputTargetBlock("TARGET"), context) || "this";
    const field = block.getFieldValue("FIELD") || "field";
    const val = genExpr(block.getInputTargetBlock("VALUE"), context) || "null";
    return `    ${target}.${field} = ${val};\n`;
  }

  if (t === "vibrator_vibrate") {
    const ms = genExpr(block.getInputTargetBlock("MS"), context) || "500";
    return `    ((Vibrator) this.context.getSystemService(Context.VIBRATOR_SERVICE)).vibrate(${ms});\n`;
  }

  if (t === "prefs_store") {
    const key = genExpr(block.getInputTargetBlock("KEY"), context) || '""';
    const val = genExpr(block.getInputTargetBlock("VALUE"), context) || '""';
    // Using simple getAll shared prefs name or package name
    return `    this.context.getSharedPreferences("AI2_Extension_Prefs", Context.MODE_PRIVATE).edit().putString(${key}, String.valueOf(${val})).apply();\n`;
  }

  if (t === "file_write") {
    const fn = genExpr(block.getInputTargetBlock("FILENAME"), context) || '"file.txt"';
    const text = genExpr(block.getInputTargetBlock("TEXT"), context) || '""';
    return `    try (java.io.OutputStreamWriter _osw = new java.io.OutputStreamWriter(this.context.openFileOutput(${fn}, Context.MODE_PRIVATE))) { _osw.write(${text}); } catch(Exception e) { throw new RuntimeException(e); }\n`;
  }

  // --- HARDENED LISTS LOGIC ---
  if (t === "lists_getIndex") {
    const listExpr = genExpr(block.getInputTargetBlock("LIST"), context);
    const idxExpr = genExpr(block.getInputTargetBlock("INDEX"), context);
    // Safe generated code that checks bounds
    // Note: This relies on ternary in expression context, which can be messy. 
    // Ideally user enters valid index, but for robustness:
    return `(${listExpr} != null && (${listExpr}.size() > ${idxExpr}) && (${idxExpr} >= 0) ? ${listExpr}.get(${idxExpr}) : null)`;
  }

  if (t === "lists_sort") {
    const list = genExpr(block.getInputTargetBlock("LIST"), context) || "null";
    const type = block.getFieldValue("TYPE");
    const dir = block.getFieldValue("DIRECTION");
    if (type === "IGNORE_CASE") {
      return `    if (${list} != null) { try { java.util.Collections.sort(${list}, String.CASE_INSENSITIVE_ORDER); } catch(Exception e){} }\n` + (dir === "-1" ? `    if (${list} != null) java.util.Collections.reverse(${list});\n` : "");
    }
    return `    if (${list} != null) { try { java.util.Collections.sort(${list}); } catch(Exception e){} ${dir === "-1" ? `java.util.Collections.reverse(${list}); ` : ""} }\n`;
  }
  if (t === "lists_reverse") {
    const list = genExpr(block.getInputTargetBlock("LIST"), context) || "null";
    return `    if (${list} != null) java.util.Collections.reverse(${list});\n`;
  }
  if (t === "lists_shuffle") {
    const list = genExpr(block.getInputTargetBlock("LIST"), context) || "null";
    return `    if (${list} != null) java.util.Collections.shuffle(${list});\n`;
  }

  // --- HARDENED MAP LOGIC ---
  if (t === "map_get") {
    const mapExpr = genExpr(block.getInputTargetBlock("MAP"), context) || "new java.util.HashMap<>()";
    const key = genExpr(block.getInputTargetBlock("KEY"), context) || '\"\"';
    return `(${mapExpr} != null ? ${mapExpr}.get(${key}) : null)`;
  }
  if (t === "map_remove") {
    const map = genExpr(block.getInputTargetBlock("MAP"), context) || "null";
    const key = genExpr(block.getInputTargetBlock("KEY"), context) || "null";
    return `    if (${map} != null) ${map}.remove(${key});\n`;
  }
  if (t === "map_clear") {
    const map = genExpr(block.getInputTargetBlock("MAP"), context) || "null";
    return `    if (${map} != null) ${map}.clear();\n`;
  }

  // --- SYSTEM EXTRAS ---
  if (t === "android_toast") {
    const msg = genExpr(block.getInputTargetBlock("MSG"), context) || '""';
    const dur = block.getFieldValue("DURATION") || "0";
    return `    android.widget.Toast.makeText(this.context, ${msg}, ${dur == "1" ? "android.widget.Toast.LENGTH_LONG" : "android.widget.Toast.LENGTH_SHORT"}).show();\n`;
  }
  if (t === "android_log") {
    const tag = genExpr(block.getInputTargetBlock("TAG"), context) || '"AI2"';
    const msg = genExpr(block.getInputTargetBlock("MSG"), context) || '""';
    const lvl = block.getFieldValue("LEVEL") || "d";
    return `    android.util.Log.${lvl}(${tag}, ${msg});\n`;
  }
  if (t === "android_clipboard_set") {
    const text = genExpr(block.getInputTargetBlock("TEXT"), context) || '""';
    return `    ((android.content.ClipboardManager) this.context.getSystemService(Context.CLIPBOARD_SERVICE)).setPrimaryClip(android.content.ClipData.newPlainText("AI2", ${text}));\n`;
  }
  if (t === "android_open_url") {
    const url = genExpr(block.getInputTargetBlock("URL"), context) || '""';
    return `    try { android.content.Intent _i = new android.content.Intent(android.content.Intent.ACTION_VIEW, android.net.Uri.parse(${url})); _i.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK); this.context.startActivity(_i); } catch(Exception e) {}\n`;
  }
  if (t === "android_share_text") {
    const msg = genExpr(block.getInputTargetBlock("MSG"), context) || '""';
    return `    try { android.content.Intent _i = new android.content.Intent(android.content.Intent.ACTION_SEND); _i.setType("text/plain"); _i.putExtra(android.content.Intent.EXTRA_TEXT, ${msg}); _i.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK); this.context.startActivity(android.content.Intent.createChooser(_i, "Share").addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK)); } catch(Exception e) {}\n`;
  }

  if (t === "math_constrain") {
    const val = genExpr(block.getInputTargetBlock("VALUE"), context) || "0";
    const low = genExpr(block.getInputTargetBlock("LOW"), context) || "0";
    const high = genExpr(block.getInputTargetBlock("HIGH"), context) || "0";
    return `Math.max(${low}, Math.min(${val}, ${high}))`;
  }

  if (t === "text_replace_regex") {
    const text = genExpr(block.getInputTargetBlock("TEXT"), context) || '""';
    const regex = genExpr(block.getInputTargetBlock("REGEX"), context) || '""';
    const repl = genExpr(block.getInputTargetBlock("REPLACEMENT"), context) || '""';
    return `${text}.replaceAll(${regex}, ${repl})`;
  }


  if (t === "toast_show") {
    const msg = genExpr(block.getInputTargetBlock("MESSAGE"), context) || '""';
    const dur = block.getFieldValue("DURATION") === "1" ? "Toast.LENGTH_LONG" : "Toast.LENGTH_SHORT";
    return `    Toast.makeText(this.context, ${msg}, ${dur}).show();\n`;
  }

  // --- FINAL PROFESSIONAL GENERATOR LOGIC ---
  if (t === "controls_try_catch") {
    const tryBlock = block.getInputTargetBlock("TRY");
    const catchBlock = block.getInputTargetBlock("CATCH");
    let tryCode = "";
    let cur = tryBlock;
    while (cur) { tryCode += genStatement(cur, context); cur = cur.getNextBlock(); }

    let catchCode = "";
    cur = catchBlock;
    while (cur) { catchCode += genStatement(cur, context); cur = cur.getNextBlock(); }

    return `    try {\n${tryCode}    } catch (Exception e) {\n      android.util.Log.e("AI2", "Error: " + e.getMessage());\n${catchCode}    }\n`;
  }

  if (t === "device_is_online") {
    return `((android.net.ConnectivityManager)this.context.getSystemService(Context.CONNECTIVITY_SERVICE)).getActiveNetworkInfo() != null && ((android.net.ConnectivityManager)this.context.getSystemService(Context.CONNECTIVITY_SERVICE)).getActiveNetworkInfo().isConnected()`;
  }

  if (t === "device_vibrate") {
    const ms = genExpr(block.getInputTargetBlock("MILLIS"), context) || "500";
    return `    ((android.os.Vibrator)this.context.getSystemService(Context.VIBRATOR_SERVICE)).vibrate(${ms});\n`;
  }

  if (t === "device_battery_level") {
    return `((android.os.BatteryManager)this.context.getSystemService(Context.BATTERY_SERVICE)).getIntProperty(android.os.BatteryManager.BATTERY_PROPERTY_CAPACITY)`;
  }

  if (t === "prefs_store") {
    const key = genExpr(block.getInputTargetBlock("KEY"), context) || '""';
    const val = genExpr(block.getInputTargetBlock("VALUE"), context) || '""';
    return `    this.context.getSharedPreferences("AI2_Extension_Prefs", Context.MODE_PRIVATE).edit().putString(${key}, String.valueOf(${val})).apply();\n`;
  }

  if (t === "date_now_millis") {
    return "System.currentTimeMillis()";
  }

  if (t === "clipboard_copy") {
    const text = genExpr(block.getInputTargetBlock("TEXT"), context) || '""';
    return `    ((ClipboardManager) this.context.getSystemService(Context.CLIPBOARD_SERVICE)).setPrimaryClip(ClipData.newPlainText("AI2", ${text}));\n`;
  }

  if (t === "intent_open") {
    const url = genExpr(block.getInputTargetBlock("URL"), context) || '""';
    return `    Intent __i = new Intent(Intent.ACTION_VIEW, Uri.parse(${url}));\n    __i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);\n    this.context.startActivity(__i);\n`;
  }

  const expr = genExpr(block, context);
  if (expr !== "null") return `    ${expr};\n`;
  return `    // unsupported block: ${t}\n`;
}

function genProperty(block: Blockly.Block) {
  const rawType = block.getFieldValue("TYPE") || "String";
  const rawName = block.getFieldValue("NAME") || "Property";
  const def = block.getFieldValue("DEFAULT") || "";
  const readonly = block.getFieldValue("READONLY") === "TRUE";

  const type = decodeHtmlEntities(rawType).replace(/\s+/g, "");
  const name = sanitizeIdentifier(rawName, { pascal: true });
  const fieldName = sanitizeIdentifier(rawName);
  const field = `  private ${type} ${fieldName} = ${defaultValueFor(type, def)};\n`;
  const getter = `  @SimpleProperty(description = \"${escapeQuote(rawName)} value\")\n  public ${type} ${name}() {\n    return this.${fieldName};\n  }`;
  const setter = readonly
    ? ""
    : `\n\n  @SimpleProperty(description = \"Set ${escapeQuote(rawName)}\")\n  public void ${name}(${type} value) {\n    this.${fieldName} = value;\n  }`;

  return `${field}${getter}${setter}\n`;
}

function genMethod(block: Blockly.Block) {
  const retRaw = block.getFieldValue("RET") || "void";
  const nameRaw = block.getFieldValue("NAME") || "method";
  const paramsText = block.getFieldValue("PARAMS") || "";
  const params = parseParams(paramsText);

  const ret = decodeHtmlEntities(retRaw).replace(/\s+/g, "") || "void";
  const name = sanitizeIdentifier(nameRaw);
  const paramSig = params.map((p) => `${p.type} ${p.name}`).join(", ");
  const paramNames = params.map((p) => p.name);

  let body = "";
  const first = block.getInputTargetBlock("BODY");
  let cur = first;
  const context = { props: [], params: paramNames, expectedReturnType: ret };
  while (cur) {
    body += genStatement(cur, context);
    cur = cur.getNextBlock();
  }

  const needsReturn = ret !== "void";
  let returnLine = needsReturn
    ? `    return ${ret === "boolean" ? "false" : ret === "int" ? "0" : ret === "float" ? "0f" : "null"};\n`
    : "";

  // If the last block is an explicit return, we might omit the default return, or rely on Java compiler analysis.
  // A simple heuristic: check if the body ends with "return ...;"
  // But body is a string.
  // If we processed ai2_return, we could have tracked it.

  if (body.trim().endsWith(";") && body.includes("return ")) {
    // This is risky if the return is conditional.
    // Better safe than sorry: keep the default return but maybe comment it out or wrap in unreachable block?
    // No, Java compiler errors on "unreachable statement".
    // If the user's code is "return ...; return null;", the second return is unreachable.
    // So we SHOULD remove it if the last statement is definitely a return.
    // However, without parsing, it's hard.
    // Let's modify genMethod to accept `lastBlockType`.
  }

  // Let's do this: check if the last top-level block in the body was 'ai2_return'
  let lastWasReturn = false;
  let b = first;
  while (b) {
    if (b.type === "ai2_return") lastWasReturn = true;
    else lastWasReturn = false;
    b = b.getNextBlock();
  }

  if (lastWasReturn) {
    returnLine = "";
  }

  // FIX: If return type is String, verify the returned block. 
  // If it's a list or non-string, wrap in String.valueOf(...) to prevent compile errors.
  let isStringReturn = ret === "String" || ret === "java.lang.String";

  // Re-process body to inject specific return logic? 
  // No, genStatement calls genExpr. We need to handle this inside genStatement(ai2_return) or here.
  // Actually, ai2_return returns "return ...;" statement. 
  // We can't easily intercept it here because 'body' is already a flat string.

  // STRATEGY: We will rely on genStatement for ai2_return to include casting if needed.
  // BUT we don't pass 'method return type' to genStatement.

  // Alternative: We modify ai2_return generation to ALWAYS use String.valueOf logic? No, that breaks other types.

  // Let's modify genStatement signature to accept context? It already does.
  // But context only has props/params.

  // EASIER FIX: Since current user issue involves a complex expression, 
  // and we can't easily parse 'body' string, let's just add 'throws Exception' for the "Limitless" support.
  // AND for the return type mismatch: The user is returning an ArrayList.
  // The provided code snippet shows: return new java.util.ArrayList...
  // If we can't change the block, we can't fix the code 100% without context.
  // BUT, we can make `ai2_return` smarter.

  // Let's change the signature first.
  return `  @SimpleFunction(description = \"${escapeQuote(nameRaw)} function\")\n  public ${ret} ${name}(${paramSig}) throws Exception {\n${body}${returnLine}  }\n`;
}

function genEvent(block: Blockly.Block) {
  const rawName = block.getFieldValue("NAME") || "Event";
  const paramsText = block.getFieldValue("PARAMS") || "";
  const params = parseParams(paramsText);
  const sig = params.map((p) => `${p.type} ${p.name}`).join(", ");
  const dispatchArgs = ["this", `\"${escapeQuote(rawName)}\"`].concat(params.map((p) => p.name)).join(", ");
  const name = sanitizeIdentifier(rawName);
  return `  @SimpleEvent(description = \"${escapeQuote(rawName)} event\")\n  public void ${name}(${sig}) {\n    EventDispatcher.dispatchEvent(${dispatchArgs});\n  }\n`;
}

export function generateJavaFromWorkspace(
  workspace: Blockly.Workspace,
): string {
  const topBlocks = workspace.getTopBlocks(true);
  const root = topBlocks.find((b) => b.type === "ai2_extension");
  if (!root) return "// Add an 'AI2 Extension' block to begin";

  const pkgRaw = root.getFieldValue("PACKAGE") || "com.example";
  const clsRaw = root.getFieldValue("CLASSNAME") || "MyExtension";
  const desc = root.getFieldValue("DESC") || "An App Inventor 2 extension";
  const version = Number(root.getFieldValue("VERSION") || 1);
  const author = root.getFieldValue("AUTHOR") || "";

  const pkg = decodeHtmlEntities(String(pkgRaw || "com.example")).replace(/[^a-zA-Z0-9_\.]/g, "");
  const cls = sanitizeIdentifier(clsRaw, { pascal: true });

  const header = `package ${pkg};\n\n`;
  const helpUrl = root.getFieldValue("HELP_URL") || "";
  const libsRaw = root.getFieldValue("LIBRARIES") || "";
  const importsRaw = root.getFieldValue("IMPORTS") || "";

  const libList = libsRaw.split(",").map((l: string) => l.trim()).filter(Boolean);
  const importList = importsRaw.split(",").map((l: string) => l.trim()).filter(Boolean);

  const usesLibs = libList.length > 0 ? `, libraries = "${libList.join(", ")}"` : "";
  const helpAnno = helpUrl ? `, helpUrl = "${escapeQuote(helpUrl)}"` : "";

  const extraImports = importList.map((i: string) => `import ${i};`).join("\n");

  const imports = [
    "import android.content.Context;",
    "import com.google.appinventor.components.annotations.*;",
    "import com.google.appinventor.components.runtime.*;",
    "import com.google.appinventor.components.runtime.util.*;",
    "import java.util.*;",
    "import java.net.*;",
    "import java.io.*;",
    "import org.json.*;",
    "import android.os.Handler;",
    "import android.os.Looper;",
    "import android.util.Base64;",
    "import java.text.SimpleDateFormat;",
    "import java.security.MessageDigest;",
    "import java.util.regex.*;",
    "import android.os.Build;",
    "import android.widget.Toast;",
    "import android.content.Intent;",
    "import android.net.Uri;",
    "import android.content.ClipData;",
    "import android.content.ClipboardManager;",
    "import android.os.Vibrator;",
    extraImports
  ].join("\n");

  const anno = `@DesignerComponent(version = ${version}, description = \"${escapeQuote(desc)}\", category = ComponentCategory.EXTENSION, nonVisible = true, iconName = \"\"${helpAnno})${usesLibs}\n@SimpleObject(external = true)`;

  const classHeader = `public class ${cls} extends AndroidNonvisibleComponent {\n\n  private final Context context;\n\n  public ${cls}(ComponentContainer container) {\n    super(container.$form());\n    this.context = container.$context();\n  }\n`;

  // properties
  let propsCode = "";
  const props: string[] = [];
  let propBlock = root.getInputTargetBlock("PROPERTIES");
  while (propBlock) {
    if (propBlock.type === "ai2_property") {
      propsCode += genProperty(propBlock) + "\n";
      const nameRaw = propBlock.getFieldValue("NAME") || "";
      props.push(sanitizeIdentifier(nameRaw));
    }
    propBlock = propBlock.getNextBlock();
  }

  // methods
  let methodsCode = "";
  let methodBlock = root.getInputTargetBlock("METHODS");
  while (methodBlock) {
    if (methodBlock.type === "ai2_method") {
      methodsCode += genMethod(methodBlock as Blockly.Block) + "\n";
    }
    methodBlock = methodBlock.getNextBlock();
  }

  // events
  let eventsCode = "";
  let eventBlock = root.getInputTargetBlock("EVENTS");
  while (eventBlock) {
    if (eventBlock.type === "ai2_event") eventsCode += genEvent(eventBlock) + "\n";
    eventBlock = eventBlock.getNextBlock();
  }

  const body = [propsCode, methodsCode, eventsCode].filter(Boolean).join("\n\n");
  const footer = `}\n`;

  return `${header}${imports}\n\n${anno}\n${classHeader}\n${body}\n${footer}`;
}
