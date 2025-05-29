import type { Variants, Transition } from 'framer-motion';

// 기본 트랜지션 설정
export const defaultTransition: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
  mass: 1,
};

export const smoothTransition: Transition = {
  type: 'tween',
  duration: 0.3,
  ease: [0.4, 0, 0.2, 1], // cubic-bezier for smooth feel
};

export const fastTransition: Transition = {
  type: 'tween',
  duration: 0.15,
  ease: 'easeOut',
};

export const slowTransition: Transition = {
  type: 'spring',
  stiffness: 100,
  damping: 25,
  mass: 1.2,
};

// 페이지 전환 애니메이션
export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    x: -20,
    scale: 0.98,
  },
  enter: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: smoothTransition,
  },
  exit: {
    opacity: 0,
    x: 20,
    scale: 0.98,
    transition: fastTransition,
  },
};

// 모달 애니메이션
export const modalVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
    y: 50,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    y: 50,
    transition: fastTransition,
  },
};

// 사이드바 애니메이션
export const sidebarVariants: Variants = {
  closed: {
    x: '-100%',
    transition: smoothTransition,
  },
  open: {
    x: 0,
    transition: smoothTransition,
  },
};

// 드롭다운 애니메이션
export const dropdownVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: -10,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 500,
      damping: 30,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: -10,
    transition: {
      duration: 0.15,
    },
  },
};

// 카드 호버 애니메이션
export const cardHoverVariants: Variants = {
  rest: {
    scale: 1,
    y: 0,
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    transition: smoothTransition,
  },
  hover: {
    scale: 1.02,
    y: -4,
    boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.1)',
    transition: smoothTransition,
  },
  tap: {
    scale: 0.98,
    transition: fastTransition,
  },
};

// 버튼 애니메이션
export const buttonVariants: Variants = {
  rest: {
    scale: 1,
    transition: fastTransition,
  },
  hover: {
    scale: 1.05,
    transition: fastTransition,
  },
  tap: {
    scale: 0.95,
    transition: {
      duration: 0.1,
    },
  },
};

// 리스트 아이템 스태거 애니메이션
export const listContainerVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

export const listItemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.9,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: smoothTransition,
  },
};

// 숫자 카운트업 애니메이션
export const numberCountVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 20,
    },
  },
};

// 로딩 스피너 애니메이션
export const spinnerVariants: Variants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

// 펄스 애니메이션 (로딩 상태)
export const pulseVariants: Variants = {
  animate: {
    opacity: [1, 0.5, 1],
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// 셰이크 애니메이션 (에러 상태)
export const shakeVariants: Variants = {
  shake: {
    x: [0, -10, 10, -10, 10, 0],
    transition: {
      duration: 0.5,
    },
  },
};

// 슬라이드업 애니메이션
export const slideUpVariants: Variants = {
  hidden: {
    y: 100,
    opacity: 0,
  },
  visible: {
    y: 0,
    opacity: 1,
    transition: smoothTransition,
  },
  exit: {
    y: 100,
    opacity: 0,
    transition: fastTransition,
  },
};

// 플립 애니메이션 (카드 뒤집기)
export const flipVariants: Variants = {
  front: {
    rotateY: 0,
    transition: smoothTransition,
  },
  back: {
    rotateY: 180,
    transition: smoothTransition,
  },
};

// 프로그레스 바 애니메이션
export const progressVariants: Variants = {
  initial: {
    scaleX: 0,
    originX: 0,
  },
  animate: (width: number) => ({
    scaleX: width / 100,
    transition: {
      duration: 0.8,
      ease: 'easeOut',
    },
  }),
};

// 타이핑 효과 애니메이션
export const typingVariants: Variants = {
  hidden: {
    width: 0,
  },
  visible: {
    width: 'auto',
    transition: {
      duration: 2,
      ease: 'steps(20)',
    },
  },
};

// 마이크로 인터랙션 - 좋아요 버튼
export const likeButtonVariants: Variants = {
  rest: {
    scale: 1,
    transition: fastTransition,
  },
  liked: {
    scale: [1, 1.2, 1],
    transition: {
      duration: 0.3,
      times: [0, 0.5, 1],
    },
  },
};

// 토스트 알림 애니메이션
export const toastVariants: Variants = {
  hidden: {
    opacity: 0,
    y: -50,
    scale: 0.8,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 500,
      damping: 30,
    },
  },
  exit: {
    opacity: 0,
    y: -50,
    scale: 0.8,
    transition: fastTransition,
  },
};

// 검색 결과 하이라이트 애니메이션
export const highlightVariants: Variants = {
  initial: {
    backgroundColor: 'transparent',
  },
  highlight: {
    backgroundColor: ['transparent', '#fef3c7', 'transparent'],
    transition: {
      duration: 1.5,
      times: [0, 0.5, 1],
    },
  },
};

// 무한 스크롤 로딩 애니메이션
export const infiniteScrollVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut',
    },
  },
};

// 게임화 요소 - 성취 뱃지 애니메이션
export const badgeVariants: Variants = {
  hidden: {
    scale: 0,
    rotate: -180,
    opacity: 0,
  },
  visible: {
    scale: 1,
    rotate: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 20,
    },
  },
};

// 프리로더 애니메이션
export const preloaderVariants: Variants = {
  initial: {
    opacity: 1,
  },
  exit: {
    opacity: 0,
    scale: 1.1,
    transition: {
      duration: 0.5,
    },
  },
};

// 커스텀 이징 함수들
export const customEasing = {
  bounce: [0.68, -0.55, 0.265, 1.55],
  smooth: [0.4, 0, 0.2, 1],
  sharp: [0.4, 0, 0.6, 1],
  standard: [0.4, 0, 0.2, 1],
  emphasized: [0.2, 0, 0, 1],
} as const;

// 모바일 최적화된 애니메이션 (성능 고려)
export const mobileOptimizedVariants: Variants = {
  initial: {
    opacity: 0,
    transform: 'translateY(20px)',
  },
  animate: {
    opacity: 1,
    transform: 'translateY(0px)',
    transition: {
      duration: 0.2,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    transform: 'translateY(-20px)',
    transition: {
      duration: 0.15,
      ease: 'easeIn',
    },
  },
};

// 접근성을 고려한 애니메이션 (prefers-reduced-motion 대응)
export const a11yVariants = (reducedMotion: boolean): Variants => {
  if (reducedMotion) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    };
  }
  
  return pageVariants;
}; 