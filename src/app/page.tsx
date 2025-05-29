'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useApp, useTrading } from '@/components/providers/Providers';
import { useToast } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';

// 아이콘 컴포넌트들
const TrendingUpIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" stroke="currentColor" strokeWidth="2" fill="none"/>
    <polyline points="17 6 23 6 23 12" stroke="currentColor" strokeWidth="2" fill="none"/>
  </svg>
);

const ShieldIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2" fill="none"/>
  </svg>
);

const ZapIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <polygon points="13,2 3,14 12,14 11,22 21,10 12,10" stroke="currentColor" strokeWidth="2" fill="currentColor"/>
  </svg>
);

const BarChartIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <line x1="12" y1="20" x2="12" y2="10" stroke="currentColor" strokeWidth="2"/>
    <line x1="18" y1="20" x2="18" y2="4" stroke="currentColor" strokeWidth="2"/>
    <line x1="6" y1="20" x2="6" y2="16" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const HomePage: React.FC = () => {
  const { t } = useTranslation(['common', 'landing']);
  const { isLoading } = useApp();
  const { balance } = useTrading();
  const { toast } = useToast();

  const handleStartTrading = () => {
    toast({
      title: "환영합니다! 🎉",
      description: "CryptoTrader에서 스마트한 거래를 시작하세요.",
      variant: "success",
      duration: 3000,
    });
  };

  const handleLearnMore = () => {
    toast({
      title: "더 알아보기",
      description: "곧 상세한 가이드를 제공할 예정입니다.",
      variant: "default",
      duration: 3000,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
          <p className="text-text-secondary">플랫폼을 준비하고 있습니다...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen page-transition">
      {/* 히어로 섹션 */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background-primary via-background-secondary to-background-primary">
        {/* 배경 애니메이션 요소들 */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-blue/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>
        
        <div className="relative container mx-auto px-6 py-20 lg:py-32">
          <div className="text-center max-w-4xl mx-auto">
            {/* 상태 배지 */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success-green/10 border border-success-green/20 text-success-green text-sm font-medium mb-8">
              <div className="w-2 h-2 bg-success-green rounded-full animate-pulse"></div>
              실시간 거래 시스템 가동 중
            </div>
            
            {/* 메인 제목 */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              <span className="text-gradient">차세대</span>
              <br />
              <span className="text-text-primary">암호화폐 거래</span>
              <br />
              <span className="text-text-primary">플랫폼</span>
            </h1>
            
            {/* 서브 타이틀 */}
            <p className="text-lg md:text-xl text-text-secondary mb-8 max-w-2xl mx-auto leading-relaxed">
              AI 기반 인사이트와 실시간 분석으로 
              <br className="hidden md:block" />
              스마트한 거래 경험을 제공합니다
            </p>
            
            {/* CTA 버튼들 */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <button 
                onClick={handleStartTrading}
                className="btn btn-primary px-8 py-4 text-lg font-bold min-w-[200px] glow"
              >
                <ZapIcon />
                지금 시작하기
              </button>
              <button 
                onClick={handleLearnMore}
                className="btn btn-outline px-8 py-4 text-lg min-w-[200px]"
              >
                <BarChartIcon />
                더 알아보기
              </button>
            </div>
            
            {/* 실시간 통계 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              <div className="glass-card p-6 text-center">
                <div className="text-2xl font-bold text-primary-blue mb-2">$52,435</div>
                <div className="text-sm text-text-secondary">BTC 현재가</div>
                <div className="text-xs text-success-green flex items-center justify-center gap-1 mt-1">
                  <TrendingUpIcon />
                  +2.34%
                </div>
              </div>
              <div className="glass-card p-6 text-center">
                <div className="text-2xl font-bold text-success-green mb-2">95.8%</div>
                <div className="text-sm text-text-secondary">거래 성공률</div>
                <div className="text-xs text-text-muted mt-1">지난 24시간</div>
              </div>
              <div className="glass-card p-6 text-center">
                <div className="text-2xl font-bold text-warning-yellow mb-2">1,234</div>
                <div className="text-sm text-text-secondary">활성 거래자</div>
                <div className="text-xs text-text-muted mt-1">실시간 접속</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 기능 소개 섹션 */}
      <section className="py-20 bg-gradient-to-b from-background-primary via-background-secondary/50 to-background-primary">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
              왜 CryptoTrader를 선택해야 할까요?
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              전문적인 도구와 안전한 거래 환경으로 당신의 투자를 지원합니다
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Flash Trade 기능 */}
            <div className="card group hover:border-glow cursor-pointer">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-blue to-primary-blue-light rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <ZapIcon />
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-3 text-center">
                ⚡ Flash Trade
              </h3>
              <p className="text-text-secondary text-center mb-4">
                30초부터 5분까지, 초단기 거래로 빠른 수익 실현이 가능합니다.
              </p>
              <div className="text-center">
                <span className="text-sm text-success-green font-medium">
                  최대 85% 수익률
                </span>
              </div>
            </div>
            
            {/* AI 분석 */}
            <div className="card group hover:border-glow cursor-pointer">
              <div className="w-16 h-16 bg-gradient-to-br from-purple to-purple-light rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <BarChartIcon />
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-3 text-center">
                🤖 AI 분석
              </h3>
              <p className="text-text-secondary text-center mb-4">
                머신러닝 기반 시장 분석으로 정확한 거래 신호를 제공합니다.
              </p>
              <div className="text-center">
                <span className="text-sm text-info-cyan font-medium">
                  실시간 시장 분석
                </span>
              </div>
            </div>
            
            {/* 보안 */}
            <div className="card group hover:border-glow cursor-pointer">
              <div className="w-16 h-16 bg-gradient-to-br from-success-green to-success-green-light rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <ShieldIcon />
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-3 text-center">
                🛡️ 강화된 보안
              </h3>
              <p className="text-text-secondary text-center mb-4">
                은행급 보안 시스템과 2FA 인증으로 안전한 거래를 보장합니다.
              </p>
              <div className="text-center">
                <span className="text-sm text-success-green font-medium">
                  100% 자금 보호
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 실시간 거래 미리보기 */}
      <section className="py-20 bg-background-secondary/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
              실시간 거래 현황
            </h2>
            <p className="text-lg text-text-secondary">
              지금 이 순간 다른 거래자들이 수익을 창출하고 있습니다
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="glass-card p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 거래 현황 */}
                <div>
                  <h3 className="text-xl font-bold text-text-primary mb-6">
                    🔥 인기 거래
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-background-tertiary rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-warning-yellow/20 rounded-full flex items-center justify-center">
                          ₿
                        </div>
                        <div>
                          <div className="font-semibold text-text-primary">BTC/USD</div>
                          <div className="text-sm text-text-secondary">비트코인</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-success-green">+$245</div>
                        <div className="text-sm text-text-secondary">30초 거래</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-background-tertiary rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary-blue/20 rounded-full flex items-center justify-center">
                          Ξ
                        </div>
                        <div>
                          <div className="font-semibold text-text-primary">ETH/USD</div>
                          <div className="text-sm text-text-secondary">이더리움</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-success-green">+$182</div>
                        <div className="text-sm text-text-secondary">1분 거래</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-background-tertiary rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gold/20 rounded-full flex items-center justify-center">
                          $
                        </div>
                        <div>
                          <div className="font-semibold text-text-primary">ADA/USD</div>
                          <div className="text-sm text-text-secondary">카르다노</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-success-green">+$97</div>
                        <div className="text-sm text-text-secondary">2분 거래</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* 사용자 상태 */}
                <div>
                  <h3 className="text-xl font-bold text-text-primary mb-6">
                    💰 나의 거래 현황
                  </h3>
                  <div className="space-y-6">
                    <div className="text-center p-6 bg-background-tertiary rounded-lg">
                      <div className="text-3xl font-bold text-primary-blue mb-2">
                        ${balance.toLocaleString()}
                      </div>
                      <div className="text-sm text-text-secondary">현재 잔액</div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-success-green/10 border border-success-green/20 rounded-lg">
                        <div className="text-lg font-bold text-success-green">12</div>
                        <div className="text-xs text-text-secondary">성공 거래</div>
                      </div>
                      <div className="text-center p-4 bg-danger-red/10 border border-danger-red/20 rounded-lg">
                        <div className="text-lg font-bold text-danger-red">3</div>
                        <div className="text-xs text-text-secondary">실패 거래</div>
                      </div>
                    </div>
                    
                    <button 
                      onClick={handleStartTrading}
                      className="btn btn-success w-full py-3"
                    >
                      거래 시작하기
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA 섹션 */}
      <section className="py-20 bg-gradient-to-br from-primary-blue/10 via-purple/10 to-primary-blue/10">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
            지금 바로 시작하세요
          </h2>
          <p className="text-lg text-text-secondary mb-8 max-w-2xl mx-auto">
            가입 후 즉시 $10,000 모의 자금으로 무료 거래를 체험해보세요
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button 
              onClick={handleStartTrading}
              className="btn btn-primary px-8 py-4 text-lg font-bold min-w-[200px] glow"
            >
              무료로 시작하기
            </button>
            <button 
              onClick={handleLearnMore}
              className="btn btn-ghost px-8 py-4 text-lg min-w-[200px]"
            >
              거래 가이드 보기
            </button>
          </div>
          
          <div className="mt-12 text-sm text-text-muted">
            💡 계정 생성 후 즉시 거래 가능 • 실제 자금 필요 없음 • 언제든 중단 가능
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
