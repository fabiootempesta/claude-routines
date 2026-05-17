export type ManualSchedule = {
  type: "manual";
};

export type OnceSchedule = {
  type: "once";
  runAt: string;
};

export type IntervalSchedule = {
  type: "interval";
  everyMinutes: number;
};

export type DailySchedule = {
  type: "daily";
  time: string;
};

export type WeeklySchedule = {
  type: "weekly";
  dayOfWeek: number;
  time: string;
};

export type CronSchedule = {
  type: "cron";
  expression: string;
};

export type ContinuousSchedule = {
  type: "continuous";
  stopAt?: string | null;
};

export type TaskSchedule =
  | ManualSchedule
  | OnceSchedule
  | IntervalSchedule
  | DailySchedule
  | WeeklySchedule
  | CronSchedule
  | ContinuousSchedule;

export type ClaudeEffort = "low" | "medium" | "high" | "xhigh" | "max" | null;

export const claudeEffortOptions: Array<Exclude<ClaudeEffort, null>> = [
  "low",
  "medium",
  "high",
  "xhigh",
  "max"
];

export type ClaudeModel = string | null;

export const claudeModelOptions: Array<{ id: string; label: string }> = [
  { id: "opus", label: "Opus 4.7" },
  { id: "sonnet", label: "Sonnet 4.6" },
  { id: "haiku", label: "Haiku 4.5" }
];

export const DEFAULT_CLAUDE_EFFORT: ClaudeEffort = "max";
export const DEFAULT_CLAUDE_MODEL: ClaudeModel = "opus";

export type Task = {
  id: string;
  title: string;
  prompt: string;
  cwd: string;
  schedule: TaskSchedule;
  enabled: boolean;
  effort: ClaudeEffort;
  model: ClaudeModel;
  nextRunAt: string | null;
  lastRunAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ExecutionStatus = "running" | "success" | "failed" | "stale" | "cancelled";

export type ExecutionTrigger = "manual" | "scheduled" | "resume" | "message";

export type Execution = {
  id: string;
  taskId: string;
  taskTitle: string;
  trigger: ExecutionTrigger;
  status: ExecutionStatus;
  startedAt: string;
  finishedAt: string | null;
  lastOutputAt: string;
  exitCode: number | null;
  stdout: string;
  stderr: string;
  command: string[];
  cwd: string;
  prompt: string;
  effort: ClaudeEffort;
  model: ClaudeModel;
  error: string | null;
  processId: number | null;
  sessionId: string;
  resumedFromExecutionId: string | null;
  staleAt: string | null;
  staleReason: string | null;
  cancelRequestedAt: string | null;
};

export type DatabaseShape = {
  tasks: Task[];
  executions: Execution[];
};

export type CreateTaskInput = {
  title: string;
  prompt: string;
  cwd: string;
  schedule: TaskSchedule;
  enabled: boolean;
  effort: ClaudeEffort;
  model: ClaudeModel;
};

export type UpdateTaskInput = Partial<CreateTaskInput>;
