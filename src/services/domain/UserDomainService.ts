import {
  DomainService,
  DomainEntity,
  type ServiceResult,
  type PaginatedResult,
  ValidationRules,
  StructuredLogger,
} from './base/DomainService';

// 사용자 도메인 엔티티
export class UserDomainEntity extends DomainEntity {
  private email: string;
  private firstName: string;
  private lastName: string;
  private role: 'user' | 'admin' | 'superadmin';
  private balance: number;
  private kycStatus: 'pending' | 'approved' | 'rejected' | 'not_started';
  private isActive: boolean;
  private lastLogin: Date | null;
  private failedLoginAttempts: number;
  private isLocked: boolean;
  private lockedUntil: Date | null;

  constructor(
    id: string,
    email: string,
    firstName: string,
    lastName: string,
    role: 'user' | 'admin' | 'superadmin' = 'user'
  ) {
    super(id);
    this.email = email;
    this.firstName = firstName;
    this.lastName = lastName;
    this.role = role;
    this.balance = 0;
    this.kycStatus = 'not_started';
    this.isActive = true;
    this.lastLogin = null;
    this.failedLoginAttempts = 0;
    this.isLocked = false;
    this.lockedUntil = null;

    this.addDomainEvent('UserCreated', {
      userId: id,
      email,
      role,
    });
  }

  // 비즈니스 로직 메서드들
  updateProfile(firstName: string, lastName: string): void {
    this.firstName = firstName;
    this.lastName = lastName;
    this.incrementVersion();

    this.addDomainEvent('UserProfileUpdated', {
      userId: this.id,
      firstName,
      lastName,
    });
  }

  updateBalance(amount: number, reason: string): boolean {
    const newBalance = this.balance + amount;

    if (newBalance < 0) {
      this.addDomainEvent('BalanceUpdateFailed', {
        userId: this.id,
        currentBalance: this.balance,
        attemptedChange: amount,
        reason: 'Insufficient funds',
      });
      return false;
    }

    const oldBalance = this.balance;
    this.balance = newBalance;
    this.incrementVersion();

    this.addDomainEvent('BalanceUpdated', {
      userId: this.id,
      oldBalance,
      newBalance,
      change: amount,
      reason,
    });

    return true;
  }

  updateKycStatus(
    status: 'pending' | 'approved' | 'rejected',
    notes?: string
  ): void {
    const oldStatus = this.kycStatus;
    this.kycStatus = status;
    this.incrementVersion();

    this.addDomainEvent('KycStatusUpdated', {
      userId: this.id,
      oldStatus,
      newStatus: status,
      notes,
    });
  }

  recordSuccessfulLogin(): void {
    this.lastLogin = new Date();
    this.failedLoginAttempts = 0;
    this.isLocked = false;
    this.lockedUntil = null;
    this.incrementVersion();

    this.addDomainEvent('UserLoggedIn', {
      userId: this.id,
      timestamp: this.lastLogin,
    });
  }

  recordFailedLogin(): boolean {
    this.failedLoginAttempts++;

    const maxAttempts = 5;
    if (this.failedLoginAttempts >= maxAttempts) {
      this.isLocked = true;
      this.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30분 잠금

      this.addDomainEvent('UserAccountLocked', {
        userId: this.id,
        attemptCount: this.failedLoginAttempts,
        lockedUntil: this.lockedUntil,
      });
    }

    this.incrementVersion();

    this.addDomainEvent('UserLoginFailed', {
      userId: this.id,
      attemptCount: this.failedLoginAttempts,
      isLocked: this.isLocked,
    });

    return this.isLocked;
  }

  deactivate(reason: string): void {
    this.isActive = false;
    this.incrementVersion();

    this.addDomainEvent('UserDeactivated', {
      userId: this.id,
      reason,
    });
  }

  activate(): void {
    this.isActive = true;
    this.incrementVersion();

    this.addDomainEvent('UserActivated', {
      userId: this.id,
    });
  }

  // 비즈니스 규칙 검증
  canPerformTrade(): boolean {
    return this.isActive && !this.isLocked && this.kycStatus === 'approved';
  }

  canWithdraw(amount: number): boolean {
    return (
      this.isActive &&
      !this.isLocked &&
      this.kycStatus === 'approved' &&
      this.balance >= amount
    );
  }

