import '@testing-library/jest-dom';

// Framer Motion 모킹 (테스트 환경에서 애니메이션 비활성화)
jest.mock('framer-motion', () => ({
  ...jest.requireActual('framer-motion'),
  motion: {
    div: 'div',
    button: 'button',
    span: 'span',
    section: 'section',
    article: 'article',
    main: 'main',
    header: 'header',
    nav: 'nav',
    aside: 'aside',
    footer: 'footer',
    form: 'form',
    input: 'input',
    textarea: 'textarea',
    select: 'select',
    option: 'option',
    label: 'label',
    h1: 'h1',
    h2: 'h2',
    h3: 'h3',
    h4: 'h4',
    h5: 'h5',
    h6: 'h6',
    p: 'p',
    a: 'a',
    ul: 'ul',
    ol: 'ol',
    li: 'li',
    img: 'img',
    svg: 'svg',
    path: 'path',
  },
  AnimatePresence: ({ children }) => children,
  useAnimation: () => ({
    start: jest.fn(),
    stop: jest.fn(),
    set: jest.fn(),
  }),
  useMotionValue: (initial) => ({
    get: () => initial,
    set: jest.fn(),
    on: jest.fn(),
  }),
}));

// Next.js 라우터 모킹
jest.mock('next/router', () => ({
  useRouter: () => ({
    route: '/',
    pathname: '/',
    query: {},
    asPath: '/',
    push: jest.fn(),
    pop: jest.fn(),
    reload: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
    beforePopState: jest.fn(),
    events: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    },
    isFallback: false,
    isLocaleDomain: false,
    isReady: true,
    defaultLocale: 'en',
    domainLocales: [],
    isPreview: false,
  }),
}));

// Next.js navigation 모킹 (App Router)
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// React Query 모킹
jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(() => ({
    data: null,
    error: null,
    isLoading: false,
    refetch: jest.fn(),
  })),
  useMutation: jest.fn(() => ({
    mutate: jest.fn(),
    mutateAsync: jest.fn(),
    reset: jest.fn(),
    isLoading: false,
    isError: false,
    isSuccess: false,
    data: null,
    error: null,
  })),
  useQueryClient: jest.fn(() => ({
    invalidateQueries: jest.fn(),
    setQueryData: jest.fn(),
    getQueryData: jest.fn(),
  })),
  QueryClient: jest.fn(() => ({
    invalidateQueries: jest.fn(),
    setQueryData: jest.fn(),
    getQueryData: jest.fn(),
  })),
  QueryClientProvider: ({ children }) => children,
}));

// Web APIs 모킹
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// ResizeObserver 모킹
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// IntersectionObserver 모킹
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// localStorage 모킹
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value.toString(); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// sessionStorage 모킹
const sessionStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value.toString(); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// fetch 모킹
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    blob: () => Promise.resolve(new Blob()),
  })
);

// WebSocket 모킹
global.WebSocket = jest.fn().mockImplementation(() => ({
  close: jest.fn(),
  send: jest.fn(),
  readyState: 1,
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
}));

// crypto 모킹
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: jest.fn(() => '12345678-1234-1234-1234-123456789abc'),
    getRandomValues: jest.fn((arr) => arr.map(() => Math.floor(Math.random() * 256))),
  },
});

// URL 모킹
global.URL.createObjectURL = jest.fn(() => 'mocked-url');
global.URL.revokeObjectURL = jest.fn();

// Navigator 모킹
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: jest.fn(() => Promise.resolve()),
    readText: jest.fn(() => Promise.resolve('')),
  },
});

// Canvas 모킹 (차트 라이브러리를 위해)
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  fillRect: jest.fn(),
  clearRect: jest.fn(),
  getImageData: jest.fn(() => ({ data: new Array(4) })),
  putImageData: jest.fn(),
  createImageData: jest.fn(() => []),
  setTransform: jest.fn(),
  drawImage: jest.fn(),
  save: jest.fn(),
  fillText: jest.fn(),
  restore: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  closePath: jest.fn(),
  stroke: jest.fn(),
  translate: jest.fn(),
  scale: jest.fn(),
  rotate: jest.fn(),
  arc: jest.fn(),
  fill: jest.fn(),
  measureText: jest.fn(() => ({ width: 0 })),
  transform: jest.fn(),
  rect: jest.fn(),
  clip: jest.fn(),
}));

// console 경고 숨기기 (특정 경고들)
const originalWarn = console.warn;
console.warn = (...args) => {
  if (
    typeof args[0] === 'string' && 
    (
      args[0].includes('React does not recognize') ||
      args[0].includes('Warning: validateDOMNesting')
    )
  ) {
    return;
  }
  originalWarn.call(console, ...args);
};

// 에러 경계 테스트를 위한 헬퍼
global.testErrorBoundary = (Component, props = {}) => {
  const ThrowError = ({ shouldThrow }) => {
    if (shouldThrow) {
      throw new Error('Test error');
    }
    return null;
  };

  return {
    Component,
    ThrowError,
    props,
  };
};

// 테스트 유틸리티
global.testUtils = {
  // 딜레이 함수
  delay: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // 모의 사용자 이벤트
  mockUserEvent: {
    click: (element) => {
      element.click();
    },
    type: (element, text) => {
      element.value = text;
      element.dispatchEvent(new Event('input', { bubbles: true }));
    },
    clear: (element) => {
      element.value = '';
      element.dispatchEvent(new Event('input', { bubbles: true }));
    },
  },
  
  // 모의 데이터 생성기
  createMockUser: (overrides = {}) => ({
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    balance: '1000.00',
    ...overrides,
  }),
  
  createMockTrade: (overrides = {}) => ({
    id: 1,
    userId: 1,
    symbol: 'BTC/USD',
    amount: 100,
    type: 'buy',
    status: 'completed',
    createdAt: new Date().toISOString(),
    ...overrides,
  }),
};

// 환경 변수 설정
process.env.NODE_ENV = 'test';
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3000/api';

// 테스트 시작 시 실행
beforeEach(() => {
  // 모든 모킹 함수 리셋
  jest.clearAllMocks();
  
  // localStorage 및 sessionStorage 초기화
  localStorageMock.clear();
  sessionStorageMock.clear();
}); 