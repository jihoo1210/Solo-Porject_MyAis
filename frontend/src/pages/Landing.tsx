import { Link } from 'react-router-dom';
import NeuralNetwork from '../components/three/NeuralNetwork';
import { Check, Target, Wrench, BarChart3, Theater, Sparkles, Rocket, CreditCard, Menu, X } from 'lucide-react';
import { useState } from 'react';

const featureIcons = [Target, Wrench, BarChart3, Theater];

const features = [
  {
    title: '프롬프트 프리',
    description: '미리 설정된 프롬프트로 입력만 하면 바로 결과를 얻으세요.',
  },
  {
    title: 'AI 빌더',
    description: 'UI로 누구나 쉽게 나만의 AI 도구를 만들 수 있습니다.',
  },
  {
    title: '멀티 입력',
    description: '텍스트, 링크, 이미지를 자유롭게 조합하여 사용하세요.',
  },
  {
    title: 'AI 성격 설정',
    description: '톤, 말투, 전문 분야 등 세밀한 성격 커스터마이징',
  },
];

const pricingPlans = [
  {
    name: 'FREE',
    price: '₩0',
    period: '',
    features: [
      'AI 3개 생성',
      '일 20회 실행',
      'GPT-4o-mini',
      '7일 히스토리',
    ],
    cta: '시작하기',
    ctaLink: '/signup',
    popular: false,
  },
  {
    name: 'PRO',
    price: '₩9,900',
    period: '/월',
    features: [
      '무제한 AI 생성',
      '무제한 실행',
      'GPT-4o 사용 가능',
      '이미지 분석',
      '무제한 히스토리',
      '우선 처리',
    ],
    cta: '구독하기',
    ctaLink: '/signup',
    popular: true,
  },
];

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gray-950/80 backdrop-blur-lg border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 h-14 sm:h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-white">
            <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-primary-400" />
            <span className="text-lg sm:text-xl font-bold">MyAIs</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden sm:flex items-center gap-4">
            <Link
              to="/login"
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors text-sm sm:text-base"
            >
              로그인
            </Link>
            <Link
              to="/signup"
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors text-sm sm:text-base"
            >
              시작하기
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="sm:hidden p-2 text-gray-300 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden bg-gray-950/95 backdrop-blur-lg border-t border-gray-800 px-4 py-4">
            <div className="flex flex-col gap-3">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors text-center"
              >
                로그인
              </Link>
              <Link
                to="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors text-center"
              >
                시작하기
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-14 sm:pt-16">
        {/* Three.js Background */}
        <div className="absolute inset-0 z-0">
          <NeuralNetwork />
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-950/50 to-gray-950 z-10" />

        {/* Content */}
        <div className="relative z-20 text-center px-4 max-w-4xl mx-auto">
          <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold text-white mb-4 sm:mb-6">
            프롬프트 없이,
            <br />
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              원클릭으로
            </span>
          </h1>

          <p className="text-base sm:text-xl text-gray-400 mb-6 sm:mb-8 max-w-2xl mx-auto">
            나만의 AI 도구를 만들고 사용하세요.
            <br className="hidden sm:block" />
            <span className="sm:hidden"> </span>
            매번 프롬프트를 작성할 필요 없이, 미리 설정해둔 AI를 바로 사용합니다.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Link
              to="/signup"
              className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-base sm:text-lg transition-all shadow-lg shadow-indigo-500/25"
            >
              <Rocket className="w-4 h-4 sm:w-5 sm:h-5" />
              무료로 시작하기
            </Link>
            <a
              href="#features"
              className="px-6 sm:px-8 py-3 sm:py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold text-base sm:text-lg transition-all backdrop-blur text-center"
            >
              더 알아보기
            </a>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-20 animate-bounce hidden sm:block">
          <div className="w-6 h-10 border-2 border-gray-400 rounded-full flex justify-center pt-2">
            <div className="w-1.5 h-3 bg-gray-400 rounded-full" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 sm:py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="flex items-center justify-center gap-2 sm:gap-3 text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
              <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-400" />
              주요 기능
            </h2>
            <p className="text-gray-400 text-sm sm:text-lg">
              복잡한 프롬프트 없이 AI를 간편하게 사용하세요
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {features.map((feature, index) => {
              const Icon = featureIcons[index];
              return (
                <div
                  key={index}
                  className="p-4 sm:p-6 bg-gray-900 rounded-xl sm:rounded-2xl border border-gray-800 hover:border-gray-700 transition-all"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-indigo-600/20 flex items-center justify-center mb-3 sm:mb-4">
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-1 sm:mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 text-sm sm:text-base">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 sm:py-24 px-4 bg-gray-900/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="flex items-center justify-center gap-2 sm:gap-3 text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
              <CreditCard className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-400" />
              요금제
            </h2>
            <p className="text-gray-400 text-sm sm:text-lg">
              무료로 시작하고, 필요할 때 업그레이드하세요
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`relative p-5 sm:p-8 rounded-xl sm:rounded-2xl transition-all flex flex-col ${
                  plan.popular
                    ? 'bg-gradient-to-b from-indigo-600 to-purple-700 text-white shadow-2xl shadow-indigo-500/25'
                    : 'bg-gray-800 text-white'
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 sm:-top-4 left-1/2 -translate-x-1/2 px-3 sm:px-4 py-1 bg-yellow-400 text-yellow-900 text-xs sm:text-sm font-semibold rounded-full">
                    인기
                  </span>
                )}

                <h3 className="text-xl sm:text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="mb-4 sm:mb-6">
                  <span className="text-3xl sm:text-4xl font-bold">{plan.price}</span>
                  <span className="text-gray-300 text-sm sm:text-base">{plan.period}</span>
                </div>

                <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8 flex-1">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 sm:gap-3 text-sm sm:text-base">
                      <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to={plan.ctaLink}
                  className={`block w-full py-2.5 sm:py-3 text-center font-semibold rounded-lg sm:rounded-xl transition-all text-sm sm:text-base ${
                    plan.popular
                      ? 'bg-white text-indigo-600 hover:bg-gray-100'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>

          <p className="text-center text-gray-500 text-xs sm:text-sm mt-6 sm:mt-8">
            TossPayments 안전 결제 · 언제든지 취소 가능
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 sm:mb-6">
            지금 바로 시작하세요
          </h2>
          <p className="text-gray-400 text-sm sm:text-lg mb-6 sm:mb-8">
            30초면 가입 완료! 무료로 AI 도구를 만들어보세요.
          </p>
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-base sm:text-lg transition-all shadow-lg shadow-indigo-500/25"
          >
            <Rocket className="w-4 h-4 sm:w-5 sm:h-5" />
            무료로 시작하기
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 sm:py-8 px-4 border-t border-gray-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-gray-400 text-sm sm:text-base">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-primary-400" />
            <span className="font-semibold">MyAIs</span>
            <span>© 2024</span>
          </div>
          <div className="flex gap-4 sm:gap-6 text-gray-400 text-xs sm:text-sm">
            <a href="#" className="hover:text-white transition-colors">
              이용약관
            </a>
            <a href="#" className="hover:text-white transition-colors">
              개인정보처리방침
            </a>
            <a href="#" className="hover:text-white transition-colors">
              문의하기
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
