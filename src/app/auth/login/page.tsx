import { Metadata } from 'next';
import LoginForm from '@/components/auth/LoginForm';

export const metadata: Metadata = {
  title: '로그인 | QuantTrade',
  description: 'QuantTrade 플랫폼에 로그인하세요',
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            QuantTrade
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            암호화폐 거래 플랫폼
          </p>
        </div>
        
        <LoginForm />
        
        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>
            © 2024 QuantTrade. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
} 