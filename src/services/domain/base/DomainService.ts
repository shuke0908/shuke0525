import { EventEmitter } from 'events';

// 도메인 이벤트 인터페이스
export interface DomainEvent {
  id: string;
  aggregateId: string;
  aggregateType: string;
  eventType: string;
  eventData: any;
  timestamp: Date;
  version: number;
}

// 도메인 엔티티 기본 클래스
export abstract class DomainEntity {
  protected id: string;
  protected createdAt: Date;
  protected updatedAt: Date;
  protected version: number;
  private domainEvents: DomainEvent[] = [];

  constructor(id: string) {
    this.id = id;
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.version = 1;
  }

  getId(): string {
    return this.id;
  }

  getVersion(): number {
    return this.version;
  }

  // 도메인 이벤트 추가
  protected addDomainEvent(eventType: string, eventData: any): void {
    const event: DomainEvent = {
      id: Math.random().toString(36).substr(2, 9),
      aggregateId: this.id,
      aggregateType: this.constructor.name,
      eventType,
      eventData,
      timestamp: new Date(),
      version: this.version,
    };

    this.domainEvents.push(event);
  }

  // 도메인 이벤트 조회
  getDomainEvents(): DomainEvent[] {
    return [...this.domainEvents];
  }

  // 도메인 이벤트 클리어
  clearDomainEvents(): void {
    this.domainEvents = [];
  }

  // 버전 증가
  protected incrementVersion(): void {
    this.version++;
    this.updatedAt = new Date();
  }
}

// 값 객체 기본 클래스
export abstract class ValueObject {
  abstract equals(_other: ValueObject): boolean;
  abstract toString(): string;
}

// 리포지토리 인터페이스
export interface Repository<T extends DomainEntity> {
  findById(_id: string): Promise<T | null>;
  findAll(_criteria?: any): Promise<T[]>;
  save(_entity: T): Promise<T>;
  delete(_id: string): Promise<void>;
  count(_criteria?: any): Promise<number>;
}

// 도메인 서비스 결과
export interface ServiceResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: string[];
  metadata?: {
    timestamp: Date;
    operation: string;
    duration?: number;
  };
}

// 페이지네이션 정보
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// 페이지네이션된 결과
export interface PaginatedResult<T> {
  data: T[];
  pagination: PaginationInfo;
}

// 도메인 서비스 기본 클래스
export abstract class DomainService extends EventEmitter {
  protected logger: Logger;

  constructor(logger?: Logger) {
    super();
    this.logger = logger || new ConsoleLogger();
  }

  // 성공 결과 생성
  protected success<T>(data?: T, operation?: string): ServiceResult<T> {
    const result: ServiceResult<T> = {
      success: true,
      metadata: {
        timestamp: new Date(),
        operation: operation || 'unknown',
      },
    };
    
    if (data !== undefined) {
      result.data = data;
    }
    
    return result;
  }

  // 실패 결과 생성
  protected failure(
    error: string,
    errors?: string[],
    operation?: string
  ): ServiceResult {
    const operationName = operation || 'unknown';
    this.logger.error(
      `Domain service error in ${operationName}:`,
      error
    );

    const result: ServiceResult<any> = {
      success: false,
      error: error,
      metadata: {
        timestamp: new Date(),
        operation: operationName,
      }
    };
    
    if (errors) {
      result.errors = errors;
    }
    
    return result;
  }

  // 비즈니스 규칙 검증
  protected validateBusinessRules(
    rules: (() => boolean)[],
    errorMessages: string[]
  ): string[] {
    const violations: string[] = [];

    rules.forEach((rule, index) => {
      if (!rule()) {
        violations.push(errorMessages[index] || 'Validation error');
      }
    });

    return violations;
  }

  // 도메인 이벤트 발행
  protected publishDomainEvent(event: DomainEvent): void {
    this.logger.info(`Publishing domain event: ${event.eventType}`);
    this.emit('domainEvent', event);
  }

  // 도메인 이벤트 배치 발행
  protected publishDomainEvents(events: DomainEvent[]): void {
    events.forEach(event => this.publishDomainEvent(event));
  }

  // 트랜잭션 실행
  protected async executeInTransaction<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<ServiceResult<T>> {
    const startTime = Date.now();

    try {
      this.logger.info(`Starting transaction: ${operationName}`);

      const result = await operation();

      const duration = Date.now() - startTime;
      this.logger.info(
        `Transaction completed: ${operationName} (${duration}ms)`
      );

      return {
        success: true,
        data: result,
        metadata: {
          timestamp: new Date(),
          operation: operationName,
          duration,
        },
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `Transaction failed: ${operationName} (${duration}ms)`,
        error
      );

      return {
        success: false,
        error: error?.message || 'Transaction failed',
        metadata: {
          timestamp: new Date(),
          operation: operationName,
          duration,
        },
      };
    }
  }

