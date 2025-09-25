# Development Best Practices

## Overview

This document outlines the development best practices, coding standards, and guidelines for the Gemini CLI project. Following these practices ensures code quality, maintainability, and consistency across the entire codebase.

## Table of Contents

- [Code Quality Standards](#code-quality-standards)
- [Architecture Principles](#architecture-principles)
- [TypeScript Guidelines](#typescript-guidelines)
- [Testing Best Practices](#testing-best-practices)
- [Documentation Standards](#documentation-standards)
- [Performance Optimization](#performance-optimization)
- [Security Best Practices](#security-best-practices)
- [Error Handling](#error-handling)
- [Git Workflow](#git-workflow)
- [Code Review Guidelines](#code-review-guidelines)

## Code Quality Standards

### General Principles

1. **Write Self-Documenting Code**
   - Use descriptive variable and function names
   - Prefer clarity over cleverness
   - Avoid magic numbers and strings

```typescript
// ❌ Bad
const processData = (d: any, n: number) => {
  return d.filter(x => x.score > n).map(x => ({ ...x, processed: true }));
};

// ✅ Good
const filterHighScoringItems = (items: ScoredItem[], minimumScore: number): ProcessedItem[] => {
  return items
    .filter(item => item.score > minimumScore)
    .map(item => ({ ...item, processed: true }));
};
```

2. **Keep Functions Small and Focused**
   - Single Responsibility Principle
   - Maximum 50 lines per function
   - One level of abstraction per function

```typescript
// ✅ Good - Small, focused functions
const validateUserInput = (input: string): ValidationResult => {
  if (!input.trim()) {
    return { isValid: false, error: 'Input cannot be empty' };
  }
  return { isValid: true };
};

const sanitizeInput = (input: string): string => {
  return input.trim().toLowerCase();
};

const processUserInput = (rawInput: string): ProcessedInput | null => {
  const validation = validateUserInput(rawInput);
  if (!validation.isValid) {
    logger.warn('Invalid user input', { error: validation.error });
    return null;
  }

  const sanitized = sanitizeInput(rawInput);
  return { content: sanitized, timestamp: new Date() };
};
```

3. **Use Consistent Formatting**
   - Prettier for automatic formatting
   - 2-space indentation
   - 80-character line limit for readability

### Naming Conventions

#### TypeScript/JavaScript

```typescript
// Variables and functions: camelCase
const userPreferences = getUserPreferences();
const calculateTotalScore = (items: ScoreItem[]) => { /* ... */ };

// Classes: PascalCase
class ApiResponseHandler { /* ... */ }
class UserAuthenticationService { /* ... */ }

// Constants: UPPER_SNAKE_CASE
const MAX_RETRY_ATTEMPTS = 3;
const DEFAULT_TIMEOUT_MS = 5000;
const API_ENDPOINTS = {
  USERS: '/api/users',
  POSTS: '/api/posts'
};

// Interfaces and Types: PascalCase
interface UserProfile {
  id: string;
  name: string;
  email: string;
}

type ApiResponse<T> = {
  data: T;
  status: number;
  message: string;
};

// Enums: PascalCase
enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed'
}
```

#### Files and Directories

```bash
# Files: kebab-case
user-service.ts
api-client.test.ts
configuration-manager.ts

# Directories: kebab-case
src/
├── user-management/
├── api-services/
└── configuration/
```

### Code Organization

#### Project Structure Patterns

```typescript
// Feature-based organization
src/
├── features/
│   ├── authentication/
│   │   ├── auth.service.ts
│   │   ├── auth.types.ts
│   │   ├── auth.test.ts
│   │   └── index.ts
│   └── user-management/
├── shared/
│   ├── utils/
│   ├── types/
│   └── constants/
└── core/
```

#### Module Structure

```typescript
// index.ts - Clean exports
export { AuthService } from './auth.service';
export { UserService } from './user.service';
export type { AuthConfig, UserProfile } from './types';

// Individual modules - Single responsibility
export class AuthService {
  constructor(
    private config: AuthConfig,
    private apiClient: ApiClient
  ) {}

  async login(credentials: LoginCredentials): Promise<AuthResult> {
    // Implementation
  }
}
```

## Architecture Principles

### 1. Separation of Concerns

```typescript
// ✅ Good - Separated concerns
class UserController {
  constructor(
    private userService: UserService,
    private validator: InputValidator,
    private logger: Logger
  ) {}

  async createUser(userData: CreateUserRequest): Promise<UserResponse> {
    // Controller handles HTTP concerns
    const validation = this.validator.validate(userData);
    if (!validation.isValid) {
      throw new ValidationError(validation.errors);
    }

    try {
      const user = await this.userService.createUser(userData);
      this.logger.info('User created successfully', { userId: user.id });
      return this.formatUserResponse(user);
    } catch (error) {
      this.logger.error('Failed to create user', { error, userData });
      throw new UserCreationError('Failed to create user');
    }
  }
}

class UserService {
  constructor(
    private userRepository: UserRepository,
    private emailService: EmailService
  ) {}

  async createUser(userData: CreateUserRequest): Promise<User> {
    // Service handles business logic
    const existingUser = await this.userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new UserAlreadyExistsError('User with this email already exists');
    }

    const user = await this.userRepository.create(userData);
    await this.emailService.sendWelcomeEmail(user.email);
    return user;
  }
}
```

### 2. Dependency Injection

```typescript
// ✅ Good - Dependency injection
interface Logger {
  info(message: string, meta?: object): void;
  error(message: string, meta?: object): void;
}

interface ApiClient {
  get<T>(url: string): Promise<T>;
  post<T>(url: string, data: unknown): Promise<T>;
}

class GeminiService {
  constructor(
    private apiClient: ApiClient,
    private logger: Logger,
    private config: GeminiConfig
  ) {}

  async sendMessage(message: string): Promise<GeminiResponse> {
    this.logger.info('Sending message to Gemini', { messageLength: message.length });

    try {
      const response = await this.apiClient.post<GeminiResponse>(
        this.config.endpoints.chat,
        { message }
      );

      this.logger.info('Received response from Gemini', {
        responseLength: response.content.length
      });

      return response;
    } catch (error) {
      this.logger.error('Failed to send message to Gemini', { error });
      throw new GeminiApiError('Failed to send message', error);
    }
  }
}
```

### 3. Error-First Design

```typescript
// Result pattern for error handling
type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

const processUserData = async (userData: UserData): Promise<Result<User, ValidationError>> => {
  try {
    const validatedData = validateUserData(userData);
    if (!validatedData.success) {
      return { success: false, error: validatedData.error };
    }

    const user = await createUser(validatedData.data);
    return { success: true, data: user };
  } catch (error) {
    return {
      success: false,
      error: new ValidationError('Failed to process user data', error)
    };
  }
};

// Usage
const result = await processUserData(userData);
if (!result.success) {
  logger.error('User processing failed', { error: result.error });
  return;
}

const user = result.data; // TypeScript knows this is User
```

## TypeScript Guidelines

### 1. Type Safety

```typescript
// ✅ Prefer explicit types for public APIs
interface CreateUserRequest {
  name: string;
  email: string;
  age?: number;
  preferences: UserPreferences;
}

interface UserPreferences {
  theme: 'light' | 'dark';
  notifications: boolean;
  language: SupportedLanguage;
}

type SupportedLanguage = 'en' | 'es' | 'fr' | 'de';

// ✅ Use union types for controlled values
type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

// ✅ Use generics for reusable types
interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
  timestamp: Date;
}

interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
  };
}
```

### 2. Utility Types

```typescript
// ✅ Use utility types for type transformations
interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

// Public user representation (omit sensitive fields)
type PublicUser = Omit<User, 'password'>;

// User creation payload (omit generated fields)
type CreateUserPayload = Omit<User, 'id' | 'createdAt' | 'updatedAt'>;

// User update payload (partial and omit readonly fields)
type UpdateUserPayload = Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>;

// Pick specific fields for listings
type UserSummary = Pick<User, 'id' | 'name' | 'email'>;
```

### 3. Advanced Type Patterns

```typescript
// ✅ Branded types for better type safety
type UserId = string & { __brand: 'UserId' };
type Email = string & { __brand: 'Email' };

const createUserId = (id: string): UserId => id as UserId;
const createEmail = (email: string): Email => {
  if (!isValidEmail(email)) {
    throw new Error('Invalid email format');
  }
  return email as Email;
};

// ✅ Discriminated unions for type narrowing
type ToolResult =
  | { success: true; data: string; executionTime: number }
  | { success: false; error: string; errorCode: string };

const handleToolResult = (result: ToolResult) => {
  if (result.success) {
    // TypeScript knows result.data and result.executionTime are available
    console.log(`Tool executed successfully in ${result.executionTime}ms`);
    return result.data;
  } else {
    // TypeScript knows result.error and result.errorCode are available
    throw new ToolExecutionError(result.error, result.errorCode);
  }
};
```

### 4. Configuration and Environment Types

```typescript
// ✅ Strong typing for configuration
interface GeminiConfig {
  api: {
    baseUrl: string;
    timeout: number;
    retryAttempts: number;
  };
  auth: {
    method: 'oauth' | 'api-key' | 'vertex-ai';
    credentials?: Record<string, string>;
  };
  features: {
    enableDebugLogging: boolean;
    maxContextLength: number;
    enableTools: string[];
  };
}

// Environment variable validation
const validateEnvironment = (): GeminiConfig => {
  const requiredVars = ['GEMINI_API_URL', 'AUTH_METHOD'];
  const missing = requiredVars.filter(name => !process.env[name]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  return {
    api: {
      baseUrl: process.env.GEMINI_API_URL!,
      timeout: Number(process.env.API_TIMEOUT) || 5000,
      retryAttempts: Number(process.env.RETRY_ATTEMPTS) || 3
    },
    auth: {
      method: process.env.AUTH_METHOD as GeminiConfig['auth']['method'],
      credentials: process.env.AUTH_CREDENTIALS ?
        JSON.parse(process.env.AUTH_CREDENTIALS) : undefined
    },
    features: {
      enableDebugLogging: process.env.DEBUG === 'true',
      maxContextLength: Number(process.env.MAX_CONTEXT_LENGTH) || 1000000,
      enableTools: process.env.ENABLED_TOOLS?.split(',') || []
    }
  };
};
```

## Testing Best Practices

### 1. Test Structure and Organization

```typescript
// ✅ Well-structured test file
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { UserService } from '../user.service';
import { UserRepository } from '../user.repository';
import { EmailService } from '../email.service';
import { createMockUser, createMockUserRepository } from '../__mocks__';

describe('UserService', () => {
  let userService: UserService;
  let mockUserRepository: jest.MockedObject<UserRepository>;
  let mockEmailService: jest.MockedObject<EmailService>;

  beforeEach(() => {
    mockUserRepository = createMockUserRepository();
    mockEmailService = {
      sendWelcomeEmail: vi.fn().mockResolvedValue(undefined),
      sendResetEmail: vi.fn().mockResolvedValue(undefined)
    };

    userService = new UserService(mockUserRepository, mockEmailService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create a new user successfully', async () => {
      // Arrange
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'securePassword123'
      };
      const expectedUser = createMockUser(userData);

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(expectedUser);

      // Act
      const result = await userService.createUser(userData);

      // Assert
      expect(result).toEqual(expectedUser);
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(userData.email);
      expect(mockUserRepository.create).toHaveBeenCalledWith(userData);
      expect(mockEmailService.sendWelcomeEmail).toHaveBeenCalledWith(userData.email);
    });

    it('should throw error when user already exists', async () => {
      // Arrange
      const userData = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'password123'
      };
      const existingUser = createMockUser({ email: userData.email });

      mockUserRepository.findByEmail.mockResolvedValue(existingUser);

      // Act & Assert
      await expect(userService.createUser(userData))
        .rejects.toThrow('User with this email already exists');

      expect(mockUserRepository.create).not.toHaveBeenCalled();
      expect(mockEmailService.sendWelcomeEmail).not.toHaveBeenCalled();
    });

    it('should handle repository failures gracefully', async () => {
      // Arrange
      const userData = {
        name: 'Bob Smith',
        email: 'bob@example.com',
        password: 'password456'
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockRejectedValue(new Error('Database connection failed'));

      // Act & Assert
      await expect(userService.createUser(userData))
        .rejects.toThrow('Database connection failed');

      expect(mockEmailService.sendWelcomeEmail).not.toHaveBeenCalled();
    });
  });
});
```

### 2. Integration Testing

```typescript
// ✅ Integration test example
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestApp, TestApp } from '../test-utils/test-app';
import { createTestDatabase, TestDatabase } from '../test-utils/test-database';

describe('User API Integration', () => {
  let app: TestApp;
  let database: TestDatabase;

  beforeAll(async () => {
    database = await createTestDatabase();
    app = await createTestApp({ database });
  });

  afterAll(async () => {
    await app.close();
    await database.close();
  });

  describe('POST /api/users', () => {
    it('should create user and return 201', async () => {
      // Arrange
      const userData = {
        name: 'Integration Test User',
        email: 'integration@test.com',
        password: 'testPassword123'
      };

      // Act
      const response = await app.request
        .post('/api/users')
        .send(userData);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.data).toMatchObject({
        name: userData.name,
        email: userData.email
      });
      expect(response.body.data).not.toHaveProperty('password');

      // Verify database state
      const savedUser = await database.users.findByEmail(userData.email);
      expect(savedUser).toBeTruthy();
      expect(savedUser?.name).toBe(userData.name);
    });
  });
});
```

### 3. Test Utilities and Helpers

```typescript
// test-utils/builders.ts
export class UserBuilder {
  private user: Partial<User> = {};

  withName(name: string): this {
    this.user.name = name;
    return this;
  }

  withEmail(email: string): this {
    this.user.email = email;
    return this;
  }

  withRole(role: UserRole): this {
    this.user.role = role;
    return this;
  }

  build(): User {
    return {
      id: this.user.id || 'test-user-id',
      name: this.user.name || 'Test User',
      email: this.user.email || 'test@example.com',
      role: this.user.role || 'user',
      createdAt: this.user.createdAt || new Date(),
      updatedAt: this.user.updatedAt || new Date()
    };
  }
}

// Usage in tests
const testUser = new UserBuilder()
  .withName('John Doe')
  .withEmail('john@example.com')
  .withRole('admin')
  .build();
```

## Documentation Standards

### 1. Code Documentation

```typescript
/**
 * Processes user authentication and returns session information.
 *
 * This function handles the complete authentication flow including:
 * - Credential validation
 * - Session creation
 * - Security logging
 *
 * @param credentials - User login credentials
 * @param options - Additional authentication options
 * @returns Promise resolving to authentication result
 * @throws {AuthenticationError} When credentials are invalid
 * @throws {RateLimitError} When rate limit is exceeded
 *
 * @example
 * ```typescript
 * const result = await authenticateUser(
 *   { email: 'user@example.com', password: 'password123' },
 *   { rememberMe: true }
 * );
 *
 * if (result.success) {
 *   console.log('User authenticated:', result.session.userId);
 * }
 * ```
 *
 * @since 2.1.0
 */
async function authenticateUser(
  credentials: LoginCredentials,
  options: AuthOptions = {}
): Promise<AuthResult> {
  // Implementation with inline comments for complex logic

  // Validate credentials format before processing
  const validation = validateCredentials(credentials);
  if (!validation.isValid) {
    throw new AuthenticationError('Invalid credential format', validation.errors);
  }

  // Check rate limiting to prevent brute force attacks
  const rateLimitCheck = await checkRateLimit(credentials.email);
  if (!rateLimitCheck.allowed) {
    throw new RateLimitError('Too many login attempts', rateLimitCheck.resetTime);
  }

  // ... rest of implementation
}
```

### 2. README Documentation

```markdown
# Feature Module Name

## Overview
Brief description of what this module does and why it exists.

## Usage

### Basic Usage
\`\`\`typescript
import { FeatureService } from './feature.service';

const service = new FeatureService(config);
const result = await service.processData(inputData);
\`\`\`

### Advanced Usage
\`\`\`typescript
// Example of more complex usage
const service = new FeatureService({
  option1: 'value1',
  option2: true
});

service.on('progress', (progress) => {
  console.log(`Progress: ${progress.percentage}%`);
});

const result = await service.processLargeDataset(data);
\`\`\`

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `timeout` | `number` | `5000` | Timeout in milliseconds |
| `retries` | `number` | `3` | Number of retry attempts |

## Error Handling

The module throws specific error types:

- `ValidationError`: Invalid input data
- `TimeoutError`: Operation timeout
- `NetworkError`: Network connectivity issues

## Testing

\`\`\`bash
npm test src/features/feature-name
\`\`\`

## Contributing

See [Contributing Guidelines](../CONTRIBUTING.md) for details.
```

## Performance Optimization

### 1. Efficient Data Structures

```typescript
// ✅ Use appropriate data structures
class ToolRegistry {
  private toolsMap = new Map<string, Tool>(); // O(1) lookup
  private toolsByCategory = new Map<string, Set<string>>(); // O(1) category lookup

  registerTool(tool: Tool): void {
    this.toolsMap.set(tool.name, tool);

    const categorySet = this.toolsByCategory.get(tool.category) || new Set();
    categorySet.add(tool.name);
    this.toolsByCategory.set(tool.category, categorySet);
  }

  getTool(name: string): Tool | undefined {
    return this.toolsMap.get(name); // O(1)
  }

  getToolsByCategory(category: string): Tool[] {
    const toolNames = this.toolsByCategory.get(category) || new Set();
    return Array.from(toolNames).map(name => this.toolsMap.get(name)!);
  }
}

// ✅ Efficient array operations
const processLargeDataset = (items: DataItem[]): ProcessedItem[] => {
  // Use reduce for single-pass processing when possible
  return items.reduce((processed: ProcessedItem[], item: DataItem) => {
    if (shouldProcess(item)) {
      const processedItem = processItem(item);
      if (processedItem) {
        processed.push(processedItem);
      }
    }
    return processed;
  }, []);
};
```

### 2. Memory Management

```typescript
// ✅ Implement proper cleanup
class EventProcessor {
  private listeners = new Map<string, Set<Function>>();
  private timers = new Set<NodeJS.Timeout>();
  private resources = new Set<{ cleanup: () => void }>();

  async processEvents(events: Event[]): Promise<void> {
    const chunks = this.chunkArray(events, 100); // Process in chunks

    for (const chunk of chunks) {
      await Promise.all(chunk.map(event => this.processEvent(event)));

      // Allow garbage collection between chunks
      await new Promise(resolve => setImmediate(resolve));
    }
  }

  cleanup(): void {
    // Clear all listeners
    this.listeners.clear();

    // Clear all timers
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();

    // Clean up resources
    this.resources.forEach(resource => resource.cleanup());
    this.resources.clear();
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}
```

### 3. Async Operation Optimization

```typescript
// ✅ Optimize concurrent operations
class DataProcessor {
  private concurrencyLimit = 10;

  async processItemsConcurrently<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    options: { concurrency?: number; batchSize?: number } = {}
  ): Promise<R[]> {
    const { concurrency = this.concurrencyLimit, batchSize = 100 } = options;

    const results: R[] = [];
    const batches = this.createBatches(items, batchSize);

    for (const batch of batches) {
      const batchResults = await this.processBatchWithConcurrency(
        batch,
        processor,
        concurrency
      );
      results.push(...batchResults);
    }

    return results;
  }

  private async processBatchWithConcurrency<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    concurrency: number
  ): Promise<R[]> {
    const semaphore = new Semaphore(concurrency);

    const promises = items.map(async (item) => {
      await semaphore.acquire();
      try {
        return await processor(item);
      } finally {
        semaphore.release();
      }
    });

    return Promise.all(promises);
  }
}

class Semaphore {
  private permits: number;
  private waitQueue: Array<() => void> = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return;
    }

    return new Promise<void>((resolve) => {
      this.waitQueue.push(resolve);
    });
  }

  release(): void {
    if (this.waitQueue.length > 0) {
      const next = this.waitQueue.shift()!;
      next();
    } else {
      this.permits++;
    }
  }
}
```

## Security Best Practices

### 1. Input Validation

```typescript
// ✅ Comprehensive input validation
import { z } from 'zod';

const CreateUserSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name too long')
    .regex(/^[a-zA-Z\s]+$/, 'Name contains invalid characters'),

  email: z.string()
    .email('Invalid email format')
    .max(255, 'Email too long'),

  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'),

  age: z.number()
    .int('Age must be an integer')
    .min(13, 'Must be at least 13 years old')
    .max(120, 'Invalid age')
    .optional()
});

const validateCreateUser = (data: unknown): CreateUserRequest => {
  try {
    return CreateUserSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid user data', error.errors);
    }
    throw error;
  }
};

// Sanitize inputs
const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Basic XSS prevention
    .slice(0, 1000); // Prevent extremely long inputs
};
```

### 2. Secure API Handling

```typescript
// ✅ Secure API key handling
class ApiKeyManager {
  private static readonly API_KEY_PATTERN = /^[A-Za-z0-9_-]{32,}$/;

  static validateApiKey(apiKey: string): boolean {
    return this.API_KEY_PATTERN.test(apiKey);
  }

  static maskApiKey(apiKey: string): string {
    if (apiKey.length < 8) return '***';
    return apiKey.slice(0, 4) + '*'.repeat(apiKey.length - 8) + apiKey.slice(-4);
  }

  static getApiKey(): string | null {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return null;
    }

    if (!this.validateApiKey(apiKey)) {
      throw new SecurityError('Invalid API key format');
    }

    return apiKey;
  }
}

// ✅ Rate limiting
class RateLimiter {
  private requestCounts = new Map<string, { count: number; resetTime: number }>();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests = 100, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  checkLimit(identifier: string): { allowed: boolean; resetTime?: number } {
    const now = Date.now();
    const record = this.requestCounts.get(identifier);

    if (!record || now > record.resetTime) {
      this.requestCounts.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs
      });
      return { allowed: true };
    }

    if (record.count >= this.maxRequests) {
      return { allowed: false, resetTime: record.resetTime };
    }

    record.count++;
    return { allowed: true };
  }
}
```

## Error Handling

### 1. Error Hierarchy

```typescript
// ✅ Well-structured error hierarchy
abstract class GeminiError extends Error {
  abstract readonly code: string;
  abstract readonly category: ErrorCategory;
  readonly timestamp = new Date();
  readonly context: Record<string, unknown>;

  constructor(message: string, context: Record<string, unknown> = {}) {
    super(message);
    this.name = this.constructor.name;
    this.context = context;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      category: this.category,
      context: this.context,
      timestamp: this.timestamp,
      stack: this.stack
    };
  }
}

class ValidationError extends GeminiError {
  readonly code = 'VALIDATION_ERROR';
  readonly category = ErrorCategory.USER_INPUT;

  constructor(message: string, public readonly errors: ValidationIssue[]) {
    super(message, { errors });
  }
}

class ApiError extends GeminiError {
  readonly code = 'API_ERROR';
  readonly category = ErrorCategory.API_ERROR;

  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly response?: unknown
  ) {
    super(message, { statusCode, response });
  }
}

class ToolExecutionError extends GeminiError {
  readonly code = 'TOOL_EXECUTION_ERROR';
  readonly category = ErrorCategory.TOOL_ERROR;

  constructor(
    message: string,
    public readonly toolName: string,
    public readonly toolArgs?: unknown
  ) {
    super(message, { toolName, toolArgs });
  }
}

enum ErrorCategory {
  USER_INPUT = 'user_input',
  API_ERROR = 'api_error',
  TOOL_ERROR = 'tool_error',
  SYSTEM_ERROR = 'system_error',
  NETWORK_ERROR = 'network_error'
}
```

### 2. Error Recovery

```typescript
// ✅ Robust error recovery
class ResilientApiClient {
  constructor(
    private config: ApiConfig,
    private logger: Logger
  ) {}

  async makeRequest<T>(
    url: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const maxRetries = options.retries ?? this.config.defaultRetries;
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const delay = this.calculateBackoffDelay(attempt);
          await this.wait(delay);
          this.logger.info('Retrying request', { url, attempt, delay });
        }

        const response = await this.executeRequest<T>(url, options);

        if (attempt > 0) {
          this.logger.info('Request succeeded after retries', { url, attempt });
        }

        return response;
      } catch (error) {
        lastError = error as Error;
        this.logger.warn('Request attempt failed', {
          url,
          attempt,
          error: error instanceof Error ? error.message : 'Unknown error'
        });

        if (!this.isRetriableError(error)) {
          break;
        }
      }
    }

    this.logger.error('Request failed after all retries', {
      url,
      attempts: maxRetries + 1,
      error: lastError.message
    });

    throw new ApiError(`Request failed after ${maxRetries + 1} attempts`, 0, lastError);
  }

  private calculateBackoffDelay(attempt: number): number {
    // Exponential backoff with jitter
    const baseDelay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
    const jitter = Math.random() * 0.1 * baseDelay;
    return baseDelay + jitter;
  }

  private isRetriableError(error: unknown): boolean {
    if (error instanceof ApiError) {
      return error.statusCode >= 500 || error.statusCode === 429;
    }
    return true; // Retry network errors by default
  }

  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

This comprehensive best practices guide provides the foundation for maintaining high code quality and consistency across the Gemini CLI project. Following these practices ensures that the codebase remains maintainable, secure, and performant as it continues to grow and evolve.