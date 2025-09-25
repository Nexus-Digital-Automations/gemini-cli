# Feature: Autonomous Task Management System

This document outlines the detailed plan for integrating a comprehensive task management system into the Gemini CLI, aiming to enable more autonomous agent behavior. The system will allow agents to define, track, execute, and manage tasks with rich metadata and dependencies.

## Core Components:

- **Task Definition:**
  - Schema: `id`, `name`, `description`, `status` (e.g., `todo`, `in_progress`, `done`, `failed`, `blocked`), `priority`, `dueDate`, `assignee`, `dependencies`, `subtasks`, `metadata` (e.g., `tool_calls`, `context`).
  - Metadata: `tool_calls` (structured array of tool invocations), `context` (relevant data/state).
- **Task Execution Engine:**
  - Orchestration: Sequential, parallel, conditional execution.
  - Dependency Resolution: Manage task dependencies.
  - Tool Integration: Interface with available tools (e.g., file system, shell, APIs).
  - State Management: Track task progress and status.
- **Agent Interface:**
  - Task Creation: API for agents to define new tasks.
  - Task Retrieval: API to fetch tasks for execution.
  - Status Updates: Mechanism for agents to report task progress.
- **Persistence:**
  - Storage: File-based storage for task state (JSON files).

## Detailed Implementation Plan:

### Phase 1: Core Task Definition and Persistence

1.  **Define Task Schema (TypeScript Interfaces & Enums)**
    - **Location:** `packages/core/src/task/types.ts`
    - **Action:** Create TypeScript interfaces for `Task`, `ToolCall`, `TaskMetadata`, and enums for `TaskStatus` and `TaskPriority`.

    ```typescript
    // packages/core/src/task/types.ts
    export enum TaskStatus {
      Todo = 'todo',
      InProgress = 'in_progress',
      Done = 'done',
      Failed = 'failed',
      Blocked = 'blocked',
    }

    export enum TaskPriority {
      Low = 'low',
      Medium = 'medium',
      High = 'high',
      Critical = 'critical',
    }

    export interface ToolCall {
      toolName: string;
      args: Record<string, any>;
      result?: any; // To store the result of the tool call after execution
      error?: string; // To store any error during tool call execution
    }

    export interface TaskMetadata {
      toolCalls: ToolCall[];
      context: Record<string, any>; // Arbitrary data relevant to the task
      // Add any other metadata needed for autonomy, e.g., 'agentInstructions'
    }

    export interface Task {
      id: string;
      name: string;
      description: string;
      status: TaskStatus;
      priority: TaskPriority;
      dueDate?: string; // ISO date string
      assignee?: string;
      dependencies: string[]; // Array of task IDs
      subtasks: string[]; // Array of task IDs
      metadata: TaskMetadata;
      createdAt: string; // ISO date string
      updatedAt: string; // ISO date string
    }
    ```

2.  **Implement Task Store (File-based Persistence)**
    - **Location:** `packages/core/src/task/taskStore.ts`
    - **Action:** Create a `TaskStore` class responsible for reading/writing tasks to a JSON file.
      - Use a default file path like `~/.gemini/tasks.json` or `project_root/.gemini/tasks.json`.
      - Methods: `loadTasks(): Promise<Task[]>`, `saveTasks(tasks: Task[]): Promise<void>`, `getTask(id: string): Promise<Task | undefined>`, `addTask(task: Task): Promise<void>`, `updateTask(task: Task): Promise<void>`, `deleteTask(id: string): Promise<void>`.
      - Utilize `fs/promises` for async file operations.
      - Implement basic locking or careful write strategies to prevent corruption if multiple processes try to write simultaneously (though for a CLI, this might be less critical initially).

### Phase 2: Task Management Logic and Agent Interface

1.  **Develop Task Manager**
    - **Location:** `packages/core/src/task/taskManager.ts`
    - **Action:** Create a `TaskManager` class that uses the `TaskStore` and provides business logic for task operations.
      - Methods:
        - `createTask(name: string, description: string, ...): Promise<Task>`: Generates a unique ID (e.g., using `uuid`), sets initial status (`Todo`), `createdAt`, `updatedAt`.
        - `getTask(id: string): Promise<Task | undefined>`
        - `listTasks(filter?: { status?: TaskStatus; assignee?: string }): Promise<Task[]>`
        - `updateTaskStatus(id: string, newStatus: TaskStatus): Promise<Task>`: Includes validation for status transitions.
        - `addDependency(taskId: string, dependencyId: string): Promise<Task>`
        - `removeDependency(taskId: string, dependencyId: string): Promise<Task>`
        - `addSubtask(parentTaskId: string, subtaskId: string): Promise<Task>`
        - `updateTaskMetadata(taskId: string, metadata: Partial<TaskMetadata>): Promise<Task>`

