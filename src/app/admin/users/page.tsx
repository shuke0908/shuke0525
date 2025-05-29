'use client';

import React, { useState } from "react";
import { AdminLayoutWithSidebar } from "@/components/layout/AdminLayoutWithSidebar";
import { UserList } from "@/components/admin/UserList";
import { UserSettingsPanel } from "@/components/admin/UserSettingsPanel";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  balance: number;
  settings: {
    winRate: number;
    maxProfit: number;
    forceResult?: 'win' | 'lose';
    isActive: boolean;
    updatedAt?: string;
  };
}

function AdminUsersPage() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
  };

  const handleSettingsUpdated = (updatedUser: User) => {
    setSelectedUser(updatedUser);
  };

  return (
    <AdminLayoutWithSidebar>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">사용자 관리</h1>
          <p className="text-muted-foreground">계정 상태 관리, 플래시 트레이드 승률 개별 설정, 거래 내역 조회 및 분석</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 사용자 목록 */}
          <div>
            <UserList 
              onSelectUser={handleSelectUser}
              selectedUserId={selectedUser?.id}
            />
          </div>
          
          {/* 사용자 설정 패널 */}
          <div>
            {selectedUser ? (
              <UserSettingsPanel 
                user={selectedUser}
                onSettingsUpdated={handleSettingsUpdated}
              />
            ) : (
              <div className="flex items-center justify-center h-96 border-2 border-dashed border-muted rounded-lg">
                <p className="text-muted-foreground">사용자를 선택하여 설정을 관리하세요</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayoutWithSidebar>
  );
}

export default AdminUsersPage; 