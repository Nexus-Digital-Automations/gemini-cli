/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { Box, Text, useApp } from 'ink';
import type { TaskMetadata, AgentStatus } from './TaskStatusMonitor.js';
import {
  TaskStatusMonitor,
  TaskStatus,
  taskStatusMonitor,
} from './TaskStatusMonitor.js';
import type {
  TaskAnalytics,
  AgentAnalytics,
  SystemAnalytics,
  AnalyticsTimeframe,
} from './StatusHistoryAnalytics.js';
import {
  StatusHistoryAnalytics,
  statusHistoryAnalytics,
} from './StatusHistoryAnalytics.js';
import {
  NotificationSystem,
  notificationSystem,
} from './NotificationSystem.js';

interface DashboardState {
  currentView: 'overview' | 'tasks' | 'agents' | 'analytics' | 'history';
  refreshInterval: number;
  lastRefresh: Date;
  isLoading: boolean;
  error?: string;
}

interface TaskStatusCounts {
  queued: number;
  assigned: number;
  inProgress: number;
  blocked: number;
  completed: number;
  failed: number;
  cancelled: number;
}

interface VisualizationProps {
  data: TaskStatusCounts | AgentAnalytics | TaskAnalytics;
  type: 'bar' | 'pie' | 'line' | 'gauge';
  title: string;
  width?: number;
  height?: number;
}

/**
 * ASCII-based Chart Components for Terminal Display
 */
const BarChart: React.FC<{
  data: Record<string, number>;
  title: string;
  maxWidth?: number;
}> = ({ data, title, maxWidth = 40 }) => {
  const maxValue = Math.max(...Object.values(data));
  const scale = maxWidth / maxValue;

  return (
    <Box flexDirection="column">
      <Text bold>{title}</Text>
      {Object.entries(data).map(([label, value]) => {
        const barLength = Math.max(1, Math.floor(value * scale));
        const bar = '█'.repeat(barLength);
        return (
          <Box key={label} gap={1}>
            <Text dimColor>{label.padEnd(12)}</Text>
            <Text color="blue">{bar}</Text>
            <Text dimColor>({value})</Text>
          </Box>
        );
      })}
    </Box>
  );
};

const ProgressBar: React.FC<{
  current: number;
  total: number;
  label: string;
  color?: string;
  width?: number;
}> = ({ current, total, label, color = 'green', width = 30 }) => {
  const percentage = total > 0 ? (current / total) * 100 : 0;
  const filledWidth = Math.floor((percentage / 100) * width);
  const emptyWidth = width - filledWidth;

  return (
    <Box gap={1}>
      <Text dimColor>{label.padEnd(15)}</Text>
      <Text color={color}>{'█'.repeat(filledWidth)}</Text>
      <Text dimColor>{'░'.repeat(emptyWidth)}</Text>
      <Text dimColor>
        {current}/{total} ({percentage.toFixed(1)}%)
      </Text>
    </Box>
  );
};

const MetricCard: React.FC<{
  title: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  color?: string;
}> = ({ title, value, unit = '', trend, color = 'white' }) => {
  const trendSymbol = trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→';
  const trendColor =
    trend === 'up' ? 'green' : trend === 'down' ? 'red' : 'yellow';

  return (
    <Box flexDirection="column" borderStyle="single" paddingX={1}>
      <Text dimColor>{title}</Text>
      <Box gap={1}>
        <Text color={color} bold>
          {value}
          {unit}
        </Text>
        {trend && <Text color={trendColor}>{trendSymbol}</Text>}
      </Box>
    </Box>
  );
};

/**
 * Overview Dashboard - System Status Summary
 */