2.  **Build Agent Interface (CLI Commands)**
    - **Location:** `packages/cli/src/commands/task/` (new directory)
    - **Action:** Create new CLI commands using `commander.js` (or whatever CLI framework is in use) to interact with the `TaskManager`.
      - `gemini task create <name>`: Prompts for description, priority, etc., then calls `taskManager.createTask()`.
      - `gemini task list [--status <status>] [--assignee <assignee>]`: Calls `taskManager.listTasks()` and formats output.
      - `gemini task show <id>`: Calls `taskManager.getTask()` and displays details.
      - `gemini task update <id> --status <status> --priority <priority> ...`: Calls `taskManager.updateTaskStatus()` or other update methods.
      - `gemini task add-tool-call <id> --tool <toolName> --args <jsonArgs>`: Allows adding tool calls to a task's metadata.

### Phase 3: Task Execution Engine and Tool Integration

1.  **Integrate Tooling (Existing `default_api` tools)**
    - **Action:** The `TaskExecutionEngine` will directly invoke the `default_api` functions based on the `ToolCall` objects in a task's metadata. No specific "adapters" are needed beyond mapping the `toolName` to the actual function and passing `args`.

2.  **Develop Task Execution Engine**
    - **Location:** `packages/core/src/task/taskExecutionEngine.ts`
    - **Action:** Create a `TaskExecutionEngine` class.
      - Constructor takes `TaskManager` and a reference to the available tools (e.g., `default_api`).
      - Methods:
        - `executeTask(taskId: string): Promise<Task>`:
          - Fetches the task.
          - Checks `dependencies`. If any are `InProgress` or `Todo`, mark current task `Blocked` and return.
          - Sets task status to `InProgress`.
          - Iterates through `task.metadata.toolCalls`:
            - Invokes the corresponding tool function (e.g., `default_api[toolCall.toolName](toolCall.args)`).
            - Captures `result` or `error` and updates the `ToolCall` object within the task's metadata.
            - Updates task `context` based on tool results (e.g., if a tool writes a file, the context might store the file path).
            - Handles sequential execution (wait for one tool call to complete before the next) or parallel (if specified in metadata, though sequential is simpler to start).
          - If all tool calls succeed, sets task status to `Done`.
          - If any tool call fails, sets task status to `Failed` and records the error.
          - Persists task state after each significant change.
        - `findAndExecuteRunnableTasks(): Promise<void>`:
          - Lists all `Todo` tasks.
          - For each `Todo` task, checks if all its `dependencies` are `Done`.
          - If runnable, calls `executeTask()` for it.
          - This method could be called by a new CLI command `gemini task run-all-ready`.

### Phase 4: Testing and Refinement

1.  **Testing**
    - **Location:** `packages/core/src/task/__tests__/` and `integration-tests/task.test.ts`
    - **Action:**
      - **Unit Tests:** For `TaskStore`, `TaskManager`, `TaskExecutionEngine` (mocking file system for `TaskStore` and tool invocations for `TaskExecutionEngine`).
      - **Integration Tests:** For the new CLI commands, ensuring they correctly interact with the task system.

2.  **Refinement**
    - **Error Handling:** Robust error handling and logging throughout.
    - **User Feedback:** Clear messages for CLI users about task status, errors, and progress.
    - **Context Management:** Define clear patterns for how `context` is updated and used by subsequent tool calls within a task, or by dependent tasks. This is crucial for autonomy.
    - **Concurrency:** Consider how multiple `gemini task run-all-ready` calls might interact (e.g., using file locks for the task store).
    - **Advanced Features (Future):**
      - Conditional execution of tool calls.
      - Looping constructs within tasks.
      - More sophisticated dependency resolution (e.g., automatically marking tasks as `Blocked` if a dependency fails).
      - A "plan" generation step where the agent itself creates a series of tasks and tool calls.
