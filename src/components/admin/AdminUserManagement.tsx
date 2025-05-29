'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin' | 'superadmin';
  status: 'active' | 'inactive' | 'suspended';
  balance: number;
  createdAt: string;
}

const mockUsers: User[] = [
  {
    id: '1',
    email: 'user1@example.com',
    name: '김철수',
    role: 'user',
    status: 'active',
    balance: 1000000,
    createdAt: '2024-01-15'
  },
  {
    id: '2',
    email: 'admin@example.com',
    name: '관리자',
    role: 'admin',
    status: 'active',
    balance: 0,
    createdAt: '2024-01-01'
  }
];

export default function AdminUserManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [users] = useState<User[]>(mockUsers);

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'superadmin': return 'bg-red-500';
      case 'admin': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'suspended': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">사용자 관리</h1>
        <Button>새 사용자 추가</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>사용자 검색</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="이메일 또는 이름으로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>사용자 목록 ({filteredUsers.length}명)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">이름</th>
                  <th className="text-left p-2">이메일</th>
                  <th className="text-left p-2">역할</th>
                  <th className="text-left p-2">상태</th>
                  <th className="text-left p-2">잔액</th>
                  <th className="text-left p-2">가입일</th>
                  <th className="text-left p-2">작업</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-medium">{user.name}</td>
                    <td className="p-2">{user.email}</td>
                    <td className="p-2">
                      <Badge className={`text-white ${getRoleColor(user.role)}`}>
                        {user.role}
                      </Badge>
                    </td>
                    <td className="p-2">
                      <Badge className={`text-white ${getStatusColor(user.status)}`}>
                        {user.status}
                      </Badge>
                    </td>
                    <td className="p-2">₩{user.balance.toLocaleString()}</td>
                    <td className="p-2">{user.createdAt}</td>
                    <td className="p-2">
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">편집</Button>
                        <Button size="sm" variant="outline">정지</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 