/**
 * Fine-grained RBAC (Role-Based Access Control) 시스템
 * 기능별/책임별 세분화된 권한 관리
 */

import { z } from 'zod';

// 권한 정의
export const PERMISSIONS = {
  // 사용자 관리 권한
  'users:read': '사용자 정보 조회',
  'users:write': '사용자 정보 수정',
  'users:create': '사용자 생성',
  'users:delete': '사용자 삭제',
  'users:ban': '사용자 차단/해제',
  'users:balance': '사용자 잔액 조회',
  'users:balance:adjust': '사용자 잔액 조정',
  'users:kyc': 'KYC 상태 관리',
  'users:vip': 'VIP 레벨 관리',
  'users:password:reset': '비밀번호 재설정',
  'users:2fa:manage': '2FA 관리',

  // 거래 관리 권한
  'trades:read': '거래 내역 조회',
  'trades:write': '거래 실행',
  'trades:cancel': '거래 취소',
  'trades:admin': '거래 결과 조작',
  'trades:settings': '거래 설정 관리',
  'trades:analytics': '거래 분석',
  'trades:flash:read': 'Flash Trade 조회',
  'trades:flash:admin': 'Flash Trade 관리',
  'trades:quick:read': 'Quick Trade 조회',
  'trades:quick:admin': 'Quick Trade 관리',
  'trades:quant:read': 'Quant AI 조회',
  'trades:quant:admin': 'Quant AI 관리',

  // 지갑 관리 권한
  'wallet:read': '지갑 정보 조회',
  'wallet:deposit:read': '입금 내역 조회',
  'wallet:deposit:approve': '입금 승인',
  'wallet:deposit:reject': '입금 거절',
  'wallet:withdraw:read': '출금 내역 조회',
  'wallet:withdraw:approve': '출금 승인',
  'wallet:withdraw:reject': '출금 거절',
  'wallet:transactions': '거래 내역 관리',
  'wallet:addresses': '지갑 주소 관리',

  // KYC 관리 권한
  'kyc:read': 'KYC 문서 조회',
  'kyc:approve': 'KYC 승인',
  'kyc:reject': 'KYC 거절',
  'kyc:documents': 'KYC 문서 관리',
  'kyc:settings': 'KYC 설정 관리',

  // 시스템 관리 권한
  'system:settings:read': '시스템 설정 조회',
  'system:settings:write': '시스템 설정 수정',
  'system:maintenance': '유지보수 모드',
  'system:backup': '백업 관리',
  'system:logs': '시스템 로그 조회',
  'system:monitoring': '시스템 모니터링',
  'system:security': '보안 설정 관리',

  // 관리자 관리 권한
  'admin:read': '관리자 정보 조회',
  'admin:create': '관리자 생성',
  'admin:update': '관리자 정보 수정',
  'admin:delete': '관리자 삭제',
  'admin:permissions': '관리자 권한 관리',
  'admin:roles': '역할 관리',

  // 분석 및 보고서 권한
  'analytics:read': '분석 데이터 조회',
  'analytics:export': '분석 데이터 내보내기',
  'reports:read': '보고서 조회',
  'reports:create': '보고서 생성',
  'reports:export': '보고서 내보내기',

  // 고객 지원 권한
  'support:tickets:read': '지원 티켓 조회',
  'support:tickets:write': '지원 티켓 응답',
  'support:tickets:assign': '지원 티켓 할당',
  'support:tickets:close': '지원 티켓 종료',
  'support:chat': '실시간 채팅 지원',

  // 알림 관리 권한
  'notifications:read': '알림 조회',
  'notifications:send': '알림 발송',
  'notifications:broadcast': '전체 알림 발송',
  'notifications:templates': '알림 템플릿 관리',

  // 콘텐츠 관리 권한
  'content:announcements': '공지사항 관리',
  'content:faq': 'FAQ 관리',
  'content:pages': '페이지 관리',
  'content:media': '미디어 관리',

  // 감사 및 로그 권한
  'audit:read': '감사 로그 조회',
  'audit:export': '감사 로그 내보내기',
  'logs:system': '시스템 로그 조회',
  'logs:security': '보안 로그 조회',
  'logs:trading': '거래 로그 조회',
} as const;

export type Permission = keyof typeof PERMISSIONS;

