'use client';

import React from "react";
import Layout from "@/components/layout/Layout";

function NotificationsPage() {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">알림</h1>
          <p className="text-muted-foreground">거래 완료, 입출금 상태 변경, KYC 승인/거부, 보너스 지급 알림</p>
        </div>
        
        <div className="text-center py-16">
          <p className="text-muted-foreground">알림 페이지 구현 예정</p>
        </div>
      </div>
    </Layout>
  );
}

export default NotificationsPage; 