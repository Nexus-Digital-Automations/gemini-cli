/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import { useState, useEffect, useCallback } from 'react';
import { Box, Text, useApp } from 'ink';
import {
  TaskStatusMonitor,
  TaskStatus,
  taskStatusMonitor,
} from './TaskStatusMonitor.js';
import {
  StatusHistoryAnalytics,
  statusHistoryAnalytics,
} from './StatusHistoryAnalytics.js';
import {
  NotificationSystem,
  notificationSystem,
} from './NotificationSystem.js';
/**
 * ASCII-based Chart Components for Terminal Display
 */
const BarChart = ({ data, title, maxWidth = 40 }) => {
  const maxValue = Math.max(...Object.values(data));
  const scale = maxWidth / maxValue;
  return _jsxs(Box, {
    flexDirection: 'column',
    children: [
      _jsx(Text, { bold: true, children: title }),
      Object.entries(data).map(([label, value]) => {
        const barLength = Math.max(1, Math.floor(value * scale));
        const bar = '█'.repeat(barLength);
        return _jsxs(
          Box,
          {
            gap: 1,
            children: [
              _jsx(Text, { dimColor: true, children: label.padEnd(12) }),
              _jsx(Text, { color: 'blue', children: bar }),
              _jsxs(Text, { dimColor: true, children: ['(', value, ')'] }),
            ],
          },
          label,
        );
      }),
    ],
  });
};
const ProgressBar = ({
  current,
  total,
  label,
  color = 'green',
  width = 30,
}) => {
  const percentage = total > 0 ? (current / total) * 100 : 0;
  const filledWidth = Math.floor((percentage / 100) * width);
  const emptyWidth = width - filledWidth;
  return _jsxs(Box, {
    gap: 1,
    children: [
      _jsx(Text, { dimColor: true, children: label.padEnd(15) }),
      _jsx(Text, { color, children: '█'.repeat(filledWidth) }),
      _jsx(Text, { dimColor: true, children: '░'.repeat(emptyWidth) }),
      _jsxs(Text, {
        dimColor: true,
        children: [current, '/', total, ' (', percentage.toFixed(1), '%)'],
      }),
    ],
  });
};
const MetricCard = ({ title, value, unit = '', trend, color = 'white' }) => {
  const trendSymbol = trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→';
  const trendColor =
    trend === 'up' ? 'green' : trend === 'down' ? 'red' : 'yellow';
  return _jsxs(Box, {
    flexDirection: 'column',
    borderStyle: 'single',
    paddingX: 1,
    children: [
      _jsx(Text, { dimColor: true, children: title }),
      _jsxs(Box, {
        gap: 1,
        children: [
          _jsxs(Text, { color, bold: true, children: [value, unit] }),
          trend && _jsx(Text, { color: trendColor, children: trendSymbol }),
        ],
      }),
    ],
  });
};
/**
 * Overview Dashboard - System Status Summary
 */