  // 페이지네이션 헬퍼
  protected createPaginationInfo(
    page: number,
    limit: number,
    total: number
  ): PaginationInfo {
    const totalPages = Math.ceil(total / limit);

    return {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }

  // 입력 검증
  protected validateInput(_input: any, rules: ValidationRule[]): string[] {
    const errors: string[] = [];

    rules.forEach(rule => {
      if (!rule.validate(_input)) {
        errors.push(rule.message);
      }
    });

    return errors;
  }
}

// 검증 규칙 인터페이스
export interface ValidationRule {
  validate(_input: any): boolean;
  message: string;
}

// 공통 검증 규칙들
export class ValidationRules {
  static required(field: string): ValidationRule {
    return {
      validate: (input: any) =>
        input &&
        input[field] !== undefined &&
        input[field] !== null &&
        input[field] !== '',
      message: `${field}은(는) 필수 항목입니다.`,
    };
  }

  static minLength(field: string, min: number): ValidationRule {
    return {
      validate: (input: any) => !input[field] || input[field].length >= min,
      message: `${field}은(는) 최소 ${min}자 이상이어야 합니다.`,
    };
  }

  static maxLength(field: string, max: number): ValidationRule {
    return {
      validate: (input: any) => !input[field] || input[field].length <= max,
      message: `${field}은(는) 최대 ${max}자 이하여야 합니다.`,
    };
  }

  static email(field: string): ValidationRule {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return {
      validate: (input: any) => !input[field] || emailRegex.test(input[field]),
      message: `${field}은(는) 올바른 이메일 형식이어야 합니다.`,
    };
  }

  static numeric(field: string): ValidationRule {
    return {
      validate: (input: any) => !input[field] || !isNaN(Number(input[field])),
      message: `${field}은(는) 숫자여야 합니다.`,
    };
  }

  static positiveNumber(field: string): ValidationRule {
    return {
      validate: (input: any) => !input[field] || Number(input[field]) > 0,
      message: `${field}은(는) 양수여야 합니다.`,
    };
  }

  static custom(
    field: string,
    validator: (_value: any) => boolean,
    message: string
  ): ValidationRule {
    return {
      validate: (input: any) => !input[field] || validator(input[field]),
      message,
    };
  }
}

// 로거 인터페이스
export interface Logger {
  info(_message: string, ..._args: any[]): void;
  warn(_message: string, ..._args: any[]): void;
  error(_message: string, _error?: any): void;
  debug(_message: string, ..._args: any[]): void;
}

// 콘솔 로거 구현
export class ConsoleLogger implements Logger {
  info(_message: string, ..._args: any[]): void {
    console.log(`[INFO] ${new Date().toISOString()} - ${_message}`, ..._args);
  }

  warn(_message: string, ..._args: any[]): void {
    console.warn(`[WARN] ${new Date().toISOString()} - ${_message}`, ..._args);
  }

  error(_message: string, _error?: any): void {
    console.error(`[ERROR] ${new Date().toISOString()} - ${_message}`, _error);
  }

  debug(_message: string, ..._args: any[]): void {
    console.debug(`[DEBUG] ${new Date().toISOString()} - ${_message}`, ..._args);
  }
}

// 구조화된 로거 구현
export class StructuredLogger implements Logger {
  private serviceName: string;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }

  private log(level: string, message: string, data?: any): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.serviceName,
      message,
      data,
    };

    console.log(JSON.stringify(logEntry));
  }
  info(_message: string, ..._args: any[]): void {
    this.log('INFO', _message, _args.length > 0 ? _args : undefined);
  }

  warn(_message: string, ..._args: any[]): void {
    this.log('WARN', _message, _args.length > 0 ? _args : undefined);
  }
  error(_message: string, _error?: any): void {
    this.log('ERROR', _message, _error);
  }

  debug(_message: string, ..._args: any[]): void {
    this.log('DEBUG', _message, _args.length > 0 ? _args : undefined);
  }
}
// 도메인 이벤트 핸들러 인터페이스
export interface DomainEventHandler {
  handle(_event: DomainEvent): Promise<void>;
  canHandle(_eventType: string): boolean;
}

// 도메인 이벤트 디스패처
export class DomainEventDispatcher {
  private handlers: DomainEventHandler[] = [];

  registerHandler(handler: DomainEventHandler): void {
    this.handlers.push(handler);
  }

  async dispatch(event: DomainEvent): Promise<void> {
    const applicableHandlers = this.handlers.filter(handler =>
      handler.canHandle(event.eventType)
    );

    await Promise.all(applicableHandlers.map(handler => handler.handle(event)));
  }
}
