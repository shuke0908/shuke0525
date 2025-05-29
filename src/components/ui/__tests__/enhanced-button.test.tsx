import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EnhancedButton, PrimaryButton, SecondaryButton } from '../enhanced-button';

// 모바일 훅 모킹
jest.mock('@/hooks/useMobile', () => ({
  useMobile: () => ({
    hapticFeedback: jest.fn(),
    isMobile: false,
  }),
}));

describe('EnhancedButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('기본 렌더링', () => {
    it('기본 props로 렌더링되어야 한다', () => {
      render(<EnhancedButton>Click me</EnhancedButton>);
      
      const button = screen.getByRole('button', { name: /click me/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('bg-blue-600'); // primary variant default
    });

    it('다양한 variant가 올바른 스타일을 적용해야 한다', () => {
      const { rerender } = render(<EnhancedButton variant="primary">Primary</EnhancedButton>);
      expect(screen.getByRole('button')).toHaveClass('bg-blue-600');

      rerender(<EnhancedButton variant="secondary">Secondary</EnhancedButton>);
      expect(screen.getByRole('button')).toHaveClass('bg-gray-100');

      rerender(<EnhancedButton variant="destructive">Destructive</EnhancedButton>);
      expect(screen.getByRole('button')).toHaveClass('bg-red-600');

      rerender(<EnhancedButton variant="outline">Outline</EnhancedButton>);
      expect(screen.getByRole('button')).toHaveClass('border', 'bg-transparent');

      rerender(<EnhancedButton variant="ghost">Ghost</EnhancedButton>);
      expect(screen.getByRole('button')).toHaveClass('bg-transparent');

      rerender(<EnhancedButton variant="link">Link</EnhancedButton>);
      expect(screen.getByRole('button')).toHaveClass('underline-offset-4');
    });

    it('다양한 size가 올바른 스타일을 적용해야 한다', () => {
      const { rerender } = render(<EnhancedButton size="sm">Small</EnhancedButton>);
      expect(screen.getByRole('button')).toHaveClass('text-sm', 'px-3', 'py-1.5');

      rerender(<EnhancedButton size="md">Medium</EnhancedButton>);
      expect(screen.getByRole('button')).toHaveClass('text-sm', 'px-4', 'py-2');

      rerender(<EnhancedButton size="lg">Large</EnhancedButton>);
      expect(screen.getByRole('button')).toHaveClass('text-base', 'px-6', 'py-3');

      rerender(<EnhancedButton size="xl">Extra Large</EnhancedButton>);
      expect(screen.getByRole('button')).toHaveClass('text-lg', 'px-8', 'py-4');
    });
  });

  describe('아이콘 지원', () => {
    it('왼쪽 아이콘을 렌더링해야 한다', () => {
      const leftIcon = <span data-testid="left-icon">👈</span>;
      render(<EnhancedButton leftIcon={leftIcon}>With Icon</EnhancedButton>);
      
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    });

    it('오른쪽 아이콘을 렌더링해야 한다', () => {
      const rightIcon = <span data-testid="right-icon">👉</span>;
      render(<EnhancedButton rightIcon={rightIcon}>With Icon</EnhancedButton>);
      
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    });

    it('양쪽 아이콘을 모두 렌더링해야 한다', () => {
      const leftIcon = <span data-testid="left-icon">👈</span>;
      const rightIcon = <span data-testid="right-icon">👉</span>;
      
      render(
        <EnhancedButton leftIcon={leftIcon} rightIcon={rightIcon}>
          With Both Icons
        </EnhancedButton>
      );
      
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    });
  });

  describe('로딩 상태', () => {
    it('로딩 중일 때 스피너를 표시해야 한다', () => {
      render(<EnhancedButton isLoading>Loading</EnhancedButton>);
      
      // 스피너가 있는지 확인 (animate-spin 클래스로 확인)
      const spinner = screen.getByRole('button').querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('로딩 중일 때 커스텀 텍스트를 표시해야 한다', () => {
      render(<EnhancedButton isLoading loadingText="처리 중...">Submit</EnhancedButton>);
      
      expect(screen.getByText('처리 중...')).toBeInTheDocument();
      expect(screen.queryByText('Submit')).not.toBeInTheDocument();
    });

    it('로딩 중일 때 클릭이 동작하지 않아야 한다', async () => {
      const handleClick = jest.fn();
      render(<EnhancedButton isLoading onClick={handleClick}>Click me</EnhancedButton>);
      
      const button = screen.getByRole('button');
      await userEvent.click(button);
      
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('비활성화 상태', () => {
    it('비활성화된 버튼이 올바르게 렌더링되어야 한다', () => {
      render(<EnhancedButton disabled>Disabled</EnhancedButton>);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('disabled:pointer-events-none', 'disabled:opacity-50');
    });

    it('비활성화된 버튼은 클릭이 동작하지 않아야 한다', async () => {
      const handleClick = jest.fn();
      render(<EnhancedButton disabled onClick={handleClick}>Disabled</EnhancedButton>);
      
      const button = screen.getByRole('button');
      await userEvent.click(button);
      
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('상호작용', () => {
    it('클릭 이벤트가 올바르게 호출되어야 한다', async () => {
      const handleClick = jest.fn();
      render(<EnhancedButton onClick={handleClick}>Click me</EnhancedButton>);
      
      const button = screen.getByRole('button');
      await userEvent.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('키보드 접근이 가능해야 한다', async () => {
      const handleClick = jest.fn();
      render(<EnhancedButton onClick={handleClick}>Click me</EnhancedButton>);
      
      const button = screen.getByRole('button');
      button.focus();
      
      expect(button).toHaveFocus();
      
      await userEvent.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalledTimes(1);
      
      await userEvent.keyboard('{Space}');
      expect(handleClick).toHaveBeenCalledTimes(2);
    });
  });

  describe('리플 효과', () => {
    it('클릭 시 리플 효과가 생성되어야 한다', async () => {
      render(<EnhancedButton rippleEffect>Click me</EnhancedButton>);
      
      const button = screen.getByRole('button');
      fireEvent.click(button, { clientX: 50, clientY: 50 });
      
      // 리플 효과 요소가 생성되었는지 확인
      await waitFor(() => {
        const ripple = button.querySelector('.absolute.rounded-full');
        expect(ripple).toBeInTheDocument();
      });
    });

    it('rippleEffect가 false일 때 리플이 생성되지 않아야 한다', async () => {
      render(<EnhancedButton rippleEffect={false}>Click me</EnhancedButton>);
      
      const button = screen.getByRole('button');
      fireEvent.click(button, { clientX: 50, clientY: 50 });
      
      const ripple = button.querySelector('.absolute.rounded-full');
      expect(ripple).not.toBeInTheDocument();
    });
  });

  describe('전체 너비', () => {
    it('fullWidth prop이 적용되어야 한다', () => {
      render(<EnhancedButton fullWidth>Full Width</EnhancedButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('w-full');
    });
  });

  describe('커스텀 클래스', () => {
    it('추가 클래스가 적용되어야 한다', () => {
      render(<EnhancedButton className="custom-class">Custom</EnhancedButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });
  });

  describe('접근성', () => {
    it('올바른 ARIA 속성을 가져야 한다', () => {
      render(<EnhancedButton aria-label="Custom label">Button</EnhancedButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Custom label');
    });

    it('포커스 인디케이터가 존재해야 한다', () => {
      render(<EnhancedButton>Focus me</EnhancedButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('focus-visible:outline-none', 'focus-visible:ring-2');
    });
  });

  describe('특화 버튼 변형들', () => {
    it('PrimaryButton이 primary variant로 렌더링되어야 한다', () => {
      render(<PrimaryButton>Primary</PrimaryButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-blue-600');
    });

    it('SecondaryButton이 secondary variant로 렌더링되어야 한다', () => {
      render(<SecondaryButton>Secondary</SecondaryButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-gray-100');
    });
  });

  describe('모바일 최적화', () => {
    it('모바일에서 터치 최적화 클래스가 적용되어야 한다', () => {
      // useMobile 훅을 모바일로 설정
      jest.mocked(require('@/hooks/useMobile').useMobile).mockReturnValue({
        hapticFeedback: jest.fn(),
        isMobile: true,
      });

      render(<EnhancedButton>Mobile</EnhancedButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('touch-manipulation');
    });
  });

  describe('성능', () => {
    it('많은 버튼이 렌더링되어도 성능 문제가 없어야 한다', () => {
      const startTime = performance.now();
      
      render(
        <div>
          {Array.from({ length: 100 }, (_, i) => (
            <EnhancedButton key={i}>Button {i}</EnhancedButton>
          ))}
        </div>
      );
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // 100개 버튼 렌더링이 100ms 이내에 완료되어야 함
      expect(renderTime).toBeLessThan(100);
    });
  });
}); 