const OverviewDashboard = ({ tasks, agents, metrics }) => {
  const taskCounts = tasks.reduce((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
  }, {});
  const agentCounts = agents.reduce((acc, agent) => {
    acc[agent.status] = (acc[agent.status] || 0) + 1;
    return acc;
  }, {});
  return _jsxs(Box, {
    flexDirection: 'column',
    gap: 1,
    children: [
      _jsx(Text, {
        bold: true,
        color: 'cyan',
        children: '\uD83D\uDE80 Real-Time Task Status Monitoring Dashboard',
      }),
      _jsxs(Text, {
        dimColor: true,
        children: ['Last updated: ', new Date().toLocaleString()],
      }),
      _jsxs(Box, {
        gap: 2,
        marginTop: 1,
        children: [
          _jsx(MetricCard, {
            title: 'System Efficiency',
            value: metrics.systemEfficiency.toFixed(1),
            unit: '%',
            trend:
              metrics.trends.taskCompletionTrend === 'improving'
                ? 'up'
                : metrics.trends.taskCompletionTrend === 'declining'
                  ? 'down'
                  : 'stable',
            color: 'green',
          }),
          _jsx(MetricCard, {
            title: 'Active Agents',
            value: agentCounts.active || 0,
            unit: `/${agents.length}`,
            color: 'blue',
          }),
          _jsx(MetricCard, {
            title: 'Total Events',
            value: metrics.totalEvents.toLocaleString(),
            color: 'yellow',
          }),
          _jsx(MetricCard, {
            title: 'Events/Hour',
            value: metrics.eventsPerHour.toFixed(1),
            color: 'magenta',
          }),
        ],
      }),
      _jsx(Box, {
        marginTop: 1,
        children: _jsx(BarChart, {
          data: {
            Queued: taskCounts[TaskStatus.QUEUED] || 0,
            'In Progress': taskCounts[TaskStatus.IN_PROGRESS] || 0,
            Completed: taskCounts[TaskStatus.COMPLETED] || 0,
            Failed: taskCounts[TaskStatus.FAILED] || 0,
            Blocked: taskCounts[TaskStatus.BLOCKED] || 0,
          },
          title: '\uD83D\uDCCA Task Status Distribution',
        }),
      }),
      _jsx(Box, {
        marginTop: 1,
        children: _jsx(BarChart, {
          data: agentCounts,
          title: '\uD83E\uDD16 Agent Status Distribution',
        }),
      }),
      metrics.bottlenecks.length > 0 &&
        _jsxs(Box, {
          flexDirection: 'column',
          marginTop: 1,
          children: [
            _jsx(Text, {
              bold: true,
              color: 'red',
              children: '\u26A0\uFE0F System Alerts',
            }),
            metrics.bottlenecks.slice(0, 3).map((bottleneck, index) =>
              _jsxs(
                Box,
                {
                  children: [
                    _jsx(Text, { color: 'red', children: '\u2022' }),
                    _jsxs(Text, {
                      dimColor: true,
                      children: [' ', bottleneck.description],
                    }),
                  ],
                },
                index,
              ),
            ),
          ],
        }),
    ],
  });
};
/**
 * Task Details Dashboard
 */
