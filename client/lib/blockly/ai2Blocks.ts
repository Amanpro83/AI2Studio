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
    } as Blockly.BlockDefinition;
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
    } as Blockly.BlockDefinition;
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
    } as Blockly.BlockDefinition;
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
    } as Blockly.BlockDefinition;
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
  } as Blockly.BlockDefinition;

  // Return statement (AI2)
  Blockly.Blocks["ai2_return"] = {
    init() {
      this.appendValueInput("VALUE").setCheck(null).appendField("Return");
      this.setPreviousStatement(true, null);
      this.setColour(65);
      this.setTooltip("Return a value from a method");
      this.setHelpUrl("");
    },
  } as Blockly.BlockDefinition;

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
  } as Blockly.BlockDefinition;

  // Convenience lists helper (if not present)
  if (!Blockly.Blocks["lists_create_with"]) {
    Blockly.Blocks["lists_create_with"] = {
      init() {
        this.appendDummyInput().appendField("create list with items");
        this.setOutput(true, "Array");
        this.setColour(260);
        this.setTooltip("Create a list with items");
      },
    } as Blockly.BlockDefinition;
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
    } as Blockly.BlockDefinition;
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
    } as Blockly.BlockDefinition;
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
  } as Blockly.BlockDefinition;

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
  } as Blockly.BlockDefinition;

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
  } as Blockly.BlockDefinition;

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
    } as Blockly.BlockDefinition;
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
  } as Blockly.BlockDefinition;

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
    } as Blockly.BlockDefinition;
  }
  if (!Blockly.Blocks["colour_random"]) {
    Blockly.Blocks["colour_random"] = {
      init() {
        this.appendDummyInput().appendField("random colour");
        this.setOutput(true, "String");
        this.setColour(20);
        this.setTooltip("Get a random colour (hex)");
      },
    } as Blockly.BlockDefinition;
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
    } as Blockly.BlockDefinition;
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
    } as Blockly.BlockDefinition;
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
    } as Blockly.BlockDefinition;
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
    } as Blockly.BlockDefinition;
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
    } as Blockly.BlockDefinition;
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
    } as Blockly.BlockDefinition;
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
    } as Blockly.BlockDefinition;
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
    } as Blockly.BlockDefinition;
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
    } as Blockly.BlockDefinition;
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
    } as Blockly.BlockDefinition;
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
    } as Blockly.BlockDefinition;
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
    } as Blockly.BlockDefinition;
  }

  if (!Blockly.Blocks["json_parse"]) {
    Blockly.Blocks["json_parse"] = {
      init() {
        this.appendValueInput("TEXT").setCheck("String").appendField("parse JSON");
        this.setOutput(true, "Map");
        this.setColour(290);
        this.setTooltip("Parse JSON string into an object");
      },
    } as Blockly.BlockDefinition;
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
    } as Blockly.BlockDefinition;
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
    } as Blockly.BlockDefinition;
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
    } as Blockly.BlockDefinition;
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
    } as Blockly.BlockDefinition;
  }

  if (!Blockly.Blocks["file_read"]) {
    Blockly.Blocks["file_read"] = {
      init() {
        this.appendValueInput("PATH").setCheck("String").appendField("read file");
        this.setOutput(true, "String");
        this.setColour(200);
        this.setTooltip("Read file content (returns string) or null");
      },
    } as Blockly.BlockDefinition;
  }

  if (!Blockly.Blocks["base64_encode"]) {
    Blockly.Blocks["base64_encode"] = {
      init() {
        this.appendValueInput("TEXT").setCheck("String").appendField("base64 encode");
        this.setOutput(true, "String");
        this.setColour(40);
        this.setTooltip("Encode text to Base64");
      },
    } as Blockly.BlockDefinition;
  }

  if (!Blockly.Blocks["base64_decode"]) {
    Blockly.Blocks["base64_decode"] = {
      init() {
        this.appendValueInput("TEXT").setCheck("String").appendField("base64 decode");
        this.setOutput(true, "String");
        this.setColour(40);
        this.setTooltip("Decode Base64 to text");
      },
    } as Blockly.BlockDefinition;
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
    } as Blockly.BlockDefinition;
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
    } as Blockly.BlockDefinition;
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
    } as Blockly.BlockDefinition;
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
    } as Blockly.BlockDefinition;
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
    } as Blockly.BlockDefinition;
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
    } as Blockly.BlockDefinition;
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
    } as Blockly.BlockDefinition;
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
    } as Blockly.BlockDefinition;
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
    } as Blockly.BlockDefinition;
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
    } as Blockly.BlockDefinition;
  }
}
