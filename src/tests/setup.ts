// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, vi } from 'vitest';

// Mock IntersectionObserver
beforeAll(() => {
  global.IntersectionObserver = class IntersectionObserver {
    root: Element | null = null;
    rootMargin: string = '';
    thresholds: ReadonlyArray<number> = [];
    
    constructor(_callback: IntersectionObserverCallback, _options?: IntersectionObserverInit) {}
    disconnect() {}
    observe(_target: Element) {}
    unobserve(_target: Element) {}
    takeRecords(): IntersectionObserverEntry[] { return []; }
  } as any;

  // Mock ResizeObserver
  global.ResizeObserver = class ResizeObserver {
    constructor(_callback: ResizeObserverCallback) {}
    disconnect() {}
    observe(_target: Element, _options?: ResizeObserverOptions) {}
    unobserve(_target: Element) {}
  } as any;

  // Mock matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: function(query: string) {
      return {
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => {},
      };
    },
  });

  // Mock fetch
  global.fetch = vi.fn();

  // Mock WebSocket
  global.WebSocket = class WebSocket {
    static readonly CONNECTING = 0;
    static readonly OPEN = 1;
    static readonly CLOSING = 2;
    static readonly CLOSED = 3;
    
    readonly CONNECTING = 0;
    readonly OPEN = 1;
    readonly CLOSING = 2;
    readonly CLOSED = 3;
    
    readyState = this.CONNECTING;
    url = '';
    
    constructor(_url: string, _protocols?: string | string[]) {}
    close(_code?: number, _reason?: string) {}
    send(_data: string | ArrayBufferLike | Blob | ArrayBufferView) {}
    addEventListener(_type: string, _listener: EventListenerOrEventListenerObject, _options?: boolean | AddEventListenerOptions) {}
    removeEventListener(_type: string, _listener: EventListenerOrEventListenerObject, _options?: boolean | EventListenerOptions) {}
    dispatchEvent(_event: Event): boolean { return true; }
    
    onopen: ((_this: WebSocket, _ev: Event) => any) | null = null;
    onclose: ((_this: WebSocket, _ev: CloseEvent) => any) | null = null;
    onmessage: ((_this: WebSocket, _ev: MessageEvent) => any) | null = null;
    onerror: ((_this: WebSocket, _ev: Event) => any) | null = null;
  } as any;
});

// runs a cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup();
}); 