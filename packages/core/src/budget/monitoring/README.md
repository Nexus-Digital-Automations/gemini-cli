# Real-Time Token Usage Monitoring System

A comprehensive token usage tracking and analytics system for the Gemini CLI budget management infrastructure. This system provides real-time monitoring, metrics collection, cost analysis, and performance optimization for API usage.

## 🚀 Features

### Core Components

- **TokenTracker**: Real-time request lifecycle tracking with cost calculations
- **MetricsCollector**: Advanced data collection and statistical analysis
- **UsageCalculator**: Sophisticated cost computation engine with model-specific pricing
- **BudgetEventManager**: Event-driven architecture for system coordination
- **QuotaManager**: Rate limiting and quota enforcement
- **TokenDataAggregator**: Time-series data aggregation and trend analysis
- **RealTimeStreamingService**: Live data streaming with WebSocket-like capabilities
- **TokenUsageCache**: High-performance caching with LRU eviction and compression
- **Integration Layer**: Seamless integration with existing Gemini API infrastructure

### Advanced Features

- 📊 **Real-time Analytics**: Live monitoring of token usage, costs, and performance
- 🎯 **Anomaly Detection**: Automatic detection of unusual usage patterns
- ⚡ **Performance Optimization**: Intelligent caching and data aggregation
- 🔄 **Event-Driven Architecture**: Reactive system with comprehensive event handling
- 📈 **Trend Analysis**: Historical data analysis and forecasting
- 💰 **Cost Attribution**: Feature-level cost tracking and analysis
- 🛡️ **Rate Limiting**: Configurable quota management and enforcement
- 🗄️ **Data Persistence**: Configurable data retention and storage
- 🔌 **Plugin Architecture**: Extensible system with custom integrations

## 📦 Installation

The monitoring system is included as part of the core budget infrastructure:

```typescript
import {
  TokenMonitoringIntegration,
  createMonitoringEnabledContentGenerator,
  MonitoringPresets,
} from '@google/genai-cli/budget';
```

## 🎯 Quick Start

### Basic Integration

```typescript
import { createMonitoringEnabledContentGenerator, MonitoringPresets } from '@google/genai-cli/budget';

// Create monitoring-enabled content generator
const { contentGenerator, integration } = await createMonitoringEnabledContentGenerator(
  baseContentGenerator,
  config,
  budgetSettings,
  MonitoringPresets.Production
);

// Use the wrapped generator for automatic token tracking
const response = await contentGenerator.generateContent(request, promptId);

// Access monitoring statistics
const stats = integration.getMonitoringStats();
console.log(`Total requests: ${stats.tokenTracker.totalRequests}`);
```

### Advanced Configuration

```typescript
import {
  TokenMonitoringIntegration,
  TokenTracker,
  MetricsCollector,
  RealTimeStreamingService,
  TokenUsageCache,
  CachePresets
} from '@google/genai-cli/budget';

// Create custom integration
const integration = new TokenMonitoringIntegration(config, budgetSettings, {
  enableTokenTracking: true,
  enableMetricsCollection: true,
  enableStreaming: true,
  enableQuotaManagement: true,
  enableCaching: true,
  cacheConfig: CachePresets.HighPerformance,
  streamingConfig: {
    enableCompression: true,
    maxBufferSize: 10000,
    updateFrequency: 1000, // 1 second
  },
  metricsInterval: 30000, // 30 seconds
});

await integration.initialize();
```

## 🔧 Components Overview

### TokenTracker

Tracks individual API requests throughout their lifecycle:

```typescript
const tracker = new TokenTracker({
  enableDetailedTracking: true,
  trackCosts: true,
  trackPerformance: true,
  sessionId: 'my-session',
});

// Start tracking a request
tracker.startRequest('req-123', 'gemini-2.5-flash', 'chat', 'session-1');

// Complete tracking with response
await tracker.completeRequest('req-123', response);

// Get usage statistics
const stats = tracker.getUsageStats();
console.log(`Total tokens: ${stats.totalTokens}`);
```

### MetricsCollector

Collects and analyzes usage metrics:

```typescript
const collector = new MetricsCollector({
  collectionInterval: 30000,
  enableStatisticalAnalysis: true,
  enableAnomalyDetection: true,
  retentionPeriod: 7 * 24 * 60 * 60 * 1000, // 7 days
});

collector.start();

// Listen for anomalies
collector.on('anomaly-detected', (anomaly) => {
  console.log('Anomaly detected:', anomaly);
});

// Get comprehensive metrics
const summary = collector.getMetricsSummary();
const analysis = collector.performStatisticalAnalysis();
```

