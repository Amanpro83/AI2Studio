import * as Blockly from "blockly/core";
import "blockly/blocks";

let __ai2Registered = false;

export function registerAI2Blocks() {
  // avoid redefining blocks if already registered
  if (__ai2Registered) return;
  __ai2Registered = true;

  // Extension root block
  if (!Blockly.Blocks["ai2_extension"]) {
    Blockly.Blocks["ai2_extension"] = {
      init() {
        this.appendDummyInput()
          .appendField("Extension")
          .appendField("Package:")
          .appendField(
            new Blockly.FieldTextInput("com.example.extension"),
            "PACKAGE",
          )
          .appendField("Class:")
          .appendField(new Blockly.FieldTextInput("MyExtension"), "CLASSNAME");
        this.appendDummyInput()
          .appendField("Description:")
          .appendField(
            new Blockly.FieldTextInput("An App Inventor 2 extension"),
            "DESC",
          );
        this.appendDummyInput()
          .appendField("Version:")
          .appendField(new Blockly.FieldNumber(1, 1, 1000, 1), "VERSION")
          .appendField("Author:")
          .appendField(new Blockly.FieldTextInput("Your Name"), "AUTHOR");
        this.appendDummyInput()
          .appendField("Help URL:")
          .appendField(new Blockly.FieldTextInput(""), "HELP_URL");
        this.appendDummyInput()
          .appendField("Libraries (comma sep):")
          .appendField(new Blockly.FieldTextInput(""), "LIBRARIES");
        this.appendDummyInput()
          .appendField("Extra Imports (comma sep):")
          .appendField(new Blockly.FieldTextInput(""), "IMPORTS");
        this.appendStatementInput("PROPERTIES")
          .setCheck(null)
          .appendField("Properties");
        this.appendStatementInput("METHODS")
          .setCheck(null)
          .appendField("Methods");
        this.appendStatementInput("EVENTS")
          .setCheck(null)
          .appendField("Events");
        this.setColour(265);
        this.setTooltip(
          "Define metadata, properties, methods and events for the AI2 extension.",
        );
        this.setHelpUrl(
          "https://ai2.appinventor.mit.edu/reference/components/extensions.html",
        );
      },
    } as any;
  }

  // Property block
  if (!Blockly.Blocks["ai2_property"]) {
    Blockly.Blocks["ai2_property"] = {
      init() {
        this.appendDummyInput()
          .appendField("Property")
          .appendField("Type:")
          .appendField(
            new Blockly.FieldDropdown([
              ["String", "String"],
              ["int", "int"],
              ["boolean", "boolean"],
              ["float", "float"],
              ["Object", "Object"],
              ["List", "List"],
            ]),
            "TYPE",
          )
          .appendField("Name:")
          .appendField(new Blockly.FieldTextInput("propertyName"), "NAME");
        this.appendDummyInput()
          .appendField("Default:")
          .appendField(new Blockly.FieldTextInput(""), "DEFAULT")
          .appendField("Read only:")
          .appendField(new Blockly.FieldCheckbox("FALSE"), "READONLY");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(25);
        this.setTooltip("Defines a property with optional getter/setter");
        this.setHelpUrl("");
      },
    } as any;
  }

  // Method block
  if (!Blockly.Blocks["ai2_method"]) {
    Blockly.Blocks["ai2_method"] = {
      init() {
        this.appendDummyInput()
          .appendField("Method")
          .appendField("Return:")
          .appendField(
            new Blockly.FieldDropdown([
              ["void", "void"],
              ["String", "String"],
              ["int", "int"],
              ["boolean", "boolean"],
              ["float", "float"],
              ["Object", "Object"],
              ["List", "List"],
            ]),
            "RET",
          )
          .appendField("Name:")
          .appendField(new Blockly.FieldTextInput("methodName"), "NAME");
        this.appendDummyInput()
          .appendField("Params (name:type, ...):")
          .appendField(new Blockly.FieldTextInput(""), "PARAMS");
        this.appendStatementInput("BODY").setCheck(null).appendField("Body");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(200);
        this.setTooltip("Defines a SimpleFunction");
        this.setHelpUrl("");
      },
    } as any;
  }

  // Event block
  if (!Blockly.Blocks["ai2_event"]) {
    Blockly.Blocks["ai2_event"] = {
      init() {
        this.appendDummyInput()
          .appendField("Event")
          .appendField("Name:")
          .appendField(new Blockly.FieldTextInput("eventName"), "NAME");
        this.appendDummyInput()
          .appendField("Params (name:type, ...):")
          .appendField(new Blockly.FieldTextInput(""), "PARAMS");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(330);
        this.setTooltip("Defines a SimpleEvent");
        this.setHelpUrl("");
      },
    } as any;
  }

  // Set a property or variable (AI2 style)
  Blockly.Blocks["ai2_set"] = {
    init() {
      this.appendDummyInput()
        .appendField("Set Property")
        .appendField("Name:")
        .appendField(new Blockly.FieldTextInput("propertyName"), "NAME");
      this.appendValueInput("VALUE").setCheck(null).appendField("Value:");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(230);
      this.setTooltip("Set an extension property or local variable");
      this.setHelpUrl(
        "https://ai2.appinventor.mit.edu/reference/components/extensions.html",
      );
    },
  } as any;

  // Return statement (AI2)
  Blockly.Blocks["ai2_return"] = {
    init() {
      this.appendValueInput("VALUE").setCheck(null).appendField("Return");
      this.setPreviousStatement(true, null);
      this.setColour(65);
      this.setTooltip("Return a value from a method");
      this.setHelpUrl("");
    },
  } as any;

  // Dispatch event (AI2)
  Blockly.Blocks["ai2_dispatch"] = {
    init() {
      this.appendDummyInput()
        .appendField("Dispatch Event")
        .appendField("Name:")
        .appendField(new Blockly.FieldTextInput("eventName"), "NAME");
      this.appendDummyInput()
        .appendField("Args (comma separated):")
        .appendField(new Blockly.FieldTextInput(""), "ARGS");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(300);
      this.setTooltip("Dispatch an event defined in this extension");
      this.setHelpUrl("");
    },
  } as any;

  // Convenience lists helper (if not present)
  if (!Blockly.Blocks["lists_create_with"]) {
    Blockly.Blocks["lists_create_with"] = {
      init() {
        this.appendDummyInput().appendField("create list with items");
        this.setOutput(true, "Array");
        this.setColour(260);
        this.setTooltip("Create a list with items");
      },
    } as any;
  }

  if (!Blockly.Blocks["lists_length"]) {
    Blockly.Blocks["lists_length"] = {
      init() {
        this.appendValueInput("VALUE")
          .setCheck("Array")
          .appendField("length of");
        this.setOutput(true, "Number");
        this.setColour(260);
        this.setTooltip("Length of a list");
      },
    } as any;
  }

  if (!Blockly.Blocks["lists_getIndex"]) {
    Blockly.Blocks["lists_getIndex"] = {
      init() {
        this.appendValueInput("LIST")
          .setCheck("Array")
          .appendField("get item at index");
        this.appendValueInput("INDEX").setCheck("Number").appendField("index");
        this.setOutput(true, null);
        this.setColour(260);
        this.setTooltip("Get item from list by index (0-based)");
      },
    } as any;
  }

  // Provide a safe, simple controls_repeat block to avoid message token validation issues
  // Keep input names TIMES and DO to match generator expectations
  Blockly.Blocks["controls_repeat"] = {
    init() {
      this.appendValueInput("TIMES").setCheck("Number").appendField("repeat");
      this.appendStatementInput("DO").appendField("do");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(120);
      this.setTooltip("Repeat n times");
      this.setHelpUrl("");
    },
  } as any;

  // Provide a safe controls_for block to avoid message token validation issues
  Blockly.Blocks["controls_for"] = {
    init() {
      // variable field
      this.appendDummyInput()
        .appendField("for")
        .appendField(new Blockly.FieldVariable("i"), "VAR");
      this.appendValueInput("FROM").setCheck("Number").appendField("from");
      this.appendValueInput("TO").setCheck("Number").appendField("to");
      this.appendValueInput("BY").setCheck("Number").appendField("by");
      this.appendStatementInput("DO").appendField("do");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(120);
      this.setTooltip("Count with variable from start to end by step");
      this.setHelpUrl("");
    },
  } as any;

  // Provide a safe controls_whileUntil block to avoid message token validation issues
  Blockly.Blocks["controls_whileUntil"] = {
    init() {
      this.appendDummyInput().appendField(
        new Blockly.FieldDropdown([
          ["while", "WHILE"],
          ["until", "UNTIL"],
        ]),
        "MODE",
      );
      this.appendValueInput("BOOL")
        .setCheck("Boolean")
        .appendField("condition");
      this.appendStatementInput("DO").appendField("do");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(120);
      this.setTooltip("Repeat while/until condition");
      this.setHelpUrl("");
    },
  } as any;

  // Provide a safe math_change block to avoid message token and args/message mismatches
  if (!Blockly.Blocks["math_change"]) {
    Blockly.Blocks["math_change"] = {
      init() {
        this.appendValueInput("DELTA")
          .setCheck("Number")
          .appendField("change")
          .appendField(new Blockly.FieldVariable("item"), "VAR")
          .appendField("by");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(230);
        this.setTooltip("Change the value of a variable by the given amount.");
        this.setHelpUrl("");
      },
    } as any;
  }

  // Provide a safe controls_forEach block (override core if present)
  Blockly.Blocks["controls_forEach"] = {
    init() {
      this.appendDummyInput()
        .appendField("for each")
        .appendField(new Blockly.FieldVariable("item"), "VAR");
      this.appendValueInput("LIST").setCheck("Array").appendField("in");
      this.appendStatementInput("DO").appendField("do");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(120);
      this.setTooltip("Iterate over each item in a list");
      this.setHelpUrl("");
    },
  } as any;

  // Fallback colour picker blocks if not defined by core
  if (!Blockly.Blocks["colour_picker"]) {
    Blockly.Blocks["colour_picker"] = {
      init() {
        // Use a simple text input for hex color to avoid relying on FieldColour implementation
        this.appendDummyInput()
          .appendField("colour:")
          .appendField(new Blockly.FieldTextInput("#ff0000"), "COLOUR");
        this.setOutput(true, "String");
        this.setColour(20);
        this.setTooltip("Pick a colour (hex)");
      },
    } as any;
  }
  if (!Blockly.Blocks["colour_random"]) {
    Blockly.Blocks["colour_random"] = {
      init() {
        this.appendDummyInput().appendField("random colour");
        this.setOutput(true, "String");
        this.setColour(20);
        this.setTooltip("Get a random colour (hex)");
      },
    } as any;
  }
  if (!Blockly.Blocks["colour_rgb"]) {
    Blockly.Blocks["colour_rgb"] = {
      init() {
        this.appendValueInput("R").setCheck("Number").appendField("red");
        this.appendValueInput("G").setCheck("Number").appendField("green");
        this.appendValueInput("B").setCheck("Number").appendField("blue");
        this.setOutput(true, "String");
        this.setColour(20);
        this.setTooltip(
          "Create a colour from red, green and blue components (0-255)",
        );
      },
    } as any;
  }

  // Extra handy text helpers
  if (!Blockly.Blocks["text_contains"]) {
    Blockly.Blocks["text_contains"] = {
      init() {
        this.appendValueInput("TEXT").setCheck("String").appendField("text");
        this.appendValueInput("SEARCH").setCheck("String").appendField("contains");
        this.setOutput(true, "Boolean");
        this.setColour(160);
        this.setTooltip("Return true if text contains the search string");
      },
    } as any;
  }

  if (!Blockly.Blocks["text_startswith"]) {
    Blockly.Blocks["text_startswith"] = {
      init() {
        this.appendValueInput("TEXT").setCheck("String").appendField("text");
        this.appendValueInput("SEARCH").setCheck("String").appendField("starts with");
        this.setOutput(true, "Boolean");
        this.setColour(160);
        this.setTooltip("Return true if text starts with the search string");
      },
    } as any;
  }

  if (!Blockly.Blocks["text_endswith"]) {
    Blockly.Blocks["text_endswith"] = {
      init() {
        this.appendValueInput("TEXT").setCheck("String").appendField("text");
        this.appendValueInput("SEARCH").setCheck("String").appendField("ends with");
        this.setOutput(true, "Boolean");
        this.setColour(160);
        this.setTooltip("Return true if text ends with the search string");
      },
    } as any;
  }

  // List helpers
  if (!Blockly.Blocks["lists_append"]) {
    Blockly.Blocks["lists_append"] = {
      init() {
        this.appendValueInput("LIST").setCheck("Array").appendField("append to list");
        this.appendValueInput("ITEM").setCheck(null).appendField("item");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(260);
        this.setTooltip("Append item to a list (modifies the list)");
      },
    } as any;
  }

  if (!Blockly.Blocks["lists_remove_at"]) {
    Blockly.Blocks["lists_remove_at"] = {
      init() {
        this.appendValueInput("LIST").setCheck("Array").appendField("remove at index from list");
        this.appendValueInput("INDEX").setCheck("Number").appendField("index");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(260);
        this.setTooltip("Remove item at index from list");
      },
    } as any;
  }

  if (!Blockly.Blocks["lists_index_of"]) {
    Blockly.Blocks["lists_index_of"] = {
      init() {
        this.appendValueInput("LIST").setCheck("Array").appendField("index of");
        this.appendValueInput("ITEM").setCheck(null).appendField("item");
        this.setOutput(true, "Number");
        this.setColour(260);
        this.setTooltip("Return index of item in list or -1 if not found");
      },
    } as any;
  }

  // Maps (dictionaries)
  if (!Blockly.Blocks["maps_create_with"]) {
    Blockly.Blocks["maps_create_with"] = {
      init() {
        this.appendDummyInput().appendField("create map");
        this.setOutput(true, "Map");
        this.setColour(290);
        this.setTooltip("Create a new map/dictionary");
      },
    } as any;
  }

  if (!Blockly.Blocks["map_put"]) {
    Blockly.Blocks["map_put"] = {
      init() {
        this.appendValueInput("MAP").setCheck("Map").appendField("put");
        this.appendValueInput("KEY").setCheck(null).appendField("key");
        this.appendValueInput("VALUE").setCheck(null).appendField("value");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(290);
        this.setTooltip("Put key/value into map");
      },
    } as any;
  }

  if (!Blockly.Blocks["map_get"]) {
    Blockly.Blocks["map_get"] = {
      init() {
        this.appendValueInput("MAP").setCheck("Map").appendField("get from map");
        this.appendValueInput("KEY").setCheck(null).appendField("key");
        this.setOutput(true, null);
        this.setColour(290);
        this.setTooltip("Get value from map by key (or null)");
      },
    } as any;
  }

  // Trigonometry helper (fallback)
  if (!Blockly.Blocks["math_trig_simple"]) {
    Blockly.Blocks["math_trig_simple"] = {
      init() {
        this.appendValueInput("NUM").setCheck("Number");
        this.appendDummyInput()
          .appendField(new Blockly.FieldDropdown([
            ["sin", "SIN"],
            ["cos", "COS"],
            ["tan", "TAN"],
            ["toDegrees", "TO_DEG"],
            ["toRadians", "TO_RAD"],
          ]), "OP");
        this.setOutput(true, "Number");
        this.setColour(230);
        this.setTooltip("Basic trigonometry and conversions");
      },
    } as any;
  }

  // Advanced: HTTP, JSON, threading, timers and file helpers
  if (!Blockly.Blocks["http_get"]) {
    Blockly.Blocks["http_get"] = {
      init() {
        this.appendValueInput("URL").setCheck("String").appendField("HTTP GET");
        this.appendStatementInput("ON_SUCCESS").appendField("on success");
        this.appendStatementInput("ON_ERROR").appendField("on error");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(20);
        this.setTooltip("Perform an HTTP GET request in background and run handlers");
      },
    } as any;
  }

  if (!Blockly.Blocks["json_parse"]) {
    Blockly.Blocks["json_parse"] = {
      init() {
        this.appendValueInput("TEXT").setCheck("String").appendField("parse JSON");
        this.setOutput(true, "Map");
        this.setColour(290);
        this.setTooltip("Parse JSON string into an object");
      },
    } as any;
  }

  if (!Blockly.Blocks["json_get"]) {
    Blockly.Blocks["json_get"] = {
      init() {
        this.appendValueInput("JSON").setCheck(null).appendField("json");
        this.appendValueInput("KEY").setCheck(null).appendField("get key");
        this.setOutput(true, null);
        this.setColour(290);
        this.setTooltip("Get value from JSON object by key");
      },
    } as any;
  }

  if (!Blockly.Blocks["thread_run"]) {
    Blockly.Blocks["thread_run"] = {
      init() {
        this.appendStatementInput("DO").appendField("run in background");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(330);
        this.setTooltip("Run statements in a background thread");
      },
    } as any;
  }

  if (!Blockly.Blocks["timer_delay"]) {
    Blockly.Blocks["timer_delay"] = {
      init() {
        this.appendDummyInput().appendField("delay (ms)").appendField(new Blockly.FieldNumber(1000, 0, 9999999, 100), "MS");
        this.appendStatementInput("DO").appendField("after delay");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(330);
        this.setTooltip("Run statements after a delay (non-blocking)");
      },
    } as any;
  }

  if (!Blockly.Blocks["file_write"]) {
    Blockly.Blocks["file_write"] = {
      init() {
        this.appendValueInput("PATH").setCheck("String").appendField("write file");
        this.appendValueInput("CONTENT").setCheck("String").appendField("content");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(200);
        this.setTooltip("Write string content to a file path (internal storage)");
      },
    } as any;
  }

  if (!Blockly.Blocks["file_read"]) {
    Blockly.Blocks["file_read"] = {
      init() {
        this.appendValueInput("PATH").setCheck("String").appendField("read file");
        this.setOutput(true, "String");
        this.setColour(200);
        this.setTooltip("Read file content (returns string) or null");
      },
    } as any;
  }

  if (!Blockly.Blocks["base64_encode"]) {
    Blockly.Blocks["base64_encode"] = {
      init() {
        this.appendValueInput("TEXT").setCheck("String").appendField("base64 encode");
        this.setOutput(true, "String");
        this.setColour(40);
        this.setTooltip("Encode text to Base64");
      },
    } as any;
  }

  if (!Blockly.Blocks["base64_decode"]) {
    Blockly.Blocks["base64_decode"] = {
      init() {
        this.appendValueInput("TEXT").setCheck("String").appendField("base64 decode");
        this.setOutput(true, "String");
        this.setColour(40);
        this.setTooltip("Decode Base64 to text");
      },
    } as any;
  }

  // End advanced blocks
  if (!Blockly.Blocks["text_contains"]) {
    Blockly.Blocks["text_contains"] = {
      init() {
        this.appendValueInput("TEXT").setCheck("String").appendField("text");
        this.appendValueInput("SEARCH").setCheck("String").appendField("contains");
        this.setOutput(true, "Boolean");
        this.setColour(160);
        this.setTooltip("Return true if text contains the search string");
      },
    } as any;
  }

  if (!Blockly.Blocks["text_startswith"]) {
    Blockly.Blocks["text_startswith"] = {
      init() {
        this.appendValueInput("TEXT").setCheck("String").appendField("text");
        this.appendValueInput("SEARCH").setCheck("String").appendField("starts with");
        this.setOutput(true, "Boolean");
        this.setColour(160);
        this.setTooltip("Return true if text starts with the search string");
      },
    } as any;
  }

  if (!Blockly.Blocks["text_endswith"]) {
    Blockly.Blocks["text_endswith"] = {
      init() {
        this.appendValueInput("TEXT").setCheck("String").appendField("text");
        this.appendValueInput("SEARCH").setCheck("String").appendField("ends with");
        this.setOutput(true, "Boolean");
        this.setColour(160);
        this.setTooltip("Return true if text ends with the search string");
      },
    } as any;
  }

  // List helpers
  if (!Blockly.Blocks["lists_append"]) {
    Blockly.Blocks["lists_append"] = {
      init() {
        this.appendValueInput("LIST").setCheck("Array").appendField("append to list");
        this.appendValueInput("ITEM").setCheck(null).appendField("item");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(260);
        this.setTooltip("Append item to a list (modifies the list)");
      },
    } as any;
  }

  if (!Blockly.Blocks["lists_remove_at"]) {
    Blockly.Blocks["lists_remove_at"] = {
      init() {
        this.appendValueInput("LIST").setCheck("Array").appendField("remove at index from list");
        this.appendValueInput("INDEX").setCheck("Number").appendField("index");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(260);
        this.setTooltip("Remove item at index from list");
      },
    } as any;
  }

  if (!Blockly.Blocks["lists_index_of"]) {
    Blockly.Blocks["lists_index_of"] = {
      init() {
        this.appendValueInput("LIST").setCheck("Array").appendField("index of");
        this.appendValueInput("ITEM").setCheck(null).appendField("item");
        this.setOutput(true, "Number");
        this.setColour(260);
        this.setTooltip("Return index of item in list or -1 if not found");
      },
    } as any;
  }

  // Maps (dictionaries)
  if (!Blockly.Blocks["maps_create_with"]) {
    Blockly.Blocks["maps_create_with"] = {
      init() {
        this.appendDummyInput().appendField("create map");
        this.setOutput(true, "Map");
        this.setColour(290);
        this.setTooltip("Create a new map/dictionary");
      },
    } as any;
  }

  if (!Blockly.Blocks["map_put"]) {
    Blockly.Blocks["map_put"] = {
      init() {
        this.appendValueInput("MAP").setCheck("Map").appendField("put");
        this.appendValueInput("KEY").setCheck(null).appendField("key");
        this.appendValueInput("VALUE").setCheck(null).appendField("value");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(290);
        this.setTooltip("Put key/value into map");
      },
    } as any;
  }

  if (!Blockly.Blocks["map_get"]) {
    Blockly.Blocks["map_get"] = {
      init() {
        this.appendValueInput("MAP").setCheck("Map").appendField("get from map");
        this.appendValueInput("KEY").setCheck(null).appendField("key");
        this.setOutput(true, null);
        this.setColour(290);
        this.setTooltip("Get value from map by key (or null)");
      },
    } as any;
  }

  // Trigonometry helper (fallback)
  if (!Blockly.Blocks["math_trig_simple"]) {
    Blockly.Blocks["math_trig_simple"] = {
      init() {
        this.appendValueInput("NUM").setCheck("Number");
        this.appendDummyInput()
          .appendField(new Blockly.FieldDropdown([
            ["sin", "SIN"],
            ["cos", "COS"],
            ["tan", "TAN"],
            ["toDegrees", "TO_DEG"],
            ["toRadians", "TO_RAD"],
          ]), "OP");
        this.setOutput(true, "Number");
        this.setColour(230);
        this.setTooltip("Basic trigonometry and conversions");
      },
    } as any;
  }
  // Date & Time
  if (!Blockly.Blocks["date_current_millis"]) {
    Blockly.Blocks["date_current_millis"] = {
      init() {
        this.appendDummyInput().appendField("Date: Current Millis");
        this.setOutput(true, "Number");
        this.setColour(190);
        this.setTooltip("Get current time in milliseconds");
      },
    } as any;
  }

  if (!Blockly.Blocks["date_format"]) {
    Blockly.Blocks["date_format"] = {
      init() {
        this.appendValueInput("MILLIS").setCheck("Number").appendField("Date: Format");
        this.appendValueInput("PATTERN").setCheck("String").appendField("Pattern");
        this.setOutput(true, "String");
        this.setColour(190);
        this.setTooltip("Format milliseconds to date string (e.g. pattern 'yyyy-MM-dd HH:mm:ss')");
      },
    } as any;
  }

  if (!Blockly.Blocks["date_parse"]) {
    Blockly.Blocks["date_parse"] = {
      init() {
        this.appendValueInput("DATE").setCheck("String").appendField("Date: Parse");
        this.appendValueInput("PATTERN").setCheck("String").appendField("Pattern");
        this.setOutput(true, "Number");
        this.setColour(190);
        this.setTooltip("Parse date string to milliseconds");
      },
    } as any;
  }

  // Device Info
  if (!Blockly.Blocks["device_info"]) {
    Blockly.Blocks["device_info"] = {
      init() {
        this.appendDummyInput()
          .appendField("Device: Info")
          .appendField(new Blockly.FieldDropdown([
            ["Model", "MODEL"],
            ["Manufacturer", "MANUFACTURER"],
            ["Android Version", "ANDROID_VERSION"],
            ["SDK Level", "SDK_LEVEL"],
            ["Board", "BOARD"],
            ["Brand", "BRAND"],
            ["Device", "DEVICE"],
            ["Product", "PRODUCT"]
          ]), "INFO");
        this.setOutput(true, "String");
        this.setColour(30);
        this.setTooltip("Get device information");
      },
    } as any;
  }

  // Crypto
  if (!Blockly.Blocks["crypto_hash"]) {
    Blockly.Blocks["crypto_hash"] = {
      init() {
        this.appendValueInput("TEXT").setCheck("String").appendField("Crypto: Hash");
        this.appendDummyInput()
          .appendField(new Blockly.FieldDropdown([
            ["MD5", "MD5"],
            ["SHA-1", "SHA-1"],
            ["SHA-256", "SHA-256"],
            ["SHA-512", "SHA-512"]
          ]), "ALGO");
        this.setOutput(true, "String");
        this.setColour(290);
        this.setTooltip("Calculate hash of text");
      },
    } as any;
  }

  // Regex
  if (!Blockly.Blocks["regex_match"]) {
    Blockly.Blocks["regex_match"] = {
      init() {
        this.appendValueInput("TEXT").setCheck("String").appendField("Regex: Match");
        this.appendValueInput("PATTERN").setCheck("String").appendField("Pattern");
        this.setOutput(true, "Boolean");
        this.setColour(160);
        this.setTooltip("Check if text matches regex pattern");
      },
    } as any;
  }

  if (!Blockly.Blocks["regex_replace"]) {
    Blockly.Blocks["regex_replace"] = {
      init() {
        this.appendValueInput("TEXT").setCheck("String").appendField("Regex: Replace");
        this.appendValueInput("PATTERN").setCheck("String").appendField("Pattern");
        this.appendValueInput("REPLACEMENT").setCheck("String").appendField("Replacement");
        this.setOutput(true, "String");
        this.setColour(160);
        this.setTooltip("Replace all occurrences of regex pattern");
      },
    } as any;
  }

  // String Utils
  if (!Blockly.Blocks["text_reverse"]) {
    Blockly.Blocks["text_reverse"] = {
      init() {
        this.appendValueInput("TEXT").setCheck("String").appendField("Text: Reverse");
        this.setOutput(true, "String");
        this.setColour(160);
        this.setTooltip("Reverse the text");
      },
    } as any;
  }

  if (!Blockly.Blocks["text_trim"]) {
    Blockly.Blocks["text_trim"] = {
      init() {
        this.appendValueInput("TEXT").setCheck("String").appendField("Text: Trim");
        this.setOutput(true, "String");
        this.setColour(160);
        this.setTooltip("Remove whitespace from both ends");
      },
    } as any;
  }

  // Raw Java Code (Customization)
  // Raw Java Code (Customization) - Fixed to use standard input to prevent crashes
  if (!Blockly.Blocks["ai2_custom_code"]) {
    Blockly.Blocks["ai2_custom_code"] = {
      init() {
        this.appendDummyInput()
          .appendField("Raw Java Statement")
          .appendField(new Blockly.FieldTextInput("System.out.println(\"test\");"), "CODE");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(0);
        this.setTooltip("Inject a raw Java statement line.");
      },
    } as any;
  }

  // Raw Java Expression (Limitless Value)
  if (!Blockly.Blocks["ai2_custom_expression"]) {
    Blockly.Blocks["ai2_custom_expression"] = {
      init() {
        this.appendDummyInput()
          .appendField("Raw Java Expression")
          .appendField(new Blockly.FieldTextInput("1 + 1"), "CODE");
        this.setOutput(true, null);
        this.setColour(0);
        this.setTooltip("Inject raw Java code that returns a value.");
      },
    } as any;
  }

  // Native Method Call (Limitless)
  if (!Blockly.Blocks["native_call"]) {
    Blockly.Blocks["native_call"] = {
      init() {
        this.appendValueInput("TARGET").setCheck(null).appendField("Call Native");
        this.appendDummyInput().appendField(".").appendField(new Blockly.FieldTextInput("methodName"), "METHOD");
        this.appendValueInput("ARGS").setCheck("Array").appendField("Args (List)");
        this.setOutput(true, null);
        this.setColour(290);
        this.setTooltip("Call ANY method on ANY object. Use Create List for args.");
      },
    } as any;
  }

  // Native Field Get
  if (!Blockly.Blocks["native_field_get"]) {
    Blockly.Blocks["native_field_get"] = {
      init() {
        this.appendValueInput("TARGET").setCheck(null).appendField("Get Field");
        this.appendDummyInput().appendField(".").appendField(new Blockly.FieldTextInput("fieldName"), "FIELD");
        this.setOutput(true, null);
        this.setColour(290);
        this.setTooltip("Access ANY field on ANY object.");
      },
    } as any;
  }

  // Native Field Set
  if (!Blockly.Blocks["native_field_set"]) {
    Blockly.Blocks["native_field_set"] = {
      init() {
        this.appendValueInput("TARGET").setCheck(null).appendField("Set Field");
        this.appendDummyInput().appendField(".").appendField(new Blockly.FieldTextInput("fieldName"), "FIELD");
        this.appendValueInput("VALUE").setCheck(null).appendField("to");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(290);
        this.setTooltip("Set ANY field on ANY object.");
      },
    } as any;
  }

  // Toast
  if (!Blockly.Blocks["toast_show"]) {
    Blockly.Blocks["toast_show"] = {
      init() {
        this.appendValueInput("MESSAGE").setCheck(null).appendField("Show Toast");
        this.appendDummyInput().appendField("Duration").appendField(new Blockly.FieldDropdown([["Short", "0"], ["Long", "1"]]), "DURATION");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#F59E0B");
        this.setTooltip("Show a toast message");
      },
    } as any;
  }

  // Clipboard
  if (!Blockly.Blocks["clipboard_copy"]) {
    Blockly.Blocks["clipboard_copy"] = {
      init() {
        this.appendValueInput("TEXT").setCheck(null).appendField("Copy to Clipboard");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#A52A2A"); // Brown/Reddish
        this.setTooltip("Copy text to system clipboard");
      },
    } as any;
  }

  // Intent Open
  if (!Blockly.Blocks["intent_open"]) {
    Blockly.Blocks["intent_open"] = {
      init() {
        this.appendValueInput("URL").setCheck(null).appendField("Open URL");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#06B6D4");
        this.setTooltip("Open a URL in browser");
      },
    } as any;
  }

  // Vibrator
  if (!Blockly.Blocks["vibrator_vibrate"]) {
    Blockly.Blocks["vibrator_vibrate"] = {
      init() {
        this.appendValueInput("MS").setCheck("Number").appendField("Vibrate (ms)");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#E91E63");
        this.setTooltip("Vibrate the device");
      },
    } as any;
  }

  // SharedPreferences (Storage)
  if (!Blockly.Blocks["prefs_store"]) {
    Blockly.Blocks["prefs_store"] = {
      init() {
        this.appendDummyInput().appendField("Storage: Store");
        this.appendValueInput("KEY").setCheck("String").appendField("Key");
        this.appendValueInput("VALUE").setCheck(null).appendField("Value");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#795548");
        this.setTooltip("Save value to SharedPreferences");
      },
    } as any;
  }

  if (!Blockly.Blocks["prefs_get"]) {
    Blockly.Blocks["prefs_get"] = {
      init() {
        this.appendDummyInput().appendField("Storage: Get");
        this.appendValueInput("KEY").setCheck("String").appendField("Key");
        this.appendValueInput("DEFAULT").setCheck(null).appendField("Default");
        this.setOutput(true, null);
        this.setColour("#795548");
        this.setTooltip("Get value from SharedPreferences");
      },
    } as any;
  }

  // Network
  if (!Blockly.Blocks["network_get"]) {
    Blockly.Blocks["network_get"] = {
      init() {
        this.appendValueInput("URL").setCheck("String").appendField("Network: Get (Sync)");
        this.setOutput(true, "String");
        this.setColour("#3F51B5");
        this.setTooltip("Perform a synchronous GET request (Use in Async Context!)");
      },
    } as any;
  }

  if (!Blockly.Blocks["network_post"]) {
    Blockly.Blocks["network_post"] = {
      init() {
        this.appendValueInput("URL").setCheck("String").appendField("Network: Post");
        this.appendValueInput("BODY").setCheck("String").appendField("Body");
        this.setOutput(true, "String");
        this.setColour("#3F51B5");
        this.setTooltip("Perform a synchronous POST request with string body");
      },
    } as any;
  }

  // Logic
  if (!Blockly.Blocks["logic_ternary"]) {
    Blockly.Blocks["logic_ternary"] = {
      init() {
        this.appendValueInput("IF").setCheck("Boolean").appendField("if");
        this.appendValueInput("THEN").setCheck(null).appendField("then");
        this.appendValueInput("ELSE").setCheck(null).appendField("else");
        this.setOutput(true, null);
        this.setColour("%{BKY_LOGIC_HUE}");
        this.setTooltip("Ternary operator (condition ? trueVal : falseVal)");
      },
    } as any;
  }

  // Text Replace
  if (!Blockly.Blocks["text_replace_all"]) {
    Blockly.Blocks["text_replace_all"] = {
      init() {
        this.appendValueInput("TEXT").setCheck("String").appendField("Text: Replace All");
        this.appendValueInput("REGEX").setCheck("String").appendField("Regex");
        this.appendValueInput("REPLACEMENT").setCheck("String").appendField("Replacement");
        this.setOutput(true, "String");
        this.setColour("#4CAF50"); // Text category usually green
        this.setTooltip("Replace all occurrences matching regex");
      },
    } as any;
  }

  // Device Info
  if (!Blockly.Blocks["device_info"]) {
    Blockly.Blocks["device_info"] = {
      init() {
        this.appendDummyInput().appendField("Device Info (SDK/Model)");
        this.setOutput(true, "String");
        this.setColour("#607D8B");
        this.setTooltip("Returns a JSON string of device info");
      },
    } as any;
  }

  // JSON
  if (!Blockly.Blocks["json_parse"]) {
    Blockly.Blocks["json_parse"] = {
      init() {
        this.appendValueInput("JSON").setCheck("String").appendField("JSON Parse");
        this.setOutput(true, null); // Returns Object or Array
        this.setColour("#FF9800");
        this.setTooltip("Parse JSON string to Object/List");
      },
    } as any;
  }

  // File
  if (!Blockly.Blocks["file_write"]) {
    Blockly.Blocks["file_write"] = {
      init() {
        this.appendValueInput("FILENAME").setCheck("String").appendField("File: Write");
        this.appendValueInput("TEXT").setCheck("String").appendField("Text");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#9C27B0");
        this.setTooltip("Write text to a file (in private storage)");
      },
    } as any;
  }

  if (!Blockly.Blocks["file_read"]) {
    Blockly.Blocks["file_read"] = {
      init() {
        this.appendValueInput("FILENAME").setCheck("String").appendField("File: Read");
        this.setOutput(true, "String");
        this.setColour("#9C27B0");
        this.setTooltip("Read text from a file (in private storage)");
      },
    } as any;
  }
}
