import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { JsonStore } from "../src/server/store";
import type { CreateTaskInput } from "../src/server/types";

const TEST_SESSION_ID = "019e0dc0-bc6d-7c32-8520-2f1130559c89";

let tempDir: string;
let store: JsonStore;

describe("execution recovery state", () => {
  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), "claude-routines-store-"));
    store = new JsonStore(path.join(tempDir, "db.json"));
    await store.init();
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it("tracks output activity via lastOutputAt without scraping anything from the stream", async () => {
    const task = await store.createTask(taskInput());
    const execution = await store.createExecution({
      task,
      trigger: "manual",
      command: ["claude", "-p"],
      sessionId: TEST_SESSION_ID,
      effort: null,
      model: null
    });

    const originalLastOutputAt = execution.lastOutputAt;
    await new Promise((resolve) => setTimeout(resolve, 2));
    await store.appendExecutionOutput(execution.id, "stdout", "doing work...\n");

    const updated = store.getExecution(execution.id);
    expect(updated?.lastOutputAt).not.toBe(originalLastOutputAt);
    expect(updated?.stdout).toBe("doing work...\n");
    expect(updated?.sessionId).toBe(TEST_SESSION_ID);
  });

  it("marks untracked running executions as stale instead of leaving them running forever", async () => {
    const task = await store.createTask(taskInput());
    const execution = await store.createExecution({
      task,
      trigger: "manual",
      command: ["claude", "-p"],
      sessionId: TEST_SESSION_ID,
      effort: "high",
      model: null
    });

    const stale = await store.markUntrackedRunningExecutions(new Set(), new Date("2026-05-09T18:30:00.000Z"));

    expect(stale.map((item) => item.id)).toEqual([execution.id]);
    const updated = store.getExecution(execution.id);
    expect(updated?.status).toBe("stale");
    expect(updated?.staleAt).toBe("2026-05-09T18:30:00.000Z");
    expect(updated?.error).toContain("Orphaned");
    expect(updated?.effort).toBe("high");
  });

  it("does not mark executions that are still tracked by the scheduler", async () => {
    const task = await store.createTask(taskInput());
    const execution = await store.createExecution({
      task,
      trigger: "manual",
      command: ["claude", "-p"],
      sessionId: TEST_SESSION_ID,
      effort: null,
      model: null
    });

    const stale = await store.markUntrackedRunningExecutions(new Set([execution.id]), new Date("2026-05-09T18:30:00.000Z"));

    expect(stale).toEqual([]);
    expect(store.getExecution(execution.id)?.status).toBe("running");
  });
});

function taskInput(): CreateTaskInput {
  return {
    title: "HoraAqui PR",
    prompt: "Process PRs",
    cwd: tempDir,
    schedule: { type: "manual" },
    enabled: true,
    effort: null,
    model: null
  };
}
