'use client';

import { useState, useEffect, useCallback } from 'react';

// 모바일 디바이스 정보 타입
interface MobileInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenWidth: number;
  screenHeight: number;
  orientation: 'portrait' | 'landscape';
  touchSupported: boolean;
  userAgent: string;
  platform: string;
}

// 터치 제스처 정보 타입
interface TouchGesture {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  deltaX: number;
  deltaY: number;
  direction: 'left' | 'right' | 'up' | 'down' | null;
  distance: number;
  isSwipe: boolean;
}

// 뷰포트 브레이크포인트
const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1440
} as const;

// 스와이프 임계값
const SWIPE_THRESHOLD = 50;
const SWIPE_VELOCITY = 0.3;

export function useMobile() {
  const [mobileInfo, setMobileInfo] = useState<MobileInfo>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    screenWidth: 0,
    screenHeight: 0,
    orientation: 'landscape',
    touchSupported: false,
    userAgent: '',
    platform: ''
  });

  const [gesture, setGesture] = useState<TouchGesture | null>(null);

  // 디바이스 정보 업데이트
  const updateMobileInfo = useCallback(() => {
    if (typeof window === 'undefined') return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const isMobile = width < BREAKPOINTS.mobile;
    const isTablet = width >= BREAKPOINTS.mobile && width < BREAKPOINTS.tablet;
    const isDesktop = width >= BREAKPOINTS.tablet;

    setMobileInfo({
      isMobile,
      isTablet,
      isDesktop,
      screenWidth: width,
      screenHeight: height,
      orientation: width > height ? 'landscape' : 'portrait',
      touchSupported: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      userAgent: navigator.userAgent,
      platform: navigator.platform
    });
  }, []);

  // 터치 시작 이벤트 처리
  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    setGesture({
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
      deltaX: 0,
      deltaY: 0,
      direction: null,
      distance: 0,
      isSwipe: false
    });
  }, []);

  // 터치 이동 이벤트 처리
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!gesture) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - gesture.startX;
    const deltaY = touch.clientY - gesture.startY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    let direction: TouchGesture['direction'] = null;
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      direction = deltaX > 0 ? 'right' : 'left';
    } else {
      direction = deltaY > 0 ? 'down' : 'up';
    }

    setGesture(prev => prev ? {
      ...prev,
      currentX: touch.clientX,
      currentY: touch.clientY,
      deltaX,
      deltaY,
      direction,
      distance,
      isSwipe: distance > SWIPE_THRESHOLD
    } : null);
  }, [gesture]);

  // 터치 종료 이벤트 처리
  const handleTouchEnd = useCallback(() => {
    setGesture(null);
  }, []);

  // 화면 회전 감지
  const handleOrientationChange = useCallback(() => {
    setTimeout(updateMobileInfo, 100);
  }, [updateMobileInfo]);

  // 이벤트 리스너 설정
  useEffect(() => {
    updateMobileInfo();

    window.addEventListener('resize', updateMobileInfo);
    window.addEventListener('orientationchange', handleOrientationChange);
    
    if (mobileInfo.touchSupported) {
      document.addEventListener('touchstart', handleTouchStart, { passive: true });
      document.addEventListener('touchmove', handleTouchMove, { passive: true });
      document.addEventListener('touchend', handleTouchEnd, { passive: true });
    }

    return () => {
      window.removeEventListener('resize', updateMobileInfo);
      window.removeEventListener('orientationchange', handleOrientationChange);
      
      if (mobileInfo.touchSupported) {
        document.removeEventListener('touchstart', handleTouchStart);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [updateMobileInfo, handleOrientationChange, handleTouchStart, handleTouchMove, handleTouchEnd, mobileInfo.touchSupported]);

  // 모바일 디바이스 감지 유틸리티
  const detectMobileDevice = useCallback(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobileDevice = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    const isIOS = /iphone|ipad|ipod/i.test(userAgent);
    const isAndroid = /android/i.test(userAgent);
    
    return {
      isMobileDevice,
      isIOS,
      isAndroid,
      isStandalone: window.navigator.standalone === true || 
                   window.matchMedia('(display-mode: standalone)').matches
    };
  }, []);

  // 햅틱 피드백 (iOS 지원)
  const hapticFeedback = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    if ('vibrate' in navigator) {
      // Android 진동
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [50]
      };
      navigator.vibrate(patterns[type]);
    }
    
    // iOS 햅틱 피드백 (웹뷰에서만 가능)
    if ('DeviceMotionEvent' in window && 'requestPermission' in (DeviceMotionEvent as any)) {
      try {
        const impact = new (window as any).UIImpactFeedbackGenerator();
        impact.prepare();
        impact.impactOccurred();
      } catch (e) {
        // 햅틱 피드백 미지원
      }
    }
  }, []);

  // 스크린 잠금 방지 (PWA에서 유용)
  const preventScreenSleep = useCallback(async () => {
    if ('wakeLock' in navigator) {
      try {
        const wakeLock = await (navigator as any).wakeLock.request('screen');
        return wakeLock;
      } catch (err) {
        console.warn('Screen wake lock failed:', err);
      }
    }
    return null;
  }, []);

  // 가상 키보드 감지
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    if (!mobileInfo.isMobile) return;

    const initialViewHeight = window.visualViewport?.height || window.innerHeight;
    
    const handleViewportChange = () => {
      const currentHeight = window.visualViewport?.height || window.innerHeight;
      const heightDifference = initialViewHeight - currentHeight;
      setKeyboardVisible(heightDifference > 150); // 키보드가 150px 이상 화면을 가렸을 때
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
      return () => {
        window.visualViewport?.removeEventListener('resize', handleViewportChange);
      };
    }
  }, [mobileInfo.isMobile]);

  return {
    // 기본 모바일 정보
    ...mobileInfo,
    
    // 터치 제스처
    gesture,
    
    // 유틸리티 함수
    detectMobileDevice,
    hapticFeedback,
    preventScreenSleep,
    
    // 상태
    keyboardVisible,
    
    // 편의 함수
    isSmallScreen: mobileInfo.screenWidth < 480,
    isMediumScreen: mobileInfo.screenWidth >= 480 && mobileInfo.screenWidth < 768,
    isLargeScreen: mobileInfo.screenWidth >= 768,
    
    // 브레이크포인트 체크
    breakpoint: mobileInfo.isMobile ? 'mobile' : mobileInfo.isTablet ? 'tablet' : 'desktop'
  };
} 