// 역할 정의
export const ROLES = {
  // 일반 사용자
  user: {
    name: '일반 사용자',
    description: '기본 거래 및 지갑 기능 사용',
    permissions: [
      'trades:read',
      'trades:write',
      'wallet:read',
      'wallet:deposit:read',
      'wallet:withdraw:read',
    ] as Permission[],
  },

  // 고객 지원팀
  support: {
    name: '고객 지원',
    description: '고객 문의 처리 및 기본 지원',
    permissions: [
      'users:read',
      'users:kyc',
      'trades:read',
      'wallet:read',
      'wallet:deposit:read',
      'wallet:withdraw:read',
      'kyc:read',
      'support:tickets:read',
      'support:tickets:write',
      'support:tickets:assign',
      'support:tickets:close',
      'support:chat',
      'notifications:read',
    ] as Permission[],
  },

  // 분석가
  analyst: {
    name: '분석가',
    description: '데이터 분석 및 보고서 작성',
    permissions: [
      'users:read',
      'trades:read',
      'trades:analytics',
      'wallet:read',
      'analytics:read',
      'analytics:export',
      'reports:read',
      'reports:create',
      'reports:export',
      'logs:trading',
    ] as Permission[],
  },

  // 거래 관리자
  trading_admin: {
    name: '거래 관리자',
    description: '거래 시스템 관리 및 설정',
    permissions: [
      'users:read',
      'users:balance',
      'trades:read',
      'trades:write',
      'trades:cancel',
      'trades:admin',
      'trades:settings',
      'trades:analytics',
      'trades:flash:read',
      'trades:flash:admin',
      'trades:quick:read',
      'trades:quick:admin',
      'trades:quant:read',
      'trades:quant:admin',
      'analytics:read',
      'logs:trading',
    ] as Permission[],
  },

  // 재무 관리자
  finance_admin: {
    name: '재무 관리자',
    description: '입출금 및 재무 관리',
    permissions: [
      'users:read',
      'users:balance',
      'users:balance:adjust',
      'wallet:read',
      'wallet:deposit:read',
      'wallet:deposit:approve',
      'wallet:deposit:reject',
      'wallet:withdraw:read',
      'wallet:withdraw:approve',
      'wallet:withdraw:reject',
      'wallet:transactions',
      'wallet:addresses',
      'kyc:read',
      'kyc:approve',
      'kyc:reject',
      'analytics:read',
      'reports:read',
      'logs:system',
    ] as Permission[],
  },

  // 일반 관리자
  admin: {
    name: '일반 관리자',
    description: '대부분의 관리 기능 접근',
    permissions: [
      'users:read',
      'users:write',
      'users:ban',
      'users:balance',
      'users:balance:adjust',
      'users:kyc',
      'users:vip',
      'trades:read',
      'trades:write',
      'trades:cancel',
      'trades:admin',
      'trades:settings',
      'trades:analytics',
      'trades:flash:read',
      'trades:flash:admin',
      'trades:quick:read',
      'trades:quick:admin',
      'trades:quant:read',
      'trades:quant:admin',
      'wallet:read',
      'wallet:deposit:read',
      'wallet:deposit:approve',
      'wallet:deposit:reject',
      'wallet:withdraw:read',
      'wallet:withdraw:approve',
      'wallet:withdraw:reject',
      'wallet:transactions',
      'kyc:read',
      'kyc:approve',
      'kyc:reject',
      'kyc:documents',
      'system:settings:read',
      'system:logs',
      'system:monitoring',
      'analytics:read',
      'analytics:export',
      'reports:read',
      'reports:create',
      'reports:export',
      'support:tickets:read',
      'support:tickets:write',
      'support:tickets:assign',
      'support:tickets:close',
      'notifications:read',
      'notifications:send',
      'content:announcements',
      'content:faq',
      'audit:read',
      'logs:system',
      'logs:security',
      'logs:trading',
    ] as Permission[],
  },

  // 슈퍼 관리자
  superadmin: {
    name: '슈퍼 관리자',
    description: '모든 시스템 권한',
    permissions: Object.keys(PERMISSIONS) as Permission[],
  },
} as const;

export type Role = keyof typeof ROLES;

