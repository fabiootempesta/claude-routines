import { spawn } from "node:child_process";
import type { ClaudeEffort } from "./types.js";

export type ClaudeCommand = {
  file: string;
  args: string[];
};

export type ClaudeRunResult = {
  exitCode: number | null;
};

export type ClaudeRunEvents = {
  onStart?: (pid: number) => void | Promise<void>;
  onStdout?: (chunk: string) => void | Promise<void>;
  onStderr?: (chunk: string) => void | Promise<void>;
};

function effortArgs(effort: ClaudeEffort): string[] {
  return effort ? ["--effort", effort] : [];
}

export function buildClaudeCommand(sessionId: string, effort: ClaudeEffort = null): ClaudeCommand {
  return {
    file: "claude",
    args: [
      "-p",
      "--dangerously-skip-permissions",
      "--session-id",
      sessionId,
      ...effortArgs(effort),
      "--output-format",
      "text",
      "--verbose"
    ]
  };
}

export function buildClaudeResumeCommand(sessionId: string, effort: ClaudeEffort = null): ClaudeCommand {
  return {
    file: "claude",
    args: [
      "-p",
      "--dangerously-skip-permissions",
      "--resume",
      sessionId,
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
    let child;

    try {
      child = spawn(command.file, command.args, {
        cwd,
        env: process.env,
        stdio: ["pipe", "pipe", "pipe"]
      });
    } catch (error) {
      reject(error);
      return;
    }

    if (child.pid) {
      void events.onStart?.(child.pid);
    }

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");

    child.stdout.on("data", (chunk: string) => {
      void events.onStdout?.(chunk);
    });

    child.stderr.on("data", (chunk: string) => {
      void events.onStderr?.(chunk);
    });

    child.on("error", (error) => {
      reject(error);
    });

    child.on("close", (exitCode) => {
      resolve({ exitCode });
    });

    child.stdin.write(prompt);
    child.stdin.end();
  });
}