const TaskDashboard = ({ tasks, agents }) => {
  const [selectedTask, setSelectedTask] = useState(null);
  const [sortBy, setSortBy] = useState('priority');
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
  const getStatusColor = (status) => {
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
  const getPriorityColor = (priority) => {
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
  return _jsxs(Box, {
    flexDirection: 'column',
    gap: 1,
    children: [
      _jsx(Text, {
        bold: true,
        color: 'cyan',
        children: '\uD83D\uDCCB Task Management Dashboard',
      }),
      _jsxs(Box, {
        gap: 2,
        children: [
          _jsx(ProgressBar, {
            current: tasks.filter((t) => t.status === TaskStatus.COMPLETED)
              .length,
            total: tasks.length,
            label: 'Completed',
            color: 'green',
          }),
          _jsx(ProgressBar, {
            current: tasks.filter((t) => t.status === TaskStatus.IN_PROGRESS)
              .length,
            total: tasks.length,
            label: 'In Progress',
            color: 'yellow',
          }),
          _jsx(ProgressBar, {
            current: tasks.filter((t) => t.status === TaskStatus.FAILED).length,
            total: tasks.length,
            label: 'Failed',
            color: 'red',
          }),
        ],
      }),
      _jsxs(Box, {
        flexDirection: 'column',
        marginTop: 1,
        children: [
          _jsxs(Text, {
            bold: true,
            children: ['Recent Tasks (sorted by ', sortBy, '):'],
          }),
          sortedTasks.slice(0, 10).map((task) =>
            _jsxs(
              Box,
              {
                gap: 1,
                children: [
                  _jsx(Text, {
                    color: getStatusColor(task.status),
                    children: '\u25CF',
                  }),
                  _jsxs(Text, {
                    color: getPriorityColor(task.priority),
                    children: ['[', task.priority.toUpperCase(), ']'],
                  }),
                  _jsxs(Text, {
                    children: [task.title.substring(0, 40), '...'],
                  }),
                  _jsx(Text, {
                    dimColor: true,
                    children: task.assignedAgent
                      ? `@${task.assignedAgent}`
                      : 'unassigned',
                  }),
                  _jsxs(Text, {
                    dimColor: true,
                    children: [task.progress, '%'],
                  }),
                ],
              },
              task.id,
            ),
          ),
        ],
      }),
      _jsx(Box, {
        marginTop: 1,
        children: _jsx(BarChart, {
          data: tasks.reduce((acc, task) => {
            acc[task.type] = (acc[task.type] || 0) + 1;
            return acc;
          }, {}),
          title: '\uD83D\uDCC8 Tasks by Type',
        }),
      }),
    ],
  });
};
/**
 * Agent Performance Dashboard
 */
const AgentDashboard = ({ agents, tasks }) => {
  const getAgentTasks = (agentId) =>
    tasks.filter((task) => task.assignedAgent === agentId);
  const getPerformanceColor = (successRate) => {
    if (successRate >= 90) return 'green';
    if (successRate >= 70) return 'yellow';
    return 'red';
  };
  const sortedAgents = [...agents].sort(
    (a, b) => b.performance.successRate - a.performance.successRate,
  );
  return _jsxs(Box, {
    flexDirection: 'column',
    gap: 1,
    children: [
      _jsx(Text, {
        bold: true,
        color: 'cyan',
        children: '\uD83E\uDD16 Agent Performance Dashboard',
      }),
      _jsxs(Box, {
        gap: 2,
        children: [
          _jsx(MetricCard, {
            title: 'Total Agents',
            value: agents.length,
            color: 'blue',
          }),
          _jsx(MetricCard, {
            title: 'Active Agents',
            value: agents.filter(
              (a) => a.status === 'active' || a.status === 'busy',
            ).length,
            color: 'green',
          }),
          _jsx(MetricCard, {
            title: 'Idle Agents',
            value: agents.filter((a) => a.status === 'idle').length,
            color: 'yellow',
          }),
          _jsx(MetricCard, {
            title: 'Offline Agents',
            value: agents.filter((a) => a.status === 'offline').length,
            color: 'red',
          }),
        ],
      }),
      _jsxs(Box, {
        flexDirection: 'column',
        marginTop: 1,
        children: [
          _jsx(Text, {
            bold: true,
            children: '\uD83C\uDFC6 Top Performing Agents:',
          }),
          sortedAgents.slice(0, 8).map((agent) => {
            const agentTasks = getAgentTasks(agent.id);
            return _jsxs(
              Box,
              {
                gap: 1,
                children: [
                  _jsx(Text, {
                    color: getPerformanceColor(agent.performance.successRate),
                    children: '\u25CF',
                  }),
                  _jsx(Text, {
                    children: agent.id.substring(0, 20).padEnd(20),
                  }),
                  _jsxs(Text, {
                    color: getPerformanceColor(agent.performance.successRate),
                    children: [agent.performance.successRate.toFixed(1), '%'],
                  }),
                  _jsxs(Text, {
                    dimColor: true,
                    children: [
                      '(',
                      agent.completedTasks,
                      ' completed, ',
                      agentTasks.length,
                      ' current)',
                    ],
                  }),
                  _jsxs(Text, {
                    dimColor: true,
                    children: [
                      '[',
                      agent.capabilities.slice(0, 2).join(', '),
                      ']',
                    ],
                  }),
                ],
              },
              agent.id,
            );
          }),
        ],
      }),
      _jsx(Box, {
        marginTop: 1,
        children: _jsx(BarChart, {
          data: agents.reduce((acc, agent) => {
            acc[agent.status] = (acc[agent.status] || 0) + 1;
            return acc;
          }, {}),
          title: '\uD83D\uDCCA Agent Status Distribution',
        }),
      }),
      _jsx(Box, {
        marginTop: 1,
        children: _jsx(BarChart, {
          data: agents.reduce((acc, agent) => {
            agent.capabilities.forEach((cap) => {
              acc[cap] = (acc[cap] || 0) + 1;
            });
            return acc;
          }, {}),
          title: '\uD83D\uDEE0\uFE0F  Agent Capabilities',
        }),
      }),
    ],
  });
};
/**
 * Analytics Dashboard with Time-Series Data
 */
const AnalyticsDashboard = ({
  taskAnalytics,
  agentAnalytics,
  systemAnalytics,
}) => {
  const [timeframe, setTimeframe] = useState('24h');
  return _jsxs(Box, {
    flexDirection: 'column',
    gap: 1,
    children: [
      _jsx(Text, {
        bold: true,
        color: 'cyan',
        children: '\uD83D\uDCC8 Analytics Dashboard',
      }),
      _jsxs(Box, {
        gap: 2,
        marginTop: 1,
        children: [
          _jsx(MetricCard, {
            title: 'Completion Rate',
            value: taskAnalytics.completionRate.toFixed(1),
            unit: '%',
            trend:
              taskAnalytics.completionRate > 0.8
                ? 'up'
                : taskAnalytics.completionRate > 0.6
                  ? 'stable'
                  : 'down',
            color: 'green',
          }),
          _jsx(MetricCard, {
            title: 'Failure Rate',
            value: taskAnalytics.failureRate.toFixed(1),
            unit: '%',
            trend:
              taskAnalytics.failureRate < 0.1
                ? 'up'
                : taskAnalytics.failureRate < 0.2
                  ? 'stable'
                  : 'down',
            color: 'red',
          }),
          _jsx(MetricCard, {
            title: 'Avg Completion Time',
            value: Math.round(taskAnalytics.averageCompletionTime / 1000 / 60),
            unit: 'min',
            color: 'blue',
          }),
          _jsx(MetricCard, {
            title: 'Agent Efficiency',
            value: agentAnalytics.averageTasksPerAgent.toFixed(1),
            unit: ' tasks/agent',
            color: 'yellow',
          }),
        ],
      }),
      _jsxs(Box, {
        flexDirection: 'column',
        marginTop: 1,
        children: [
          _jsxs(Text, {
            bold: true,
            children: [
              '\u23F1\uFE0F Task Completion Timeline (Last ',
              timeframe,
              '):',
            ],
          }),
          taskAnalytics.timeSeriesData.slice(-10).map((dataPoint, index) =>
            _jsxs(
              Box,
              {
                gap: 1,
                children: [
                  _jsx(Text, {
                    dimColor: true,
                    children: dataPoint.timestamp
                      .toLocaleTimeString()
                      .substring(0, 5),
                  }),
                  _jsx(Text, {
                    color: 'green',
                    children: '█'.repeat(Math.max(1, dataPoint.completed)),
                  }),
                  _jsx(Text, {
                    color: 'red',
                    children: '█'.repeat(Math.max(1, dataPoint.failed)),
                  }),
                  _jsxs(Text, {
                    dimColor: true,
                    children: [
                      '(',
                      dataPoint.completed,
                      '\u2713 ',
                      dataPoint.failed,
                      '\u2717)',
                    ],
                  }),
                ],
              },
              index,
            ),
          ),
        ],
      }),
      _jsx(Box, {
        marginTop: 1,
        children: _jsx(BarChart, {
          data: taskAnalytics.tasksByPriority,
          title: '\uD83C\uDFAF Tasks by Priority',
        }),
      }),
      _jsxs(Box, {
        flexDirection: 'column',
        marginTop: 1,
        children: [
          _jsx(Text, { bold: true, children: '\uD83D\uDCCA System Trends:' }),
          _jsxs(Box, {
            gap: 1,
            children: [
              _jsx(Text, { children: 'Task Completion:' }),
              _jsx(Text, {
                color:
                  systemAnalytics.trends.taskCompletionTrend === 'improving'
                    ? 'green'
                    : systemAnalytics.trends.taskCompletionTrend === 'declining'
                      ? 'red'
                      : 'yellow',
                children: systemAnalytics.trends.taskCompletionTrend,
              }),
            ],
          }),
          _jsxs(Box, {
            gap: 1,
            children: [
              _jsx(Text, { children: 'Agent Utilization:' }),
              _jsx(Text, {
                color:
                  systemAnalytics.trends.agentUtilizationTrend === 'improving'
                    ? 'green'
                    : systemAnalytics.trends.agentUtilizationTrend ===
                        'declining'
                      ? 'red'
                      : 'yellow',
                children: systemAnalytics.trends.agentUtilizationTrend,
              }),
            ],
          }),
          _jsxs(Box, {
            gap: 1,
            children: [
              _jsx(Text, { children: 'Error Rate:' }),
              _jsx(Text, {
                color:
                  systemAnalytics.trends.errorRateTrend === 'improving'
                    ? 'green'
                    : systemAnalytics.trends.errorRateTrend === 'declining'
                      ? 'red'
                      : 'yellow',
                children: systemAnalytics.trends.errorRateTrend,
              }),
            ],
          }),
        ],
      }),
    ],
  });
};
/**
 * Main Status Dashboard Component
 */
export const StatusDashboard = ({
  autoRefresh = true,
  refreshInterval = 5000,
  initialView = 'overview',
}) => {
  const { exit } = useApp();
  const [state, setState] = useState({
    currentView: initialView,
    refreshInterval,
    lastRefresh: new Date(),
    isLoading: false,
  });
  const [tasks, setTasks] = useState([]);
  const [agents, setAgents] = useState([]);
  const [taskAnalytics, setTaskAnalytics] = useState(null);
  const [agentAnalytics, setAgentAnalytics] = useState(null);
  const [systemAnalytics, setSystemAnalytics] = useState(null);
  const refreshData = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: undefined }));
    try {
      // Get current data from monitors
      const currentTasks = taskStatusMonitor.getAllTasks();
      const currentAgents = taskStatusMonitor.getAllAgents();
      setTasks(currentTasks);
      setAgents(currentAgents);
      // Get analytics data
      const timeframe = {
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
    const handleKeypress = (str, key) => {
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
      return _jsx(Text, { children: 'Loading dashboard data...' });
    }
    if (state.error) {
      return _jsxs(Text, { color: 'red', children: ['Error: ', state.error] });
    }
    switch (state.currentView) {
      case 'overview':
        return systemAnalytics
          ? _jsx(OverviewDashboard, {
              tasks,
              agents,
              metrics: systemAnalytics,
            })
          : _jsx(Text, { children: 'Loading system metrics...' });
      case 'tasks':
        return _jsx(TaskDashboard, { tasks, agents });
      case 'agents':
        return _jsx(AgentDashboard, { agents, tasks });
      case 'analytics':
        return taskAnalytics && agentAnalytics && systemAnalytics
          ? _jsx(AnalyticsDashboard, {
              taskAnalytics,
              agentAnalytics,
              systemAnalytics,
            })
          : _jsx(Text, { children: 'Loading analytics data...' });
      default:
        return _jsxs(Text, { children: ['Unknown view: ', state.currentView] });
    }
  };
  return _jsxs(Box, {
    flexDirection: 'column',
    children: [
      _jsxs(Box, {
        justifyContent: 'space-between',
        marginBottom: 1,
        children: [
          _jsxs(Text, {
            bold: true,
            children: ['Status Dashboard - ', state.currentView.toUpperCase()],
          }),
          _jsx(Text, {
            dimColor: true,
            children: state.isLoading
              ? '🔄 Refreshing...'
              : `Last: ${state.lastRefresh.toLocaleTimeString()}`,
          }),
        ],
      }),
      _jsxs(Box, {
        gap: 2,
        marginBottom: 1,
        children: [
          _jsx(Text, {
            color: state.currentView === 'overview' ? 'cyan' : 'gray',
            children: '[1] Overview',
          }),
          _jsx(Text, {
            color: state.currentView === 'tasks' ? 'cyan' : 'gray',
            children: '[2] Tasks',
          }),
          _jsx(Text, {
            color: state.currentView === 'agents' ? 'cyan' : 'gray',
            children: '[3] Agents',
          }),
          _jsx(Text, {
            color: state.currentView === 'analytics' ? 'cyan' : 'gray',
            children: '[4] Analytics',
          }),
          _jsx(Text, { dimColor: true, children: '[R] Refresh [Ctrl+C] Exit' }),
        ],
      }),
      _jsx(Box, { flexDirection: 'column', children: renderCurrentView() }),
    ],
  });
};
export default StatusDashboard;
//# sourceMappingURL=StatusDashboard.js.map
