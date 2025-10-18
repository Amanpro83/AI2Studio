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
    return `(${a} ${sym} ${b})`;
  }
  if (t === "logic_compare") {
    const op = block.getFieldValue("OP");
    const a = genExpr(block.getInputTargetBlock("A"), context);
    const b = genExpr(block.getInputTargetBlock("B"), context);
    const map: any = {
      EQ: "==",
      NEQ: "!=",
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

  // math single (sqrt, abs, neg, ln, exp, etc.)
  if (t === "math_single") {
    const op = block.getFieldValue("OP");
    const a = genExpr(
      block.getInputTargetBlock("NUM") || block.getInputTargetBlock("A"),
      context,
    );
    const map: any = {
      ROOT: (x: string) => `Math.sqrt(${x})`,
      ABS: (x: string) => `Math.abs(${x})`,
      NEG: (x: string) => `(-(${x}))`,
      LN: (x: string) => `Math.log(${x})`,
      LOG10: (x: string) => `Math.log10(${x})`,
      EXP: (x: string) => `Math.exp(${x})`,
      POW10: (x: string) => `Math.pow(10, ${x})`,
      ROUND: (x: string) => `Math.round(${x})`,
    };
    const fn = map[op];
    if (fn) return typeof fn === "function" ? fn(a) : `(${a})`;
    return `(${a})`;
  }

  if (t === "text_join") {
    const parts: string[] = [];
    for (const inp of block.inputList) {
      if (!inp.name) continue;
      if (inp.name.startsWith("ADD")) {
        const b = genExpr(block.getInputTargetBlock(inp.name), context);
        parts.push(b);
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
    return `(${child} == null ? 0 : ${child}.length())`;
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
  const context = { props: [], params: paramNames };
  while (cur) {
    body += genStatement(cur, context);
    cur = cur.getNextBlock();
  }

  const needsReturn = ret !== "void";
  const returnLine = needsReturn
    ? `    return ${ret === "boolean" ? "false" : ret === "int" ? "0" : ret === "float" ? "0f" : "null"};\n`
    : "";

  return `  @SimpleFunction(description = \"${escapeQuote(nameRaw)} function\")\n  public ${ret} ${name}(${paramSig}) {\n${body}${returnLine}  }\n`;
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
  ].join("\n");

  const anno = `@DesignerComponent(version = ${version}, description = \"${escapeQuote(desc)}\", category = ComponentCategory.EXTENSION, nonVisible = true, iconName = \"\")\n@SimpleObject(external = true)`;

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
