import { spawn, type ChildProcess } from "node:child_process";
import type { ClaudeEffort, ClaudeModel } from "./types.js";

export type ClaudeCommand = {
  file: string;
  args: string[];
};

export type ClaudeRunResult = {
  exitCode: number | null;
  signal: NodeJS.Signals | null;
};

export type ClaudeRunEvents = {
  onStart?: (child: ChildProcess) => void | Promise<void>;
  onStdout?: (chunk: string) => void | Promise<void>;
  onStderr?: (chunk: string) => void | Promise<void>;
};

function effortArgs(effort: ClaudeEffort): string[] {
  return effort ? ["--effort", effort] : [];
}

function modelArgs(model: ClaudeModel): string[] {
  return model ? ["--model", model] : [];
}

export function buildClaudeCommand(
  sessionId: string,
  effort: ClaudeEffort = null,
  model: ClaudeModel = null
): ClaudeCommand {
  return {
    file: "claude",
    args: [
      "-p",
      "--dangerously-skip-permissions",
      "--session-id",
      sessionId,
      ...modelArgs(model),
      ...effortArgs(effort),
      "--output-format",
      "text",
      "--verbose"
    ]
  };
}

export function buildClaudeResumeCommand(
  sessionId: string,
  effort: ClaudeEffort = null,
  model: ClaudeModel = null
): ClaudeCommand {
  return {
    file: "claude",
    args: [
      "-p",
      "--dangerously-skip-permissions",
      "--resume",
      sessionId,
      ...modelArgs(model),
      ...effortArgs(effort),
      "--output-format",
      "text",
      "--verbose"
    ]
  };
}

export function formatCommand(command: ClaudeCommand): string[] {
  return [command.file, ...command.args];
}

export function runClaudeCommand(
  command: ClaudeCommand,
  cwd: string,
  prompt: string,
  events: ClaudeRunEvents = {}
): Promise<ClaudeRunResult> {
  return new Promise((resolve, reject) => {
    let child: ChildProcess;

    try {
      child = spawn(command.file, command.args, {
        cwd,
        env: process.env,
        stdio: ["pipe", "pipe", "pipe"],
        detached: true
      });
    } catch (error) {
      reject(error);
      return;
    }

    void events.onStart?.(child);

    child.stdout?.setEncoding("utf8");
    child.stderr?.setEncoding("utf8");

    child.stdout?.on("data", (chunk: string) => {
      void events.onStdout?.(chunk);
    });

    child.stderr?.on("data", (chunk: string) => {
      void events.onStderr?.(chunk);
    });

    child.on("error", (error) => {
      reject(error);
    });

    child.on("close", (exitCode, signal) => {
      resolve({ exitCode, signal });
    });

    child.stdin?.write(prompt);
    child.stdin?.end();
  });
}
