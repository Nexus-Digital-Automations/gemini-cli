/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type React from 'react';
import { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

interface TaskStats {
  total_tasks: number;
  by_status: Record<string, number>;
  by_priority: Record<string, number>;
  by_type: Record<string, number>;
  completion_rate: number;
}

interface TaskData {
  id: string;
  title: string;
  status: string;
  priority: string;
  type: string;
  description?: string;
}

/**
 * Task Queue Display Component
 * Shows real-time task queue status from the TaskManager API
 *
 * Keyboard shortcuts:
 * - 't' or 'T': Toggle between compact and detailed view
 */
export const TaskQueueDisplay: React.FC<{ visible?: boolean }> = ({
  visible = true,
}) => {
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [allTasks, setAllTasks] = useState<TaskData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailedView, setDetailedView] = useState(false);

  // Handle keyboard shortcuts
  useInput((input, _key) => {
    if (input === 't' || input === 'T') {
      setDetailedView((prev) => !prev);
    }
  });

  useEffect(() => {
    if (!visible) return;

    const fetchTaskData = async () => {
      try {
        // Helper function to find valid JSON (filters out dotenv logs and ANSI colored logs)
        const findJsonLine = (output: string): string => {
          const lines = output.trim().split('\n');

          // Try to find multi-line JSON starting from the beginning
          for (let i = 0; i < lines.length; i++) {
            const trimmedLine = lines[i].trim();

            // Skip empty lines and lines that don't start JSON
            if (
              !trimmedLine ||
              (!trimmedLine.startsWith('{') && !trimmedLine.startsWith('['))
            ) {
              continue;
            }

            // Try to accumulate lines from this point and parse as JSON
            for (let j = i; j < lines.length; j++) {
              const jsonCandidate = lines.slice(i, j + 1).join('\n');
              try {
                JSON.parse(jsonCandidate);
                return jsonCandidate;
              } catch {
                // Not yet valid JSON, try adding more lines
                continue;
              }
            }
          }

          throw new Error('No valid JSON found in output');
        };

        // Fetch task statistics
        const statsCmd = `timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" get-task-stats 2>/dev/null`;
        const { stdout: statsOutput } = await execAsync(statsCmd);
        const statsData = JSON.parse(findJsonLine(statsOutput));

        if (statsData.success) {
          setStats(statsData.statistics);
        }

        // Fetch tasks from all relevant statuses
        const statuses = [
          'in-progress',
          'queued',
          'approved',
          'blocked',
          'suggested',
        ];
        const fetchedTasks: TaskData[] = [];

        for (const status of statuses) {
          try {
            const tasksCmd = `timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" get-tasks-by-status ${status} 2>/dev/null`;
            const { stdout: tasksOutput } = await execAsync(tasksCmd);
            const tasksData = JSON.parse(findJsonLine(tasksOutput));

            if (tasksData.success && tasksData.tasks) {
              fetchedTasks.push(...tasksData.tasks);
            }
          } catch (err) {
            // Silently continue if a particular status fetch fails
            console.error(`Failed to fetch ${status} tasks:`, err);
          }
        }

        setAllTasks(fetchedTasks);

        setLoading(false);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to fetch task data',
        );
        setLoading(false);
      }
    };

    // Initial fetch
    fetchTaskData();

    // Refresh every 5 seconds
    const interval = setInterval(fetchTaskData, 5000);

    return () => clearInterval(interval);
  }, [visible]);

  if (!visible) return null;

  if (loading) {
    return (
      <Box borderStyle="round" borderColor="blue" paddingX={1}>
        <Text color="blue">Loading task queue...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box borderStyle="round" borderColor="red" paddingX={1}>
        <Text color="red">Task Queue Error: {error}</Text>
      </Box>
    );
  }

  if (!stats) return null;

  const getPriorityColor = (priority: string): string => {
    switch (priority.toLowerCase()) {
      case 'urgent':
        return 'red';
      case 'high':
        return 'yellow';
      case 'normal':
        return 'blue';
      case 'low':
        return 'gray';
      default:
        return 'white';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'green';
      case 'in-progress':
      case 'assigned':
        return 'yellow';
      case 'approved':
        return 'cyan';
      case 'suggested':
        return 'gray';
      case 'blocked':
      case 'failed':
        return 'red';
      default:
        return 'white';
    }
  };

  // Group tasks by status
  const tasksByStatus = allTasks.reduce(
    (acc, task) => {
      if (!acc[task.status]) {
        acc[task.status] = [];
      }
      acc[task.status].push(task);
      return acc;
    },
    {} as Record<string, TaskData[]>,
  );

  // Status priority order for display
  const statusOrder = [
    'in-progress',
    'blocked',
    'queued',
    'approved',
    'suggested',
  ];

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor="cyan"
      paddingX={1}
    >
      <Box>
        <Text bold color="cyan">
          📋 Task Queue
        </Text>
        <Text color="gray"> ({stats.total_tasks} total)</Text>
        <Text color="dim">
          {' '}
          [Press &apos;t&apos; for {detailedView ? 'compact' : 'detailed'} view]
        </Text>
      </Box>

      {/* Task Statistics */}
      <Box flexDirection="column" marginTop={1}>
        <Box>
          <Text color="white">Status: </Text>
          {Object.entries(stats.by_status).map(([status, count]) => (
            <Box key={status} paddingLeft={1}>
              <Text color={getStatusColor(status)}>
                {status}: {count}
              </Text>
            </Box>
          ))}
        </Box>

        {Object.keys(stats.by_priority).length > 0 && (
          <Box marginTop={1}>
            <Text color="white">Priority: </Text>
            {Object.entries(stats.by_priority).map(([priority, count]) => (
              <Box key={priority} paddingLeft={1}>
                <Text color={getPriorityColor(priority)}>
                  {priority}: {count}
                </Text>
              </Box>
            ))}
          </Box>
        )}

        <Box marginTop={1}>
          <Text color="white">
            Completion Rate: <Text color="green">{stats.completion_rate}%</Text>
          </Text>
        </Box>
      </Box>

      {/* Tasks grouped by status */}
      {allTasks.length > 0 && (
        <Box flexDirection="column" marginTop={1}>
          {statusOrder.map((status) => {
            const tasks = tasksByStatus[status] || [];
            if (tasks.length === 0) return null;

            return (
              <Box key={status} flexDirection="column" marginTop={1}>
                <Text bold color={getStatusColor(status)}>
                  {status.charAt(0).toUpperCase() + status.slice(1)} (
                  {tasks.length}):
                </Text>
                {tasks.map((task) => (
                  <Box key={task.id} flexDirection="column" paddingLeft={1}>
                    <Box>
                      <Text color={getPriorityColor(task.priority)}>
                        [{task.priority}]
                      </Text>
                      <Text color="white"> {task.title}</Text>
                    </Box>
                    {detailedView && task.description && (
                      <Box paddingLeft={2} marginTop={0}>
                        <Text color="gray" dimColor>
                          {task.description.slice(0, 100)}
                          {task.description.length > 100 ? '...' : ''}
                        </Text>
                      </Box>
                    )}
                  </Box>
                ))}
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
};