// 사용자 권한 인터페이스
export interface UserPermissions {
  userId: string;
  role: Role;
  customPermissions: Permission[];
  deniedPermissions: Permission[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

// 권한 검증 스키마
export const permissionSchema = z.object({
  userId: z.string(),
  role: z.enum(Object.keys(ROLES) as [Role, ...Role[]]),
  customPermissions: z.array(z.enum(Object.keys(PERMISSIONS) as [Permission, ...Permission[]])).default([]),
  deniedPermissions: z.array(z.enum(Object.keys(PERMISSIONS) as [Permission, ...Permission[]])).default([]),
});

// 권한 관리 클래스
export class PermissionManager {
  private userPermissions = new Map<string, UserPermissions>();

  // 사용자 권한 설정
  setUserPermissions(permissions: UserPermissions): void {
    this.userPermissions.set(permissions.userId, permissions);
  }

  // 사용자 권한 조회
  getUserPermissions(userId: string): UserPermissions | null {
    return this.userPermissions.get(userId) || null;
  }

  // 사용자의 모든 권한 계산
  calculateUserPermissions(userId: string): Permission[] {
    const userPerms = this.getUserPermissions(userId);
    if (!userPerms) return [];

    // 역할 기본 권한
    const rolePermissions = ROLES[userPerms.role].permissions;

    // 커스텀 권한 추가
    const allPermissions = new Set([...rolePermissions, ...userPerms.customPermissions]);

    // 거부된 권한 제거
    userPerms.deniedPermissions.forEach(perm => allPermissions.delete(perm));

    return Array.from(allPermissions);
  }

  // 권한 확인
  hasPermission(userId: string, permission: Permission): boolean {
    const userPermissions = this.calculateUserPermissions(userId);
    return userPermissions.includes(permission);
  }

  // 다중 권한 확인
  hasPermissions(userId: string, permissions: Permission[]): boolean {
    const userPermissions = this.calculateUserPermissions(userId);
    return permissions.every(perm => userPermissions.includes(perm));
  }

  // 권한 중 하나라도 있는지 확인
  hasAnyPermission(userId: string, permissions: Permission[]): boolean {
    const userPermissions = this.calculateUserPermissions(userId);
    return permissions.some(perm => userPermissions.includes(perm));
  }

  // 역할 변경
  changeUserRole(userId: string, newRole: Role, changedBy: string): boolean {
    const userPerms = this.getUserPermissions(userId);
    if (!userPerms) return false;

    userPerms.role = newRole;
    userPerms.updatedAt = new Date();
    userPerms.createdBy = changedBy;

    this.setUserPermissions(userPerms);
    return true;
  }

  // 커스텀 권한 추가
  addCustomPermission(userId: string, permission: Permission, addedBy: string): boolean {
    const userPerms = this.getUserPermissions(userId);
    if (!userPerms) return false;

    if (!userPerms.customPermissions.includes(permission)) {
      userPerms.customPermissions.push(permission);
      userPerms.updatedAt = new Date();
      userPerms.createdBy = addedBy;
      this.setUserPermissions(userPerms);
    }

    return true;
  }

  // 커스텀 권한 제거
  removeCustomPermission(userId: string, permission: Permission, removedBy: string): boolean {
    const userPerms = this.getUserPermissions(userId);
    if (!userPerms) return false;

    const index = userPerms.customPermissions.indexOf(permission);
    if (index > -1) {
      userPerms.customPermissions.splice(index, 1);
      userPerms.updatedAt = new Date();
      userPerms.createdBy = removedBy;
      this.setUserPermissions(userPerms);
    }

    return true;
  }

  // 권한 거부 추가
  denyPermission(userId: string, permission: Permission, deniedBy: string): boolean {
    const userPerms = this.getUserPermissions(userId);
    if (!userPerms) return false;

    if (!userPerms.deniedPermissions.includes(permission)) {
      userPerms.deniedPermissions.push(permission);
      userPerms.updatedAt = new Date();
      userPerms.createdBy = deniedBy;
      this.setUserPermissions(userPerms);
    }

    return true;
  }

  // 권한 거부 제거
  allowPermission(userId: string, permission: Permission, allowedBy: string): boolean {
    const userPerms = this.getUserPermissions(userId);
    if (!userPerms) return false;

    const index = userPerms.deniedPermissions.indexOf(permission);
    if (index > -1) {
      userPerms.deniedPermissions.splice(index, 1);
      userPerms.updatedAt = new Date();
      userPerms.createdBy = allowedBy;
      this.setUserPermissions(userPerms);
    }

    return true;
  }

  // 권한 그룹별 확인
  getPermissionsByCategory(userId: string): Record<string, Permission[]> {
    const userPermissions = this.calculateUserPermissions(userId);
    const categories: Record<string, Permission[]> = {};

    userPermissions.forEach(permission => {
      const category = permission.split(':')[0];
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(permission);
    });

    return categories;
  }

  // 역할별 권한 비교
  compareRolePermissions(role1: Role, role2: Role): {
    common: Permission[];
    role1Only: Permission[];
    role2Only: Permission[];
  } {
    const perms1 = new Set(ROLES[role1].permissions);
    const perms2 = new Set(ROLES[role2].permissions);

    const common = Array.from(perms1).filter(p => perms2.has(p));
    const role1Only = Array.from(perms1).filter(p => !perms2.has(p));
    const role2Only = Array.from(perms2).filter(p => !perms1.has(p));

    return { common, role1Only, role2Only };
  }

  // 권한 상속 확인
  isPermissionInherited(userId: string, permission: Permission): boolean {
    const userPerms = this.getUserPermissions(userId);
    if (!userPerms) return false;

    const rolePermissions = ROLES[userPerms.role].permissions;
    return rolePermissions.includes(permission);
  }

  // 사용자 권한 요약
  getUserPermissionSummary(userId: string): {
    role: Role;
    totalPermissions: number;
    inheritedPermissions: number;
    customPermissions: number;
    deniedPermissions: number;
    categories: string[];
  } {
    const userPerms = this.getUserPermissions(userId);
    if (!userPerms) {
      return {
        role: 'user',
        totalPermissions: 0,
        inheritedPermissions: 0,
        customPermissions: 0,
        deniedPermissions: 0,
        categories: [],
      };
    }

    const allPermissions = this.calculateUserPermissions(userId);
    const rolePermissions = ROLES[userPerms.role].permissions;
    const categories = [...new Set(allPermissions.map(p => p.split(':')[0]))];

    return {
      role: userPerms.role,
      totalPermissions: allPermissions.length,
      inheritedPermissions: rolePermissions.length,
      customPermissions: userPerms.customPermissions.length,
      deniedPermissions: userPerms.deniedPermissions.length,
      categories,
    };
  }
}

// 권한 데코레이터 (Express 미들웨어용)
export function requirePermission(permission: Permission) {
  return (req: any, res: any, next: any) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!permissionManager.hasPermission(userId, permission)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: permission,
        description: PERMISSIONS[permission]
      });
    }

    next();
  };
}

