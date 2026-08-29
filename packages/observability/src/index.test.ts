import { describe, expect, it } from "vitest";
import { redactFields } from "./index.js";

describe("observability redaction", () => {
  it("redacts common secret and content fields", () => {
    expect(
      redactFields({
        request_id: "r-1",
        prompt: "private",
        authorization: "token",
        nested: {
          config: { password: "private", safe: "visible" },
          messages: [{ content: "private" }],
        },
      }),
    ).toEqual({
      request_id: "r-1",
      prompt: "[redacted]",
      authorization: "[redacted]",
      nested: {
        config: { password: "[redacted]", safe: "visible" },
        messages: [{ content: "[redacted]" }],
      },
    });
  });

  it("handles circular values and does not expose error messages", () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    expect(redactFields({ circular, error: new Error("private detail") })).toEqual({
      circular: { self: "[circular]" },
      error: { name: "Error", message: "[redacted error message]" },
    });
  });
});
