import { TaskExecutionEngine } from '../taskExecutionEngine';
import { TaskManager } from '../taskManager';
import { Task, TaskStatus, TaskPriority, ToolCall } from '../types';
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest';

// Mock the global default_api object
const mockDefaultApi = {
  tool1: vi.fn(),
  tool2: vi.fn(),
  tool3: vi.fn(),
  // Add other tools as needed for testing
};

// Declare globalThis.default_api for TypeScript
declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  var default_api: any;
}

describe('TaskExecutionEngine', () => {
  let mockTaskManager: TaskManager;
  let taskExecutionEngine: TaskExecutionEngine;

  beforeEach(() => {
    vi.resetAllMocks();
    globalThis.default_api = mockDefaultApi; // Assign mock to globalThis

    mockTaskManager = {
      getTask: vi.fn(),
      updateTaskStatus: vi.fn(),
      updateTaskMetadata: vi.fn(),
      listTasks: vi.fn(),
      getRunnableTasks: vi.fn(), // Added this line
    } as unknown as TaskManager;
    taskExecutionEngine = new TaskExecutionEngine(mockTaskManager);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete globalThis.default_api; // Clean up globalThis
  });

  const createMockTask = (id: string, status: TaskStatus, toolCalls: ToolCall[] = [], dependencies: string[] = []): Task => ({
    id,
    name: `Task ${id}`,
    description: `Description for ${id}`,
    status,
    priority: TaskPriority.Medium,
    dependencies,
    subtasks: [],
    metadata: { toolCalls, context: {} },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  it('should execute a task with tool calls successfully', async () => {
    const toolCalls: ToolCall[] = [
      { toolName: 'tool1', args: { a: 1 } },
      { toolName: 'tool2', args: { b: 2 } },
    ];
    const mockTask = createMockTask('task-1', TaskStatus.Todo, toolCalls);

    mockTaskManager.getTask.mockResolvedValue(mockTask); // Ensure mock returns the task
    mockDefaultApi.tool1.mockResolvedValue({ output: 'tool1_result' });
    mockDefaultApi.tool2.mockResolvedValue({ output: 'tool2_result' });

    const resultTask = await taskExecutionEngine.executeTask('task-1');

    expect(mockTaskManager.getTask).toHaveBeenCalledWith('task-1');
    expect(mockTaskManager.updateTaskStatus).toHaveBeenCalledWith(
      'task-1',
      TaskStatus.InProgress,
    );
    expect(mockDefaultApi.tool1).toHaveBeenCalledWith({ a: 1 });
    expect(mockDefaultApi.tool2).toHaveBeenCalledWith({ b: 2 });
    expect(mockTaskManager.updateTaskStatus).toHaveBeenCalledWith(
      'task-1',
      TaskStatus.Done,
    );
    expect(resultTask.status).toBe(TaskStatus.Done);
    expect(resultTask.metadata.toolCalls[0].result).toEqual({ output: 'tool1_result' });
    expect(resultTask.metadata.toolCalls[1].result).toEqual({ output: 'tool2_result' });
  });

  it('should mark task as failed if a tool call fails', async () => {
    const toolCalls: ToolCall[] = [
      { toolName: 'tool1', args: { a: 1 } },
      { toolName: 'tool2', args: { b: 2 } },
    ];
    const mockTask = createMockTask('task-2', TaskStatus.Todo, toolCalls);

    mockTaskManager.getTask.mockResolvedValue(mockTask); // Ensure mock returns the task
    mockDefaultApi.tool1.mockResolvedValue({ output: 'tool1_result' });
    mockDefaultApi.tool2.mockRejectedValue(new Error('Tool2 failed'));

    const resultTask = await taskExecutionEngine.executeTask('task-2');

    expect(mockDefaultApi.tool1).toHaveBeenCalledWith({ a: 1 });
    expect(mockDefaultApi.tool2).toHaveBeenCalledWith({ b: 2 });
    expect(mockTaskManager.updateTaskStatus).toHaveBeenCalledWith(
      'task-2',
      TaskStatus.Failed,
    );
    expect(resultTask.status).toBe(TaskStatus.Failed);
    expect(resultTask.metadata.toolCalls[1].error).toBe('Tool2 failed');
  });

  it('should mark task as blocked if dependencies are not done', async () => {
    const mockTask = createMockTask('task-3', TaskStatus.Todo, [], ['dep-task-1']);
    const depTask = createMockTask('dep-task-1', TaskStatus.InProgress);

    mockTaskManager.getTask.mockResolvedValueOnce(mockTask);
    mockTaskManager.getTask.mockResolvedValueOnce(depTask);

    const resultTask = await taskExecutionEngine.executeTask('task-3');

    expect(mockTaskManager.updateTaskStatus).toHaveBeenCalledWith(
      'task-3',
      TaskStatus.Blocked,
    );
    expect(resultTask.status).toBe(TaskStatus.Blocked);
    expect(mockDefaultApi.tool1).not.toHaveBeenCalled();
  });

  it('should execute task if all dependencies are done', async () => {
    const toolCalls: ToolCall[] = [
      { toolName: 'tool1', args: { a: 1 } },
    ];
    const mockTask = createMockTask('task-4', TaskStatus.Todo, toolCalls, ['dep-task-2']);
    const depTask = createMockTask('dep-task-2', TaskStatus.Done);

    mockTaskManager.getTask.mockResolvedValueOnce(mockTask);
    mockTaskManager.getTask.mockResolvedValueOnce(depTask);
    mockDefaultApi.tool1.mockResolvedValue({ output: 'tool1_result' });

    const resultTask = await taskExecutionEngine.executeTask('task-4');

    expect(mockTaskManager.updateTaskStatus).toHaveBeenCalledWith(
      'task-4',
      TaskStatus.InProgress,
    );
    expect(mockDefaultApi.tool1).toHaveBeenCalledWith({ a: 1 });
    expect(resultTask.status).toBe(TaskStatus.Done);
  });

  it('should find and execute runnable tasks', async () => {
    const task1 = createMockTask('task-5', TaskStatus.Todo, [{ toolName: 'tool1', args: {} }]);
    const task2 = createMockTask('task-6', TaskStatus.Todo, [{ toolName: 'tool2', args: {} }], ['task-5']);
    const task3 = createMockTask('task-7', TaskStatus.Todo, [{ toolName: 'tool3', args: {} }], ['task-6']);

    mockTaskManager.listTasks.mockResolvedValueOnce([task1, task2, task3]);
    mockTaskManager.getRunnableTasks.mockResolvedValueOnce([task1]); // Mock this to return task1 as runnable
    mockTaskManager.getTask.mockImplementation((id) => {
      if (id === 'task-5') return Promise.resolve(createMockTask('task-5', TaskStatus.Done));
      if (id === 'task-6') return Promise.resolve(createMockTask('task-6', TaskStatus.Done));
      if (id === 'task-7') return Promise.resolve(createMockTask('task-7', TaskStatus.Todo));
      return Promise.resolve(undefined);
    });
    mockDefaultApi.tool1.mockResolvedValue({ output: 'tool1_result' });
    mockDefaultApi.tool2.mockResolvedValue({ output: 'tool2_result' });
    mockDefaultApi.tool3.mockResolvedValue({ output: 'tool3_result' });

    // Mock updateTaskStatus to return the updated task for subsequent getTask calls
    mockTaskManager.updateTaskStatus.mockImplementation(async (id, status) => {
      const task = await mockTaskManager.getTask(id);
      if (task) {
        task.status = status;
        return task;
      }
      throw new Error('Task not found');
    });

    await taskExecutionEngine.findAndExecuteRunnableTasks();

    // Expect task1 to be executed
    expect(mockTaskManager.updateTaskStatus).toHaveBeenCalledWith(
      'task-5',
      TaskStatus.InProgress,
    );
    expect(mockDefaultApi.tool1).toHaveBeenCalled();
    expect(mockTaskManager.updateTaskStatus).toHaveBeenCalledWith(
      'task-5',
      TaskStatus.Done,
    );

    // Task2 should be blocked initially, then marked as blocked
    expect(mockTaskManager.updateTaskStatus).toHaveBeenCalledWith(
      'task-6',
      TaskStatus.Blocked,
    );

    // Task3 should be blocked initially, then marked as blocked
    expect(mockTaskManager.updateTaskStatus).toHaveBeenCalledWith(
      'task-7',
      TaskStatus.Blocked,
    );
  });

  it('should handle non-existent tool gracefully', async () => {
    const toolCalls: ToolCall[] = [
      { toolName: 'nonExistentTool', args: {} },
    ];
    const mockTask = createMockTask('task-8', TaskStatus.Todo, toolCalls);

    mockTaskManager.getTask.mockResolvedValue(mockTask); // Ensure mock returns the task

    const resultTask = await taskExecutionEngine.executeTask('task-8');

    expect(mockTaskManager.updateTaskStatus).toHaveBeenCalledWith(
      'task-8',
      TaskStatus.Failed,
    );
    expect(resultTask.status).toBe(TaskStatus.Failed);
    expect(resultTask.metadata.toolCalls[0].error).toContain('Tool \'nonExistentTool\' not found');
  });
});