// 다중 권한 데코레이터
export function requirePermissions(permissions: Permission[], requireAll = true) {
  return (req: any, res: any, next: any) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const hasPermissions = requireAll 
      ? permissionManager.hasPermissions(userId, permissions)
      : permissionManager.hasAnyPermission(userId, permissions);

    if (!hasPermissions) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: permissions,
        requireAll,
      });
    }

    next();
  };
}

// 역할 데코레이터
export function requireRole(role: Role) {
  return (req: any, res: any, next: any) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userPerms = permissionManager.getUserPermissions(userId);
    if (!userPerms || userPerms.role !== role) {
      return res.status(403).json({ 
        error: 'Insufficient role',
        required: role,
        current: userPerms?.role || 'none'
      });
    }

    next();
  };
}

// 권한 유틸리티 함수들
export const PermissionUtils = {
  // 권한 이름을 사용자 친화적 형태로 변환
  formatPermissionName: (permission: Permission): string => {
    return PERMISSIONS[permission] || permission;
  },

  // 권한을 카테고리별로 그룹화
  groupPermissionsByCategory: (permissions: Permission[]): Record<string, Permission[]> => {
    const groups: Record<string, Permission[]> = {};
    
    permissions.forEach(permission => {
      const category = permission.split(':')[0];
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(permission);
    });

    return groups;
  },

  // 역할의 권한 레벨 계산
  calculateRoleLevel: (role: Role): number => {
    const levels = {
      user: 0,
      support: 1,
      analyst: 2,
      trading_admin: 3,
      finance_admin: 3,
      admin: 4,
      superadmin: 5,
    };
    return levels[role] || 0;
  },

  // 권한 상속 체크
  canInheritPermission: (fromRole: Role, toRole: Role): boolean => {
    return PermissionUtils.calculateRoleLevel(fromRole) <= PermissionUtils.calculateRoleLevel(toRole);
  },
};

// 싱글톤 인스턴스
export const permissionManager = new PermissionManager(); 