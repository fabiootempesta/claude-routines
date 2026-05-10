import { describe, expect, it } from "vitest";
import { buildClaudeCommand, buildClaudeResumeCommand } from "../src/server/runner";

describe("buildClaudeCommand", () => {
  it("builds a non-interactive Claude command with bypass flags and a session id (no effort)", () => {
    const command = buildClaudeCommand("019e0dc0-bc6d-7c32-8520-2f1130559c89", null);

    expect(command.file).toBe("claude");
    expect(command.args).toEqual([
      "-p",
      "--dangerously-skip-permissions",
      "--session-id",
      "019e0dc0-bc6d-7c32-8520-2f1130559c89",
      "--output-format",
      "text",
      "--verbose"
    ]);
  });

  it("includes the --effort flag when an effort is set", () => {
    const command = buildClaudeCommand("019e0dc0-bc6d-7c32-8520-2f1130559c89", "high");

    expect(command.args).toEqual([
      "-p",
      "--dangerously-skip-permissions",
      "--session-id",
      "019e0dc0-bc6d-7c32-8520-2f1130559c89",
      "--effort",
      "high",
      "--output-format",
      "text",
      "--verbose"
    ]);
  });

  it("builds a non-interactive Claude resume command for a previous session", () => {
    const command = buildClaudeResumeCommand("019e0dc0-bc6d-7c32-8520-2f1130559c89", "max");

    expect(command.file).toBe("claude");
    expect(command.args).toEqual([
      "-p",
      "--dangerously-skip-permissions",
      "--resume",
      "019e0dc0-bc6d-7c32-8520-2f1130559c89",
      "--effort",
      "max",
      "--output-format",
      "text",
      "--verbose"
    ]);
  });
});