  isAccountLocked(): boolean {
    if (!this.isLocked) return false;

    if (this.lockedUntil && Date.now() > this.lockedUntil.getTime()) {
      this.isLocked = false;
      this.lockedUntil = null;
      this.failedLoginAttempts = 0;
      return false;
    }

    return true;
  }

  // Getter 메서드들
  getEmail(): string {
    return this.email;
  }
  getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
  getBalance(): number {
    return this.balance;
  }
  getRole(): string {
    return this.role;
  }
  getKycStatus(): string {
    return this.kycStatus;
  }
  isUserActive(): boolean {
    return this.isActive;
  }
}

// 사용자 도메인 서비스
export class UserDomainService extends DomainService {
  constructor() {
    super(new StructuredLogger('UserDomainService'));
  }

  async createUser(userData: {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    role?: 'user' | 'admin';
  }): Promise<ServiceResult<UserDomainEntity>> {
    return this.executeInTransaction(async () => {
      // 입력 검증
      const validationErrors = this.validateInput(userData, [
        ValidationRules.required('email'),
        ValidationRules.email('email'),
        ValidationRules.required('firstName'),
        ValidationRules.minLength('firstName', 2),
        ValidationRules.required('lastName'),
        ValidationRules.minLength('lastName', 2),
        ValidationRules.required('password'),
        ValidationRules.minLength('password', 8),
      ]);

      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join(', '));
      }

      // 비즈니스 규칙 검증
      const businessRuleViolations = this.validateBusinessRules(
        [
          () => this.isEmailUnique(userData.email),
          () => this.isPasswordSecure(userData.password),
        ],
        [
          '이미 사용 중인 이메일입니다.',
          '비밀번호가 보안 요구사항을 만족하지 않습니다.',
        ]
      );

      if (businessRuleViolations.length > 0) {
        throw new Error(businessRuleViolations.join(', '));
      }

      // 사용자 엔티티 생성
      const userId = this.generateUserId();
      const user = new UserDomainEntity(
        userId,
        userData.email,
        userData.firstName,
        userData.lastName,
        userData.role || 'user'
      );

      // 도메인 이벤트 발행
      this.publishDomainEvents(user.getDomainEvents());
      user.clearDomainEvents();

      return user;
    }, 'CreateUser');
  }

  async authenticateUser(
    email: string,
    password: string
  ): Promise<
    ServiceResult<{
      user: UserDomainEntity;
      token: string;
    }>
  > {
    return this.executeInTransaction(async () => {
      // 사용자 조회
      const user = await this.findUserByEmail(email);
      if (!user) {
        throw new Error('사용자를 찾을 수 없습니다.');
      }

      // 계정 잠금 확인
      if (user.isAccountLocked()) {
        throw new Error('계정이 잠겨있습니다. 나중에 다시 시도해주세요.');
      }

      // 비밀번호 검증
      const isPasswordValid = await this.verifyPassword(password, user.getId());
      if (!isPasswordValid) {
        user.recordFailedLogin();
        this.publishDomainEvents(user.getDomainEvents());
        user.clearDomainEvents();
        throw new Error('잘못된 비밀번호입니다.');
      }

      // 성공적인 로그인 기록
      user.recordSuccessfulLogin();
      this.publishDomainEvents(user.getDomainEvents());
      user.clearDomainEvents();

      // JWT 토큰 생성
      const token = await this.generateAuthToken(user);

      return { user, token };
    }, 'AuthenticateUser');
  }

  async updateUserProfile(
    userId: string,
    profileData: {
      firstName?: string;
      lastName?: string;
    }
  ): Promise<ServiceResult<UserDomainEntity>> {
    return this.executeInTransaction(async () => {
      const user = await this.findUserById(userId);
      if (!user) {
        throw new Error('사용자를 찾을 수 없습니다.');
      }

      if (profileData.firstName && profileData.lastName) {
        user.updateProfile(profileData.firstName, profileData.lastName);
        this.publishDomainEvents(user.getDomainEvents());
        user.clearDomainEvents();
      }

      return user;
    }, 'UpdateUserProfile');
  }

  async adjustUserBalance(
    userId: string,
    amount: number,
    reason: string
  ): Promise<ServiceResult<UserDomainEntity>> {
    return this.executeInTransaction(async () => {
      const user = await this.findUserById(userId);
      if (!user) {
        throw new Error('사용자를 찾을 수 없습니다.');
      }

      const success = user.updateBalance(amount, reason);
      if (!success) {
        throw new Error('잔액이 부족합니다.');
      }

      this.publishDomainEvents(user.getDomainEvents());
      user.clearDomainEvents();

      return user;
    }, 'AdjustUserBalance');
  }

  async updateKycStatus(
    userId: string,
    status: 'pending' | 'approved' | 'rejected',
    notes?: string
  ): Promise<ServiceResult<UserDomainEntity>> {
    return this.executeInTransaction(async () => {
      const user = await this.findUserById(userId);
      if (!user) {
        throw new Error('사용자를 찾을 수 없습니다.');
      }

      user.updateKycStatus(status, notes);
      this.publishDomainEvents(user.getDomainEvents());
      user.clearDomainEvents();

      return user;
    }, 'UpdateKycStatus');
  }

  async getUsersByRole(
    role: string,
    page: number = 1,
    limit: number = 10
  ): Promise<ServiceResult<PaginatedResult<UserDomainEntity>>> {
    return this.executeInTransaction(async () => {
      const users = await this.findUsersByRole(role, page, limit);
      const total = await this.countUsersByRole(role);

      const pagination = this.createPaginationInfo(page, limit, total);

      return {
        data: users,
        pagination,
      };
    }, 'GetUsersByRole');
  }

  async deactivateUser(
    userId: string,
    reason: string
  ): Promise<ServiceResult<UserDomainEntity>> {
    return this.executeInTransaction(async () => {
      const user = await this.findUserById(userId);
      if (!user) {
        throw new Error('사용자를 찾을 수 없습니다.');
      }

      user.deactivate(reason);
      this.publishDomainEvents(user.getDomainEvents());
      user.clearDomainEvents();

      return user;
    }, 'DeactivateUser');
  }

  // 헬퍼 메서드들 (실제 구현에서는 리포지토리와 외부 서비스 호출)
  private async findUserByEmail(
    _email: string
  ): Promise<UserDomainEntity | null> {
    // 리포지토리에서 사용자 조회
    // 실제 구현에서는 UserRepository를 주입받아 사용
    return null; // 임시 구현
  }

  private async findUserById(_userId: string): Promise<UserDomainEntity | null> {
    // 실제 구현에서는 데이터베이스에서 사용자 조회
    return null;
  }

  private async findUsersByRole(
    _role: string,
    _page: number,
    _limit: number
  ): Promise<UserDomainEntity[]> {
    // 실제 구현에서는 데이터베이스에서 역할별 사용자 조회
    return [];
  }

  private async countUsersByRole(_role: string): Promise<number> {
    // 실제 구현에서는 데이터베이스에서 역할별 사용자 수 조회
    return 0;
  }

  private isEmailUnique(_email: string): boolean {
    // 실제 구현에서는 데이터베이스에서 이메일 중복 확인
    return true;
  }

  private isPasswordSecure(password: string): boolean {
    // 비밀번호 보안 요구사항 확인
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return (
      password.length >= 8 &&
      hasUpperCase &&
      hasLowerCase &&
      hasNumbers &&
      hasSpecialChar
    );
  }

  private generateUserId(): string {
    return 'user_' + Math.random().toString(36).substr(2, 9);
  }

  private async verifyPassword(
    _password: string,
    _userId: string
  ): Promise<boolean> {
    // 비밀번호 검증 (해시 비교)
    return true; // 임시 구현
  }

  private async generateAuthToken(_user: UserDomainEntity): Promise<string> {
    // JWT 토큰 생성
    return 'auth_token_' + Math.random().toString(36).substr(2, 9); // 임시 구현
  }

  // private async _sendWelcomeEmail(
  //   _email: string
  // ): Promise<ServiceResult<void>> {
  //   // 이메일 전송 로직을 구현해야 합니다.
  //   return { success: true };
  // }

  // private async _hashPassword(
  //   _password: string,
  //   _userId: string
  // ): Promise<string> {
  //   // 비밀번호 해싱 로직 구현
  //   return 'hashed_password';
  // }
}
