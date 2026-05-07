import React from 'react';
import {
  TrendingUp,
  Zap,
  BarChart3,
  AlertTriangle,
  ArrowRight,
  Check,
  Sun,
  Moon,
} from 'lucide-react';

interface HomePageProps {
  onGetStarted: () => void;
  theme: string;
  toggleTheme: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onGetStarted, theme, toggleTheme }) => {
  const features = [
    {
      icon: <BarChart3 className="w-7 h-7" />,
      title: 'Cost Analytics',
      description: 'Real-time AWS cost monitoring with interactive charts and daily breakdowns.',
      color: 'from-blue-500 to-cyan-500',
      bg: 'bg-blue-100 dark:bg-blue-900/40',
      text: 'text-blue-600 dark:text-blue-400',
    },
    {
      icon: <AlertTriangle className="w-7 h-7" />,
      title: 'Anomaly Detection',
      description: 'AI-powered Z-score analysis identifies unexpected cost spikes automatically.',
      color: 'from-orange-500 to-red-500',
      bg: 'bg-orange-100 dark:bg-orange-900/40',
      text: 'text-orange-600 dark:text-orange-400',
    },
    {
      icon: <TrendingUp className="w-7 h-7" />,
      title: 'Predictive Forecasting',
      description: 'Machine learning models predict your next 7 days of cloud spending.',
      color: 'from-violet-500 to-purple-500',
      bg: 'bg-violet-100 dark:bg-violet-900/40',
      text: 'text-violet-600 dark:text-violet-400',
    },
    {
      icon: <Zap className="w-7 h-7" />,
      title: 'Smart Recommendations',
      description: 'Actionable optimization suggestions to reduce waste and save money.',
      color: 'from-emerald-500 to-teal-500',
      bg: 'bg-emerald-100 dark:bg-emerald-900/40',
      text: 'text-emerald-600 dark:text-emerald-400',
    },
  ];

  const pricingPlans = [
    {
      name: 'Starter',
      price: 'Free',
      period: '',
      description: 'Perfect for individuals and small projects',
      features: ['1 AWS account', '7-day cost history', 'Basic anomaly detection', 'Email alerts'],
      cta: 'Get Started',
      popular: false,
    },
    {
      name: 'Pro',
      price: '$29',
      period: '/mo',
      description: 'For growing teams that need deeper insights',
      features: [
        '5 AWS accounts',
        '90-day cost history',
        'Advanced predictions',
        'Custom thresholds',
        'CSV exports',
        'Priority support',
      ],
      cta: 'Start Free Trial',
      popular: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      description: 'For large organizations with complex needs',
      features: [
        'Unlimited accounts',
        '1-year cost history',
        'Multi-cloud support',
        'SSO & RBAC',
        'API access',
        'Dedicated support',
      ],
      cta: 'Contact Sales',
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-slate-900 dark:text-gray-100 overflow-x-hidden transition-colors duration-500">
      {/* ─── Navigation ─── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-lg border-b border-slate-200/60 dark:border-gray-800/60">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain drop-shadow-sm" />
            <span className="text-lg font-bold tracking-tight">Cloud Autopilot</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-gray-700 transition"
              aria-label="Toggle dark mode"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={onGetStarted}
              className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-600 text-white font-semibold text-sm rounded-lg shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
            >
              Sign In
            </button>
          </div>
        </div>
      </nav>

      {/* ─── Hero Section ─── */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-orange-400/15 dark:bg-orange-600/10 rounded-full blur-[100px]" />
          <div className="absolute -bottom-20 -right-20 w-[400px] h-[400px] bg-amber-400/15 dark:bg-amber-600/10 rounded-full blur-[100px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-r from-orange-300/5 to-amber-300/5 dark:from-orange-800/5 dark:to-amber-800/5 rounded-full blur-[80px]" />
        </div>

        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs font-bold tracking-wide uppercase mb-6 border border-orange-200 dark:border-orange-800/50">
            <Zap className="w-3.5 h-3.5" />
            AI-Powered Cloud Intelligence
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6">
            Stop Wasting Money
            <br />
            <span className="bg-gradient-to-r from-orange-500 to-amber-600 bg-clip-text text-transparent">
              on Cloud Costs
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-600 dark:text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Cloud Autopilot monitors your AWS spending, detects anomalies, predicts future costs,
            and delivers actionable recommendations — all on autopilot.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onGetStarted}
              className="group flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-orange-500 to-amber-600 text-white font-bold text-base rounded-xl shadow-xl shadow-orange-500/20 hover:shadow-orange-500/30 transition-all duration-200 hover:scale-[1.03] active:scale-[0.98]"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <a
              href="#features"
              className="px-8 py-3.5 border-2 border-slate-300 dark:border-gray-700 text-slate-700 dark:text-gray-300 font-semibold text-base rounded-xl hover:bg-slate-50 dark:hover:bg-gray-800 transition-all duration-200"
            >
              Learn More
            </a>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap items-center justify-center gap-8 mt-16 text-center">
            {[
              { value: '99.9%', label: 'Uptime SLA' },
              { value: '< 2s', label: 'Alert Latency' },
              { value: '72%', label: 'Avg. Savings' },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-gray-100">{stat.value}</p>
                <p className="text-xs font-medium text-slate-500 dark:text-gray-500 uppercase tracking-wide mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features Section ─── */}
      <section id="features" className="py-20 md:py-28 bg-slate-50/50 dark:bg-gray-900/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
              Everything You Need to
              <span className="bg-gradient-to-r from-orange-500 to-amber-600 bg-clip-text text-transparent"> Optimize</span>
            </h2>
            <p className="text-slate-600 dark:text-gray-400 max-w-xl mx-auto">
              From real-time analytics to AI-powered predictions, Cloud Autopilot gives you full visibility into your cloud spend.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group bg-white dark:bg-gray-800/80 rounded-2xl p-6 border border-slate-200 dark:border-gray-700/50 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center mb-4`}>
                  <span className={feature.text}>{feature.icon}</span>
                </div>
                <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-600 dark:text-gray-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── About Section ─── */}
      <section className="py-20 md:py-28">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-6">
                Built for Cloud-First
                <span className="bg-gradient-to-r from-orange-500 to-amber-600 bg-clip-text text-transparent"> Teams</span>
              </h2>
              <p className="text-slate-600 dark:text-gray-400 leading-relaxed mb-6">
                Cloud Autopilot combines machine learning with real-time AWS Cost Explorer data to give your team
                unprecedented visibility into cloud spending patterns.
              </p>
              <p className="text-slate-600 dark:text-gray-400 leading-relaxed mb-8">
                Our AI engine runs 24/7, detecting anomalies the moment they occur and forecasting trends before they
                become problems — so you can focus on building, not budgeting.
              </p>
              <ul className="space-y-3">
                {['No credit card required', 'Setup in under 2 minutes', 'SOC 2 compliant infrastructure'].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm font-medium text-slate-700 dark:text-gray-300">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                      <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-2xl p-8 border border-orange-200/50 dark:border-orange-800/30">
                <div className="space-y-4">
                  {[
                    { label: 'Total Cost (7d)', value: '$342.50', change: '-12%', positive: true },
                    { label: 'Anomalies Detected', value: '2', change: 'Critical', positive: false },
                    { label: 'Projected Savings', value: '$1,240/mo', change: '+72%', positive: true },
                  ].map((metric) => (
                    <div key={metric.label} className="bg-white/80 dark:bg-gray-800/80 rounded-xl p-4 border border-slate-200/50 dark:border-gray-700/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-slate-500 dark:text-gray-400">{metric.label}</p>
                          <p className="text-xl font-bold text-slate-800 dark:text-gray-100 mt-1">{metric.value}</p>
                        </div>
                        <span className={`text-xs font-bold px-2 py-1 rounded-md ${
                          metric.positive
                            ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                            : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
                        }`}>
                          {metric.change}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Pricing Section ─── */}
      <section id="pricing" className="py-20 md:py-28 bg-slate-50/50 dark:bg-gray-900/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
              Simple, Transparent
              <span className="bg-gradient-to-r from-orange-500 to-amber-600 bg-clip-text text-transparent"> Pricing</span>
            </h2>
            <p className="text-slate-600 dark:text-gray-400 max-w-xl mx-auto">
              Start free, scale as you grow. No hidden fees.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className={`relative bg-white dark:bg-gray-800/80 rounded-2xl p-8 border shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                  plan.popular
                    ? 'border-orange-400 dark:border-orange-600 shadow-orange-100 dark:shadow-orange-900/10'
                    : 'border-slate-200 dark:border-gray-700/50'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-orange-500 to-amber-600 text-white text-xs font-bold rounded-full shadow-md">
                    Most Popular
                  </div>
                )}
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-extrabold">{plan.price}</span>
                  {plan.period && <span className="text-slate-500 dark:text-gray-400 text-sm">{plan.period}</span>}
                </div>
                <p className="text-sm text-slate-500 dark:text-gray-400 mb-6">{plan.description}</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-700 dark:text-gray-300">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={onGetStarted}
                  className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md hover:shadow-lg hover:scale-[1.02]'
                      : 'border-2 border-slate-300 dark:border-gray-600 text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="py-20 md:py-28">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-6">
            Ready to Take Control of Your
            <span className="bg-gradient-to-r from-orange-500 to-amber-600 bg-clip-text text-transparent"> Cloud Costs?</span>
          </h2>
          <p className="text-slate-600 dark:text-gray-400 mb-10 text-lg">
            Join thousands of cloud teams who've already cut their AWS bills with Cloud Autopilot.
          </p>
          <button
            onClick={onGetStarted}
            className="group inline-flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-orange-500 to-amber-600 text-white font-bold text-lg rounded-xl shadow-xl shadow-orange-500/20 hover:shadow-orange-500/30 transition-all duration-200 hover:scale-[1.03] active:scale-[0.98]"
          >
            Start Monitoring Now
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="py-8 border-t border-slate-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Logo" className="w-6 h-6 object-contain drop-shadow-sm" />
            <span className="text-sm font-semibold">Cloud Autopilot</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-gray-500">
            © 2026 Cloud Autopilot System · AI-Powered Cloud Intelligence
          </p>
        </div>
      </footer>
    </div>
  );
};