### TokenUsageCache

High-performance caching with advanced features:

```typescript
const cache = new TokenUsageCache({
  maxEntries: 10000,
  maxSizeBytes: 100 * 1024 * 1024, // 100MB
  enableCompression: true,
  enableLRU: true,
});

// Store with options
cache.set('usage-stats', data, {
  ttl: 60000, // 1 minute
  priority: CachePriority.HIGH,
  tags: ['usage', 'session-1'],
});

// Retrieve
const cachedData = cache.get('usage-stats');

// Tag-based clearing
cache.clear(['session-1']);
```

### RealTimeStreamingService

Live data streaming capabilities:

```typescript
const streaming = new RealTimeStreamingService({
  enableCompression: true,
  maxBufferSize: 5000,
});

streaming.start();

// Subscribe to live updates
const subscriptionId = streaming.subscribe({
  streamType: 'token-usage',
  filter: { model: 'gemini-2.5-flash' },
  updateFrequency: 1000,
});

// Broadcast updates
await streaming.broadcastUpdate('token-usage', {
  type: 'request-completed',
  data: usageData,
});
```

## 📊 Monitoring and Analytics

### Real-Time Dashboard Data

```typescript
// Get comprehensive monitoring stats
const stats = integration.getMonitoringStats();

console.log('System Overview:', {
  totalRequests: stats.tokenTracker.totalRequests,
  successRate: stats.tokenTracker.successfulRequests / stats.tokenTracker.totalRequests,
  averageResponseTime: stats.tokenTracker.averageResponseTime,
  totalCost: stats.tokenTracker.totalCost,
  cacheHitRatio: stats.cache?.hitRatio || 0,
});

// Model-specific breakdown
Object.entries(stats.tokenTracker.modelUsage).forEach(([model, usage]) => {
  console.log(`${model}:`, {
    requests: usage.requests,
    avgTokens: usage.totalTokens / usage.requests,
    avgCost: usage.cost / usage.requests,
  });
});
```

### Historical Analysis

```typescript
const aggregator = integration.getAggregator();

// Get windowed data for trend analysis
const hourlyData = aggregator.getWindowedData({
  type: 'fixed',
  duration: 60 * 60 * 1000, // 1 hour
  interval: 5 * 60 * 1000,   // 5 minute intervals
});

// Analyze usage patterns
const trendAnalysis = aggregator.analyzeTrends(hourlyData);
console.log('Usage trends:', trendAnalysis);
```

## ⚡ Performance Optimization

### Caching Strategies

```typescript
// Use preset configurations for different scenarios
const prodCache = new TokenUsageCache(CachePresets.HighPerformance);
const devCache = new TokenUsageCache(CachePresets.Development);
const memoryConstrainedCache = new TokenUsageCache(CachePresets.MemoryEfficient);

// Custom cache key strategies
const keys = CacheKeys;
const usageKey = keys.tokenUsage('session-123', 'hourly');
const modelKey = keys.modelUsage('gemini-2.5-flash', 'daily');
```

### Quota Management

```typescript
const quotaManager = integration.getQuotaManager();

// Add quota limits
quotaManager.addQuotaLimit({
  type: 'daily-requests',
  limit: 1000,
  window: 24 * 60 * 60 * 1000, // 24 hours
});

// Check if request is allowed
const validation = await quotaManager.checkRequestAllowed('api-request', 1);
if (!validation.allowed) {
  console.log('Request blocked:', validation.message);
}
```

## 🔌 Event System

### Event Handling

```typescript
const eventManager = integration.getEventManager();

// Subscribe to specific events
const subscriptionId = eventManager.subscribe({
  eventTypes: ['usage_updated', 'limit_exceeded'],
  handler: (event) => {
    console.log('Budget event:', event);
  },
});

// Add routing rules
eventManager.addRoutingRule({
  condition: { severity: 'error' },
  handler: (event) => {
    // Send alerts for error events
    sendAlert(event);
  },
});

// Emit custom events
eventManager.emitBudgetEvent({
  type: 'custom_metric',
  timestamp: new Date(),
  data: { customData: 'value' },
  source: 'my-component',
  severity: 'info',
});
```

## 🧪 Testing

The monitoring system includes comprehensive tests:

```bash
# Run all monitoring tests
npm test packages/core/src/budget/monitoring

# Run specific test suites
npm test integration.test.ts
npm test token-tracker.test.ts
npm test metrics-collector.test.ts
npm test cache.test.ts

# Run with coverage
npm run test:coverage
```

### Test Utilities

