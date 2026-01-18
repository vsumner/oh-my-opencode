/**
 * BDD-style tests for orchestrator constants module.
 * Follows #given/#when/#then pattern.
 */

import { describe, it, expect } from "bun:test";

import { DEFAULT_MODELS, type DefaultModel } from "./orchestrator-constants";

describe("orchestrator-constants", () => {
  describe("DEFAULT_MODELS", () => {
    it("should export constant object with all agent defaults", () => {
      // #given: A constant object DEFAULT_MODELS exists
      // #when: Accessing the exported constant
      
      // #then: It should contain all required agent model defaults
      expect(DEFAULT_MODELS).toBeDefined();
      expect(DEFAULT_MODELS).toBeTypeOf("object");
    });

    it("should have correct orchestrator model", () => {
      // #given: DEFAULT_MODELS constant is exported
      
      // #when: Accessing ORCHESTRATOR property
      
      // #then: It should match the hardcoded value from orchestrator-sisyphus.ts
      expect(DEFAULT_MODELS.ORCHESTRATOR).toBe("anthropic/claude-opus-4-5");
    });

    it("should have correct sisyphus model", () => {
      // #given: DEFAULT_MODELS constant is exported
      
      // #when: Accessing SISYPHUS property
      
      // #then: It should match the hardcoded value from sisyphus.ts
      expect(DEFAULT_MODELS.SISYPHUS).toBe("anthropic/claude-opus-4-5");
    });

    it("should have correct oracle model", () => {
      // #given: DEFAULT_MODELS constant is exported
      
      // #when: Accessing ORACLE property
      
      // #then: It should match the hardcoded value from oracle.ts
      expect(DEFAULT_MODELS.ORACLE).toBe("openai/gpt-5.2");
    });

    it("should have correct librarian model", () => {
      // #given: DEFAULT_MODELS constant is exported
      
      // #when: Accessing LIBRARIAN property
      
      // #then: It should match the hardcoded value from librarian.ts
      expect(DEFAULT_MODELS.LIBRARIAN).toBe("opencode/glm-4.7-free");
    });

    it("should have correct explore model", () => {
      // #given: DEFAULT_MODELS constant is exported
      
      // #when: Accessing EXPLORE property
      
      // #then: It should match the hardcoded value from explore.ts
      expect(DEFAULT_MODELS.EXPLORE).toBe("opencode/grok-code");
    });

    it("should have correct frontend-ui-ux-engineer model", () => {
      // #given: DEFAULT_MODELS constant is exported
      
      // #when: Accessing FRONTEND_UI_UX_ENGINEER property
      
      // #then: It should match the hardcoded value from frontend-ui-ux-engineer.ts
      expect(DEFAULT_MODELS.FRONTEND_UI_UX_ENGINEER).toBe("google/gemini-3-pro-preview");
    });

    it("should have correct document-writer model", () => {
      // #given: DEFAULT_MODELS constant is exported
      
      // #when: Accessing DOCUMENT_WRITER property
      
      // #then: It should match the hardcoded value from document-writer.ts
      expect(DEFAULT_MODELS.DOCUMENT_WRITER).toBe("google/gemini-3-flash");
    });

    it("should have correct multimodal-looker model", () => {
      // #given: DEFAULT_MODELS constant is exported
      
      // #when: Accessing MULTIMODAL_LOOKER property
      
      // #then: It should match the hardcoded value from multimodal-looker.ts
      expect(DEFAULT_MODELS.MULTIMODAL_LOOKER).toBe("google/gemini-3-flash");
    });

    it("should have correct prometheus model", () => {
      // #given: DEFAULT_MODELS constant is exported
      
      // #when: Accessing PROMETHEUS property
      
      // #then: It should match the hardcoded value from prometheus-prompt.ts
      expect(DEFAULT_MODELS.PROMETHEUS).toBe("anthropic/claude-opus-4-5");
    });

    it("should have correct metis model", () => {
      // #given: DEFAULT_MODELS constant is exported
      
      // #when: Accessing METIS property
      
      // #then: It should match the hardcoded value from metis.ts
      expect(DEFAULT_MODELS.METIS).toBe("anthropic/claude-sonnet-4-5");
    });

    it("should have correct momus model", () => {
      // #given: DEFAULT_MODELS constant is exported
      
      // #when: Accessing MOMUS property
      
      // #then: It should match the hardcoded value from momus.ts
      expect(DEFAULT_MODELS.MOMUS).toBe("anthropic/claude-sonnet-4-5");
    });

    it("should have correct build model", () => {
      // #given: DEFAULT_MODELS constant is exported
      
      // #when: Accessing BUILD property
      
      // #then: It should match the hardcoded value from build-prompt.ts
      expect(DEFAULT_MODELS.BUILD).toBe("anthropic/claude-opus-4-5");
    });

    it("should have correct plan model", () => {
      // #given: DEFAULT_MODELS constant is exported
      
      // #when: Accessing PLAN property
      
      // #then: It should match the hardcoded value from plan-prompt.ts
      expect(DEFAULT_MODELS.PLAN).toBe("anthropic/claude-opus-4-5");
    });
  });

  describe("DefaultModel type", () => {
    it("should be a valid key type", () => {
      // #given: DefaultModel type is exported
      
      // #when: Using it as a type
      
      // #then: It should work correctly
      const testKey: DefaultModel = "SISYPHUS";
      expect(testKey).toBe("SISYPHUS");
    });
  });

  describe("import/export patterns", () => {
    it("should export all constants", () => {
      // #given: The orchestrator-constants module is imported
      
      // #when: Checking exports
      
      // #then: All constants should be available
      expect(typeof DEFAULT_MODELS).toBe("object");
      expect(Object.keys(DEFAULT_MODELS).length).toBeGreaterThan(0);
    });
  });
});