const OverviewDashboard: React.FC<{
  tasks: TaskMetadata[];
  agents: AgentStatus[];
  metrics: SystemAnalytics;
}> = ({ tasks, agents, metrics }) => {
  const taskCounts = tasks.reduce(
    (acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    },
    {} as Record<TaskStatus, number>,
  );

  const agentCounts = agents.reduce(
    (acc, agent) => {
      acc[agent.status] = (acc[agent.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold color="cyan">
        🚀 Real-Time Task Status Monitoring Dashboard
      </Text>
      <Text dimColor>Last updated: {new Date().toLocaleString()}</Text>

      {/* System Metrics */}
      <Box gap={2} marginTop={1}>
        <MetricCard
          title="System Efficiency"
          value={metrics.systemEfficiency.toFixed(1)}
          unit="%"
          trend={
            metrics.trends.taskCompletionTrend === 'improving'
              ? 'up'
              : metrics.trends.taskCompletionTrend === 'declining'
                ? 'down'
                : 'stable'
          }
          color="green"
        />
        <MetricCard
          title="Active Agents"
          value={agentCounts.active || 0}
          unit={`/${agents.length}`}
          color="blue"
        />
        <MetricCard
          title="Total Events"
          value={metrics.totalEvents.toLocaleString()}
          color="yellow"
        />
        <MetricCard
          title="Events/Hour"
          value={metrics.eventsPerHour.toFixed(1)}
          color="magenta"
        />
      </Box>

      {/* Task Status Overview */}
      <Box marginTop={1}>
        <BarChart
          data={{
            Queued: taskCounts[TaskStatus.QUEUED] || 0,
            'In Progress': taskCounts[TaskStatus.IN_PROGRESS] || 0,
            Completed: taskCounts[TaskStatus.COMPLETED] || 0,
            Failed: taskCounts[TaskStatus.FAILED] || 0,
            Blocked: taskCounts[TaskStatus.BLOCKED] || 0,
          }}
          title="📊 Task Status Distribution"
        />
      </Box>

      {/* Agent Status */}
      <Box marginTop={1}>
        <BarChart data={agentCounts} title="🤖 Agent Status Distribution" />
      </Box>

      {/* System Alerts */}
      {metrics.bottlenecks.length > 0 && (
        <Box flexDirection="column" marginTop={1}>
          <Text bold color="red">
            ⚠️ System Alerts
          </Text>
          {metrics.bottlenecks.slice(0, 3).map((bottleneck, index) => (
            <Box key={index}>
              <Text color="red">•</Text>
              <Text dimColor> {bottleneck.description}</Text>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

/**
 * Task Details Dashboard
 */
const TaskDashboard: React.FC<{
  tasks: TaskMetadata[];
  agents: AgentStatus[];
}> = ({ tasks, agents }) => {
  const [selectedTask, setSelectedTask] = useState<TaskMetadata | null>(null);
  const [sortBy, setSortBy] = useState<'priority' | 'status' | 'created'>(
    'priority',
  );

  const sortedTasks = [...tasks].sort((a, b) => {
    switch (sortBy) {
      case 'priority':
        const priorityOrder = { critical: 4, high: 3, normal: 2, low: 1 };
        return (
          (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0)
        );
      case 'status':
        return a.status.localeCompare(b.status);
      case 'created':
        return b.lastUpdate.getTime() - a.lastUpdate.getTime();
      default:
        return 0;
    }
  });

  const getStatusColor = (status: TaskStatus): string => {
    switch (status) {
      case TaskStatus.COMPLETED:
        return 'green';
      case TaskStatus.FAILED:
        return 'red';
      case TaskStatus.IN_PROGRESS:
        return 'yellow';
      case TaskStatus.BLOCKED:
        return 'magenta';
      case TaskStatus.QUEUED:
        return 'cyan';
      default:
        return 'white';
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'critical':
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

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold color="cyan">
        📋 Task Management Dashboard
      </Text>

      {/* Task Statistics */}
      <Box gap={2}>
        <ProgressBar
          current={
            tasks.filter((t) => t.status === TaskStatus.COMPLETED).length
          }
          total={tasks.length}
          label="Completed"
          color="green"
        />
        <ProgressBar
          current={
            tasks.filter((t) => t.status === TaskStatus.IN_PROGRESS).length
          }
          total={tasks.length}
          label="In Progress"
          color="yellow"
        />
        <ProgressBar
          current={tasks.filter((t) => t.status === TaskStatus.FAILED).length}
          total={tasks.length}
          label="Failed"
          color="red"
        />
      </Box>

      {/* Task List */}
      <Box flexDirection="column" marginTop={1}>
        <Text bold>Recent Tasks (sorted by {sortBy}):</Text>
        {sortedTasks.slice(0, 10).map((task) => (
          <Box key={task.id} gap={1}>
            <Text color={getStatusColor(task.status)}>●</Text>
            <Text color={getPriorityColor(task.priority)}>
              [{task.priority.toUpperCase()}]
            </Text>
            <Text>{task.title.substring(0, 40)}...</Text>
            <Text dimColor>
              {task.assignedAgent ? `@${task.assignedAgent}` : 'unassigned'}
            </Text>
            <Text dimColor>{task.progress}%</Text>
          </Box>
        ))}
      </Box>

      {/* Task Type Distribution */}
      <Box marginTop={1}>
        <BarChart
          data={tasks.reduce(
            (acc, task) => {
              acc[task.type] = (acc[task.type] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>,
          )}
          title="📈 Tasks by Type"
        />
      </Box>
    </Box>
  );
};

/**
 * Agent Performance Dashboard
 */
const AgentDashboard: React.FC<{
  agents: AgentStatus[];
  tasks: TaskMetadata[];
}> = ({ agents, tasks }) => {
  const getAgentTasks = (agentId: string) =>
    tasks.filter((task) => task.assignedAgent === agentId);

  const getPerformanceColor = (successRate: number): string => {
    if (successRate >= 90) return 'green';
    if (successRate >= 70) return 'yellow';
    return 'red';
  };

  const sortedAgents = [...agents].sort(
    (a, b) => b.performance.successRate - a.performance.successRate,
  );

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold color="cyan">
        🤖 Agent Performance Dashboard
      </Text>

      {/* Agent Statistics */}
      <Box gap={2}>
        <MetricCard title="Total Agents" value={agents.length} color="blue" />
        <MetricCard
          title="Active Agents"
          value={
            agents.filter((a) => a.status === 'active' || a.status === 'busy')
              .length
          }
          color="green"
        />
        <MetricCard
          title="Idle Agents"
          value={agents.filter((a) => a.status === 'idle').length}
          color="yellow"
        />
        <MetricCard
          title="Offline Agents"
          value={agents.filter((a) => a.status === 'offline').length}
          color="red"
        />
      </Box>

      {/* Top Performing Agents */}
      <Box flexDirection="column" marginTop={1}>
        <Text bold>🏆 Top Performing Agents:</Text>
        {sortedAgents.slice(0, 8).map((agent) => {
          const agentTasks = getAgentTasks(agent.id);
          return (
            <Box key={agent.id} gap={1}>
              <Text color={getPerformanceColor(agent.performance.successRate)}>
                ●
              </Text>
              <Text>{agent.id.substring(0, 20).padEnd(20)}</Text>
              <Text color={getPerformanceColor(agent.performance.successRate)}>
                {agent.performance.successRate.toFixed(1)}%
              </Text>
              <Text dimColor>
                ({agent.completedTasks} completed, {agentTasks.length} current)
              </Text>
              <Text dimColor>
                [{agent.capabilities.slice(0, 2).join(', ')}]
              </Text>
            </Box>
          );
        })}
      </Box>

      {/* Agent Status Distribution */}
      <Box marginTop={1}>
        <BarChart
          data={agents.reduce(
            (acc, agent) => {
              acc[agent.status] = (acc[agent.status] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>,
          )}
          title="📊 Agent Status Distribution"
        />
      </Box>

      {/* Capability Distribution */}
      <Box marginTop={1}>
        <BarChart
          data={agents.reduce(
            (acc, agent) => {
              agent.capabilities.forEach((cap) => {
                acc[cap] = (acc[cap] || 0) + 1;
              });
              return acc;
            },
            {} as Record<string, number>,
          )}
          title="🛠️  Agent Capabilities"
        />
      </Box>
    </Box>
  );
};

/**
 * Analytics Dashboard with Time-Series Data
 */
const AnalyticsDashboard: React.FC<{
  taskAnalytics: TaskAnalytics;
  agentAnalytics: AgentAnalytics;
  systemAnalytics: SystemAnalytics;
}> = ({ taskAnalytics, agentAnalytics, systemAnalytics }) => {
  const [timeframe, setTimeframe] = useState<'1h' | '24h' | '7d' | '30d'>(
    '24h',
  );

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold color="cyan">
        📈 Analytics Dashboard
      </Text>

      {/* Key Performance Indicators */}
      <Box gap={2} marginTop={1}>
        <MetricCard
          title="Completion Rate"
          value={taskAnalytics.completionRate.toFixed(1)}
          unit="%"
          trend={
            taskAnalytics.completionRate > 0.8
              ? 'up'
              : taskAnalytics.completionRate > 0.6
                ? 'stable'
                : 'down'
          }
          color="green"
        />
        <MetricCard
          title="Failure Rate"
          value={taskAnalytics.failureRate.toFixed(1)}
          unit="%"
          trend={
            taskAnalytics.failureRate < 0.1
              ? 'up'
              : taskAnalytics.failureRate < 0.2
                ? 'stable'
                : 'down'
          }
          color="red"
        />
        <MetricCard
          title="Avg Completion Time"
          value={Math.round(taskAnalytics.averageCompletionTime / 1000 / 60)}
          unit="min"
          color="blue"
        />
        <MetricCard
          title="Agent Efficiency"
          value={agentAnalytics.averageTasksPerAgent.toFixed(1)}
          unit=" tasks/agent"
          color="yellow"
        />
      </Box>

      {/* Time Series Visualization (ASCII) */}
      <Box flexDirection="column" marginTop={1}>
        <Text bold>⏱️ Task Completion Timeline (Last {timeframe}):</Text>
        {taskAnalytics.timeSeriesData.slice(-10).map((dataPoint, index) => (
          <Box key={index} gap={1}>
            <Text dimColor>
              {dataPoint.timestamp.toLocaleTimeString().substring(0, 5)}
            </Text>
            <Text color="green">
              {'█'.repeat(Math.max(1, dataPoint.completed))}
            </Text>
            <Text color="red">{'█'.repeat(Math.max(1, dataPoint.failed))}</Text>
            <Text dimColor>
              ({dataPoint.completed}✓ {dataPoint.failed}✗)
            </Text>
          </Box>
        ))}
      </Box>

      {/* Task Distribution by Priority */}
      <Box marginTop={1}>
        <BarChart
          data={taskAnalytics.tasksByPriority}
          title="🎯 Tasks by Priority"
        />
      </Box>

      {/* System Trends */}
      <Box flexDirection="column" marginTop={1}>
        <Text bold>📊 System Trends:</Text>
        <Box gap={1}>
          <Text>Task Completion:</Text>
          <Text
            color={
              systemAnalytics.trends.taskCompletionTrend === 'improving'
                ? 'green'
                : systemAnalytics.trends.taskCompletionTrend === 'declining'
                  ? 'red'
                  : 'yellow'
            }
          >
            {systemAnalytics.trends.taskCompletionTrend}
          </Text>
        </Box>
        <Box gap={1}>
          <Text>Agent Utilization:</Text>
          <Text
            color={
              systemAnalytics.trends.agentUtilizationTrend === 'improving'
                ? 'green'
                : systemAnalytics.trends.agentUtilizationTrend === 'declining'
                  ? 'red'
                  : 'yellow'
            }
          >
            {systemAnalytics.trends.agentUtilizationTrend}
          </Text>
        </Box>
        <Box gap={1}>
          <Text>Error Rate:</Text>
          <Text
            color={
              systemAnalytics.trends.errorRateTrend === 'improving'
                ? 'green'
                : systemAnalytics.trends.errorRateTrend === 'declining'
                  ? 'red'
                  : 'yellow'
            }
          >
            {systemAnalytics.trends.errorRateTrend}
          </Text>
        </Box>
      </Box>
    </Box>
  );
};

/**
 * Main Status Dashboard Component
 */
export const StatusDashboard: React.FC<{
  autoRefresh?: boolean;
  refreshInterval?: number;
  initialView?: DashboardState['currentView'];
}> = ({
  autoRefresh = true,
  refreshInterval = 5000,
  initialView = 'overview',
}) => {
  const { exit } = useApp();
  const [state, setState] = useState<DashboardState>({
    currentView: initialView,
    refreshInterval,
    lastRefresh: new Date(),
    isLoading: false,
  });

  const [tasks, setTasks] = useState<TaskMetadata[]>([]);
  const [agents, setAgents] = useState<AgentStatus[]>([]);
  const [taskAnalytics, setTaskAnalytics] = useState<TaskAnalytics | null>(
    null,
  );
  const [agentAnalytics, setAgentAnalytics] = useState<AgentAnalytics | null>(
    null,
  );
  const [systemAnalytics, setSystemAnalytics] =
    useState<SystemAnalytics | null>(null);

  const refreshData = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: undefined }));

    try {
      // Get current data from monitors
      const currentTasks = taskStatusMonitor.getAllTasks();
      const currentAgents = taskStatusMonitor.getAllAgents();

      setTasks(currentTasks);
      setAgents(currentAgents);

      // Get analytics data
      const timeframe: AnalyticsTimeframe = {
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        endDate: new Date(),
        granularity: 'hour',
      };

      const [taskAnalyticsData, agentAnalyticsData, systemAnalyticsData] =
        await Promise.all([
          statusHistoryAnalytics.getTaskAnalytics(timeframe),
          statusHistoryAnalytics.getAgentAnalytics(timeframe),
          statusHistoryAnalytics.getSystemAnalytics(timeframe),
        ]);

      setTaskAnalytics(taskAnalyticsData);
      setAgentAnalytics(agentAnalyticsData);
      setSystemAnalytics(systemAnalyticsData);

      setState((prev) => ({
        ...prev,
        isLoading: false,
        lastRefresh: new Date(),
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  }, []);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(refreshData, state.refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, state.refreshInterval, refreshData]);

  // Initial data load
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeypress = (str: string, key: any) => {
      if (key.ctrl && key.name === 'c') {
        exit();
        return;
      }

      switch (key.name) {
        case '1':
          setState((prev) => ({ ...prev, currentView: 'overview' }));
          break;
        case '2':
          setState((prev) => ({ ...prev, currentView: 'tasks' }));
          break;
        case '3':
          setState((prev) => ({ ...prev, currentView: 'agents' }));
          break;
        case '4':
          setState((prev) => ({ ...prev, currentView: 'analytics' }));
          break;
        case 'r':
          refreshData();
          break;
      }
    };

    process.stdin.on('keypress', handleKeypress);
    return () => {
      process.stdin.removeListener('keypress', handleKeypress);
    };
  }, [exit, refreshData]);

  const renderCurrentView = () => {
    if (state.isLoading && (!tasks.length || !agents.length)) {
      return <Text>Loading dashboard data...</Text>;
    }

    if (state.error) {
      return <Text color="red">Error: {state.error}</Text>;
    }

    switch (state.currentView) {
      case 'overview':
        return systemAnalytics ? (
          <OverviewDashboard
            tasks={tasks}
            agents={agents}
            metrics={systemAnalytics}
          />
        ) : (
          <Text>Loading system metrics...</Text>
        );

      case 'tasks':
        return <TaskDashboard tasks={tasks} agents={agents} />;

      case 'agents':
        return <AgentDashboard agents={agents} tasks={tasks} />;

      case 'analytics':
        return taskAnalytics && agentAnalytics && systemAnalytics ? (
          <AnalyticsDashboard
            taskAnalytics={taskAnalytics}
            agentAnalytics={agentAnalytics}
            systemAnalytics={systemAnalytics}
          />
        ) : (
          <Text>Loading analytics data...</Text>
        );

      default:
        return <Text>Unknown view: {state.currentView}</Text>;
    }
  };

  return (
    <Box flexDirection="column">
      {/* Header */}
      <Box justifyContent="space-between" marginBottom={1}>
        <Text bold>Status Dashboard - {state.currentView.toUpperCase()}</Text>
        <Text dimColor>
          {state.isLoading
            ? '🔄 Refreshing...'
            : `Last: ${state.lastRefresh.toLocaleTimeString()}`}
        </Text>
      </Box>

      {/* Navigation */}
      <Box gap={2} marginBottom={1}>
        <Text color={state.currentView === 'overview' ? 'cyan' : 'gray'}>
          [1] Overview
        </Text>
        <Text color={state.currentView === 'tasks' ? 'cyan' : 'gray'}>
          [2] Tasks
        </Text>
        <Text color={state.currentView === 'agents' ? 'cyan' : 'gray'}>
          [3] Agents
        </Text>
        <Text color={state.currentView === 'analytics' ? 'cyan' : 'gray'}>
          [4] Analytics
        </Text>
        <Text dimColor>[R] Refresh [Ctrl+C] Exit</Text>
      </Box>

      {/* Main Content */}
      <Box flexDirection="column">{renderCurrentView()}</Box>
    </Box>
  );
};

export default StatusDashboard;