```typescript
// Use provided test utilities
const mockData = global.generateTokenUsageData(100);
const executionTime = await global.measureExecutionTime(async () => {
  // Performance test code
});

// Event collection for testing
const events = await global.collectEvents(emitter, 'request-completed', 5000);
```

## 🛠️ Configuration

### Environment-Based Configuration

```typescript
import { MonitoringUtils } from '@google/genai-cli/budget';

// Create configuration for different environments
const integration = await MonitoringUtils.createForEnvironment(
  config,
  budgetSettings,
  process.env.NODE_ENV // 'production', 'development', or 'testing'
);

// Setup with error handling
const { contentGenerator, integration } = await MonitoringUtils.setupWithErrorHandling(
  baseContentGenerator,
  config,
  budgetSettings,
  (error) => {
    console.error('Monitoring setup failed:', error);
    // Fallback handling
  }
);
```

### Health Monitoring

```typescript
import { MonitoringHealthChecker } from '@google/genai-cli/budget';

const healthChecker = new MonitoringHealthChecker(integration);

// Perform comprehensive health check
const healthResult = await healthChecker.performHealthCheck();

if (!healthResult.healthy) {
  console.warn('System health issues:', healthResult.components);
  console.log('Recommendations:', healthResult.recommendations);
}
```

## 📈 Advanced Use Cases

### Custom Analytics Pipeline

```typescript
// Create custom metrics collector
const collector = new MetricsCollector({
  enableStatisticalAnalysis: true,
  customAnalyzers: [
    (dataPoints) => {
      // Custom analysis logic
      return {
        customMetric: calculateCustomMetric(dataPoints),
      };
    },
  ],
});

// Integration with external analytics
collector.on('metrics-collected', (summary) => {
  // Send to external analytics service
  analyticsService.track('token-usage', summary);
});
```

### Multi-Tenant Usage Tracking

```typescript
// Track usage per tenant/user
const tenantTracker = new TokenTracker({
  enableDetailedTracking: true,
  customDimensions: ['tenantId', 'userId'],
});

// Start request with tenant context
tenantTracker.startRequest('req-123', 'gemini-2.5-flash', 'chat', sessionId, {
  tenantId: 'tenant-abc',
  userId: 'user-123',
});

// Get tenant-specific statistics
const tenantStats = tenantTracker.getUsageStats({
  groupBy: ['tenantId'],
  filter: { tenantId: 'tenant-abc' },
});
```

## 🔍 Troubleshooting

### Common Issues

**High Memory Usage**
```typescript
// Use memory-efficient configuration
const integration = new TokenMonitoringIntegration(config, budgetSettings, {
  ...MonitoringPresets.MemoryEfficient,
  cacheConfig: {
    maxSizeBytes: 10 * 1024 * 1024, // 10MB limit
  },
});
```

**Performance Issues**
```typescript
// Optimize for high-frequency operations
const integration = new TokenMonitoringIntegration(config, budgetSettings, {
  enableCaching: true,
  metricsInterval: 60000, // Reduce frequency
  cacheConfig: CachePresets.HighPerformance,
});
```

**Event System Overload**
```typescript
// Configure event buffering
const eventManager = new BudgetEventManager({
  enableEventBuffering: true,
  maxEventBuffer: 1000,
  bufferFlushInterval: 5000,
});
```

## 📝 API Reference

### Core Classes

- **TokenMonitoringIntegration**: Main integration orchestrator
- **TokenTracker**: Request lifecycle tracking
- **MetricsCollector**: Data collection and analysis
- **UsageCalculator**: Cost computation engine
- **BudgetEventManager**: Event system management
- **QuotaManager**: Rate limiting and quota enforcement
- **TokenDataAggregator**: Data aggregation and trends
- **RealTimeStreamingService**: Live data streaming
- **TokenUsageCache**: High-performance caching

### Factory Functions

- `createTokenMonitoringIntegration()`: Create integration instance
- `createMonitoringEnabledContentGenerator()`: Wrap content generator
- `createTokenUsageCache()`: Create cache instance

### Utility Classes

- **MonitoringHealthChecker**: System health monitoring
- **MonitoringUtils**: Environment-based setup utilities

### Configuration Presets

- **MonitoringPresets**: Pre-configured monitoring setups
- **CachePresets**: Cache configuration presets
- **CacheKeys**: Consistent cache key generation

## 🤝 Contributing

The monitoring system is designed to be extensible. To add custom components:

1. Implement the relevant interfaces (e.g., `EventHandler`, `CacheStorage`)
2. Register components with the integration system
3. Add comprehensive tests
4. Update documentation

## 📄 License

Copyright 2025 Google LLC - Licensed under Apache 2.0