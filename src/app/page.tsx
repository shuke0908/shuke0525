'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, BarChart3, Shield, Zap, TrendingUp } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold text-white">FinancePro</div>
          <div className="flex items-center space-x-4">
            <LanguageSwitcher />
            {isLoading ? (
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-white"></div>
            ) : isAuthenticated ? (
              <Link href="/dashboard">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  {t('landing.goDashboard')}
                </Button>
              </Link>
            ) : (
              <div className="flex items-center space-x-4">
                <Link href="/login">
                  <Button variant="ghost" className="text-white hover:bg-white/10">
                    {t('landing.login')}
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    {t('landing.register')}
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-8">
            {t('landing.title')}
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto">
            {t('landing.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isLoading ? (
              <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-white mx-auto"></div>
            ) : isAuthenticated ? (
              <Link href="/dashboard">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg">
                  {t('landing.goDashboard')} <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/register">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg">
                    {t('landing.signUpNow')} <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-black px-8 py-4 text-lg">
                    {t('landing.login')}
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {t('landing.featuresTitle')}
          </h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="text-center p-6 rounded-lg bg-white/5 backdrop-blur-sm">
            <Zap className="h-12 w-12 text-blue-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">{t('landing.flashTradeTitle')}</h3>
            <p className="text-gray-300">{t('landing.flashTradeDesc')}</p>
          </div>
          <div className="text-center p-6 rounded-lg bg-white/5 backdrop-blur-sm">
            <BarChart3 className="h-12 w-12 text-blue-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">{t('landing.quantAITitle')}</h3>
            <p className="text-gray-300">{t('landing.quantAIDesc')}</p>
          </div>
          <div className="text-center p-6 rounded-lg bg-white/5 backdrop-blur-sm">
            <Shield className="h-12 w-12 text-blue-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">{t('landing.securityTitle', ' 안전한 보안')}</h3>
            <p className="text-gray-300">{t('landing.securityDesc', 'KYC 인증과 2FA로 보호되는 자산')}</p>
          </div>
          <div className="text-center p-6 rounded-lg bg-white/5 backdrop-blur-sm">
            <TrendingUp className="h-12 w-12 text-blue-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">{t('landing.quickTradeTitle')}</h3>
            <p className="text-gray-300">{t('landing.quickTradeDesc')}</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center bg-white/5 backdrop-blur-sm rounded-2xl p-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {t('landing.ctaTitle')}
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            {t('landing.ctaSubtitle')}
          </p>
          {!isLoading && !isAuthenticated && (
            <Link href="/register">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-4 text-lg">
                {t('landing.signUpNow')}
              </Button>
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t border-white/10">
        <div className="text-center text-gray-400">
          <p>{t('landing.copyright', { year: '2025' })}</p>
          <div className="flex justify-center space-x-4 mt-4">
            <a href="#" className="text-gray-400 hover:text-white">
              {t('landing.terms')}
            </a>
            <a href="#" className="text-gray-400 hover:text-white">
              {t('landing.privacy')}
            </a>
            <a href="#" className="text-gray-400 hover:text-white">
              {t('landing.contact')}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
