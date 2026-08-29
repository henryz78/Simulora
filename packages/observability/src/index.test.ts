import { describe, expect, it } from "vitest";
import { redactFields } from "./index.js";

describe("observability redaction", () => {
  it("redacts common secret and content fields", () => {
    expect(redactFields({ request_id: "r-1", prompt: "private", authorization: "token" })).toEqual({
      request_id: "r-1",
      prompt: "[redacted]",
      authorization: "[redacted]",
    });
  });
});
