/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type React from 'react';
import { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
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
}

/**
 * Task Queue Display Component
 * Shows real-time task queue status from the TaskManager API
 */
export const TaskQueueDisplay: React.FC<{ visible?: boolean }> = ({
  visible = true,
}) => {
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

        // Fetch approved tasks
        const tasksCmd = `timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" get-tasks-by-status approved 2>/dev/null`;
        const { stdout: tasksOutput } = await execAsync(tasksCmd);
        const tasksData = JSON.parse(findJsonLine(tasksOutput));

        if (tasksData.success) {
          setTasks(tasksData.tasks || []);
        }

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

      {/* Active/Approved Tasks */}
      {tasks.length > 0 && (
        <Box flexDirection="column" marginTop={1}>
          <Text bold color="yellow">
            Approved Tasks:
          </Text>
          {tasks.slice(0, 5).map((task) => (
            <Box key={task.id} paddingLeft={1}>
              <Text color={getPriorityColor(task.priority)}>
                [{task.priority}]
              </Text>
              <Text color="white"> {task.title}</Text>
            </Box>
          ))}
          {tasks.length > 5 && (
            <Box paddingLeft={1}>
              <Text color="gray">... and {tasks.length - 5} more</Text>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};
