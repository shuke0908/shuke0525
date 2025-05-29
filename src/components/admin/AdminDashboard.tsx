'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AdminDashboard() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">관리자 대시보드</h1>
        <Button variant="outline">설정</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 사용자</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">+20.1% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">활성 거래</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">567</div>
            <p className="text-xs text-muted-foreground">+15.3% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">대기 중인 입금</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89</div>
            <p className="text-xs text-muted-foreground">-2.5% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 거래량</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₩2.1억</div>
            <p className="text-xs text-muted-foreground">+12.7% from last month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>최근 활동</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">
                  U
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">새 사용자 등록</p>
                  <p className="text-xs text-muted-foreground">2분 전</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">
                  T
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Flash Trade 완료</p>
                  <p className="text-xs text-muted-foreground">5분 전</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>시스템 상태</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">서버 상태</span>
                <span className="text-green-500 text-sm">정상</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">WebSocket 연결</span>
                <span className="text-green-500 text-sm">활성</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">데이터베이스</span>
                <span className="text-green-500 text-sm">정상</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 