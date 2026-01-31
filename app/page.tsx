'use client';

import { useState } from 'react';
import { Phone, Clock, MapPin, Shield, Scale, Users, CheckCircle, ArrowRight, Mail, FileText, Handshake, Lock, Calculator } from 'lucide-react';

const PHONE_NUMBER = '985-264-9519';
const PHONE_HREF = 'tel:+19852649519';

export default function Home() {
  const [protectedTarget, setProtectedTarget] = useState<{ label: string; href: string } | null>(null);
  const [appPassword, setAppPassword] = useState('');
  const [appError, setAppError] = useState(false);

  const openProtected = (label: string, href: string) => {
    setProtectedTarget({ label, href });
    setAppPassword('');
    setAppError(false);
  };

  const handleAppAccess = () => {
    if (appPassword === '4461' && protectedTarget) {
      window.open(protectedTarget.href, '_blank');
      setProtectedTarget(null);
      setAppPassword('');
      setAppError(false);
    } else {
      setAppError(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <style>{`
        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 0 20px rgba(212, 175, 55, 0.4), 0 0 40px rgba(212, 175, 55, 0.2), 0 0 60px rgba(212, 175, 55, 0.1); }
          50% { box-shadow: 0 0 30px rgba(212, 175, 55, 0.6), 0 0 60px rgba(212, 175, 55, 0.3), 0 0 90px rgba(212, 175, 55, 0.15); }
        }
        .glow-button { animation: glow-pulse 2s ease-in-out infinite; }
      `}</style>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div className="flex items-center gap-2">
              <Shield className="w-8 h-8 text-[#d4af37]" />
              <span className="text-xl sm:text-2xl font-bold text-white">
                Bailbonds <span className="text-[#d4af37]">Financed</span>
              </span>
            </div>
            <a
              href={PHONE_HREF}
              className="flex items-center gap-2 bg-[#d4af37] hover:bg-[#e5c55a] text-[#0a0a0a] font-bold px-4 sm:px-6 py-2 sm:py-3 rounded-full transition-all hover:scale-105"
            >
              <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">{PHONE_NUMBER}</span>
              <span className="sm:hidden">Call Now</span>
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a4d2e] via-[#0f3620] to-[#0a0a0a]" />
        <div
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* 24/7 Badge */}
          <div className="inline-flex items-center gap-2 bg-[#d4af37]/20 border border-[#d4af37]/50 rounded-full px-4 py-2 mb-8">
            <Clock className="w-4 h-4 text-[#d4af37]" />
            <span className="text-[#d4af37] font-semibold">24/7 Emergency Service</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold text-white mb-6 leading-tight">
            Fast Bail Bonds in<br />
            <span className="text-[#d4af37]">St. Tammany Parish</span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto mb-8">
            When you need help fast, we're here for you. Flexible payment plans,
            professional service, and years of experience getting your loved ones home.
          </p>

          {/* Phone CTA */}
          <div className="mb-12">
            <a
              href={PHONE_HREF}
              className="relative inline-flex items-center gap-3 bg-[#d4af37] hover:bg-[#e5c55a] text-[#0a0a0a] font-bold text-xl sm:text-2xl px-8 sm:px-12 py-4 sm:py-5 rounded-full transition-all hover:scale-105 pulse-ring"
            >
              <Phone className="w-6 h-6 sm:w-8 sm:h-8" />
              <span>{PHONE_NUMBER}</span>
            </a>
            <p className="mt-4 text-gray-400">Call or text for immediate assistance</p>
          </div>

          {/* Quote CTA */}
          <div className="mb-12">
            <a
              href="/quote"
              className="glow-button inline-flex items-center gap-3 bg-[#1a4d2e] hover:bg-[#2d6b45] text-white font-bold text-lg sm:text-xl px-8 sm:px-10 py-3 sm:py-4 rounded-full border-2 border-[#d4af37] transition-all hover:scale-105"
            >
              <Calculator className="w-5 h-5 sm:w-6 sm:h-6 text-[#d4af37]" />
              <span>Get a Free Quote</span>
              <ArrowRight className="w-5 h-5 text-[#d4af37]" />
            </a>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap justify-center gap-6 sm:gap-12 text-gray-400">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-[#2d6b45]" />
              <span>Licensed & Insured</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-[#2d6b45]" />
              <span>Flexible Payments</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-[#2d6b45]" />
              <span>Confidential Service</span>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ArrowRight className="w-6 h-6 text-white/50 rotate-90" />
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 sm:py-32 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
              Our <span className="text-[#d4af37]">Services</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Professional bail bond services for all situations. We handle everything
              so you can focus on what matters most — your family.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Felony & Misdemeanor */}
            <div className="group bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border border-white/10 rounded-2xl p-6 sm:p-8 hover:border-[#d4af37]/50 transition-all hover:-translate-y-1">
              <div className="w-14 h-14 bg-[#1a4d2e]/30 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#1a4d2e]/50 transition-colors">
                <Scale className="w-7 h-7 text-[#d4af37]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Felony & Misdemeanor Bonds</h3>
              <p className="text-gray-400 mb-4">
                From minor misdemeanors to serious felony charges, we provide fast,
                reliable bail bond services for all criminal cases.
              </p>
              <ul className="space-y-2 text-sm text-gray-500">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#2d6b45]" />
                  Drug Possession
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#2d6b45]" />
                  Theft & Burglary
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#2d6b45]" />
                  Assault Charges
                </li>
              </ul>
            </div>

            {/* DUI & Traffic */}
            <div className="group bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border border-white/10 rounded-2xl p-6 sm:p-8 hover:border-[#d4af37]/50 transition-all hover:-translate-y-1">
              <div className="w-14 h-14 bg-[#1a4d2e]/30 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#1a4d2e]/50 transition-colors">
                <FileText className="w-7 h-7 text-[#d4af37]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">DUI & Traffic Bonds</h3>
              <p className="text-gray-400 mb-4">
                Quick release for DUI, DWI, and traffic violations. We understand
                these situations can happen to anyone.
              </p>
              <ul className="space-y-2 text-sm text-gray-500">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#2d6b45]" />
                  DUI/DWI Charges
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#2d6b45]" />
                  Reckless Driving
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#2d6b45]" />
                  License Violations
                </li>
              </ul>
            </div>

            {/* Immigration/ICE Bonds */}
            <div className="group bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border border-white/10 rounded-2xl p-6 sm:p-8 hover:border-[#d4af37]/50 transition-all hover:-translate-y-1 md:col-span-2 lg:col-span-1">
              <div className="w-14 h-14 bg-[#1a4d2e]/30 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#1a4d2e]/50 transition-colors">
                <Users className="w-7 h-7 text-[#d4af37]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Immigration & ICE Bonds</h3>
              <p className="text-gray-400 mb-4">
                Specialized assistance for ICE detentions and immigration cases.
                We navigate the complex federal system for you.
              </p>
              <ul className="space-y-2 text-sm text-gray-500">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#2d6b45]" />
                  ICE Detention Release
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#2d6b45]" />
                  Federal Immigration Bonds
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#2d6b45]" />
                  24/7 Availability
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Free Quote CTA Section */}
      <section className="py-16 sm:py-20 bg-gradient-to-r from-[#0a0a0a] via-[#1a4d2e]/30 to-[#0a0a0a]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Find Out What You&apos;ll Pay — <span className="text-[#d4af37]">Instantly</span>
          </h2>
          <p className="text-gray-400 text-lg mb-8">
            Use our free quote calculator to estimate your bail bond cost and payment plan. No obligation, no commitment.
          </p>
          <a
            href="/quote"
            className="glow-button inline-flex items-center gap-3 bg-[#d4af37] hover:bg-[#e5c55a] text-[#0a0a0a] font-bold text-xl sm:text-2xl px-10 sm:px-14 py-4 sm:py-5 rounded-full transition-all hover:scale-105"
          >
            <Calculator className="w-6 h-6 sm:w-7 sm:h-7" />
            <span>Get Your Free Quote</span>
            <ArrowRight className="w-6 h-6 sm:w-7 sm:h-7" />
          </a>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 sm:py-32 bg-gradient-to-b from-[#0a0a0a] to-[#1a4d2e]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
                Why Choose <span className="text-[#d4af37]">Bailbonds Financed?</span>
              </h2>
              <p className="text-gray-400 text-lg mb-8">
                As an affiliate of Louisiana Bail Agents, we bring professional
                expertise and compassionate service to every case. Your family's
                freedom is our priority.
              </p>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-[#d4af37]/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6 text-[#d4af37]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">24/7 Rapid Response</h3>
                    <p className="text-gray-400">We answer every call, day or night. When minutes matter, we're ready to help.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-[#d4af37]/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Handshake className="w-6 h-6 text-[#d4af37]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">Flexible Payment Plans</h3>
                    <p className="text-gray-400">We work with your budget. Multiple payment options available to fit your situation.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-[#d4af37]/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-[#d4af37]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">Local St. Tammany Expertise</h3>
                    <p className="text-gray-400">We know the local courts, jails, and processes. Fast service because we're right here.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-[#d4af37]/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Shield className="w-6 h-6 text-[#d4af37]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">Licensed & Professional</h3>
                    <p className="text-gray-400">Fully licensed Louisiana bail agents. Discreet, confidential, and professional.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats / CTA Card */}
            <div className="bg-gradient-to-br from-[#1a4d2e] to-[#0f3620] rounded-3xl p-8 sm:p-12 text-center">
              <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                Get Your Loved One Home Today
              </h3>
              <p className="text-gray-300 mb-8">
                Don't wait another minute. Call now and let us start working on
                getting your family member released.
              </p>

              <a
                href={PHONE_HREF}
                className="inline-flex items-center gap-3 bg-[#d4af37] hover:bg-[#e5c55a] text-[#0a0a0a] font-bold text-xl px-8 py-4 rounded-full transition-all hover:scale-105 mb-8"
              >
                <Phone className="w-6 h-6" />
                <span>{PHONE_NUMBER}</span>
              </a>

              <div className="grid grid-cols-3 gap-4 pt-8 border-t border-white/20">
                <div>
                  <div className="text-3xl font-bold text-[#d4af37]">24/7</div>
                  <div className="text-sm text-gray-400">Availability</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-[#d4af37]">Fast</div>
                  <div className="text-sm text-gray-400">Release</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-[#d4af37]">Low</div>
                  <div className="text-sm text-gray-400">Down Payment</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Service Area */}
      <section className="py-20 sm:py-32 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
            Serving <span className="text-[#d4af37]">St. Tammany Parish</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-12">
            Proudly serving all of St. Tammany Parish and Southeast Louisiana
          </p>

          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {['Covington', 'Mandeville', 'Slidell', 'Madisonville', 'Abita Springs', 'Folsom', 'Pearl River', 'Lacombe'].map((city) => (
              <div
                key={city}
                className="bg-[#1a1a1a] border border-white/10 rounded-full px-6 py-3 text-gray-300 hover:border-[#d4af37]/50 hover:text-white transition-all"
              >
                {city}
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-r from-[#1a4d2e]/20 via-[#1a4d2e]/30 to-[#1a4d2e]/20 rounded-2xl p-8 inline-flex items-center gap-4">
            <MapPin className="w-8 h-8 text-[#d4af37]" />
            <div className="text-left">
              <div className="text-white font-bold">St. Tammany Parish, Louisiana</div>
              <div className="text-gray-400">Affiliate of Louisiana Bail Agents</div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 sm:py-32 bg-gradient-to-b from-[#0a0a0a] to-[#0f0f0f]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
              Frequently Asked <span className="text-[#d4af37]">Questions</span>
            </h2>
            <p className="text-gray-400 text-lg">
              Get answers to common questions about the bail bond process
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: 'How quickly can you get someone out of jail in St. Tammany Parish?',
                a: 'In most cases, we can begin the release process immediately after you call. Depending on the jail and processing times, release can occur within 2-8 hours. We work around the clock to expedite the process.'
              },
              {
                q: 'What payment options do you offer for bail bonds?',
                a: 'We offer flexible payment plans with small down payment options. We accept cash, credit cards, and can work with you on a payment schedule that fits your budget.'
              },
              {
                q: 'Do you handle ICE and immigration bonds in Louisiana?',
                a: 'Yes, we specialize in immigration bonds and ICE releases. These cases require specific expertise with federal procedures, and our team is experienced in navigating the immigration bond process.'
              },
              {
                q: 'What information do I need to bail someone out?',
                a: 'You will need the full legal name of the person in custody, their date of birth, the jail location, and the charges if known. We can help you gather additional information once you call us.'
              },
              {
                q: 'Are your bail bond services confidential?',
                a: 'Absolutely. We understand the sensitive nature of these situations and maintain complete confidentiality. Your privacy is protected throughout the entire process.'
              },
            ].map((faq, i) => (
              <details
                key={i}
                className="group bg-[#1a1a1a] border border-white/10 rounded-2xl overflow-hidden hover:border-[#d4af37]/30 transition-colors"
              >
                <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                  <h3 className="text-lg font-semibold text-white pr-4">{faq.q}</h3>
                  <span className="text-[#d4af37] text-2xl flex-shrink-0 group-open:rotate-45 transition-transform">+</span>
                </summary>
                <div className="px-6 pb-6 text-gray-400 leading-relaxed">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-400 mb-4">Still have questions?</p>
            <a
              href={PHONE_HREF}
              className="inline-flex items-center gap-2 bg-[#d4af37] hover:bg-[#e5c55a] text-[#0a0a0a] font-bold px-6 py-3 rounded-full transition-all hover:scale-105"
            >
              <Phone className="w-5 h-5" />
              <span>Call Us Now</span>
            </a>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 sm:py-32 bg-gradient-to-b from-[#0a0a0a] to-[#1a4d2e]/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
            Need Help <span className="text-[#d4af37]">Right Now?</span>
          </h2>
          <p className="text-gray-400 text-lg mb-12">
            We understand this is a stressful time. Call us any time, day or night,
            and we'll guide you through every step of the process.
          </p>

          <div className="bg-[#1a1a1a] border border-white/10 rounded-3xl p-8 sm:p-12">
            <div className="grid sm:grid-cols-2 gap-8 mb-8">
              <a
                href={PHONE_HREF}
                className="flex flex-col items-center gap-4 p-6 bg-[#0a0a0a] rounded-2xl hover:bg-[#1a4d2e]/20 transition-colors group"
              >
                <div className="w-16 h-16 bg-[#d4af37]/20 rounded-full flex items-center justify-center group-hover:bg-[#d4af37]/30 transition-colors">
                  <Phone className="w-8 h-8 text-[#d4af37]" />
                </div>
                <div>
                  <div className="text-sm text-gray-400 mb-1">Call or Text 24/7</div>
                  <div className="text-2xl font-bold text-white">{PHONE_NUMBER}</div>
                </div>
              </a>

              <a
                href="mailto:bailbondsfinanced@gmail.com"
                className="flex flex-col items-center gap-4 p-6 bg-[#0a0a0a] rounded-2xl hover:bg-[#1a4d2e]/20 transition-colors group"
              >
                <div className="w-16 h-16 bg-[#d4af37]/20 rounded-full flex items-center justify-center group-hover:bg-[#d4af37]/30 transition-colors">
                  <Mail className="w-8 h-8 text-[#d4af37]" />
                </div>
                <div>
                  <div className="text-sm text-gray-400 mb-1">Email Us</div>
                  <div className="text-xl font-bold text-white">bailbondsfinanced@gmail.com</div>
                </div>
              </a>
            </div>

            <a
              href={PHONE_HREF}
              className="inline-flex items-center gap-3 bg-[#d4af37] hover:bg-[#e5c55a] text-[#0a0a0a] font-bold text-xl px-10 py-5 rounded-full transition-all hover:scale-105"
            >
              <Phone className="w-6 h-6" />
              <span>Call or Text — Free Consultation</span>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0a0a0a] border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-[#d4af37]" />
              <span className="text-lg font-bold text-white">
                Bailbonds <span className="text-[#d4af37]">Financed</span>
              </span>
            </div>

            <div className="text-center md:text-left">
              <div className="text-gray-400 text-sm">
                Affiliate of <a href="https://louisianabailagents.org/" target="_blank" rel="noopener noreferrer" className="text-[#d4af37] hover:underline">Louisiana Bail Agents</a>
              </div>
              <div className="text-gray-500 text-sm mt-1">
                Serving St. Tammany Parish, Louisiana
              </div>
            </div>

            <a
              href={PHONE_HREF}
              className="flex items-center gap-2 text-[#d4af37] font-bold hover:text-[#e5c55a] transition-colors"
            >
              <Phone className="w-5 h-5" />
              <span>{PHONE_NUMBER}</span>
            </a>
          </div>

          <div className="mt-8 pt-8 border-t border-white/10 flex flex-col items-center gap-4">
            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={() => openProtected('Bail Bond Application', '/Elite-Bail-Bonds-Application.pdf')}
                className="flex items-center gap-1.5 text-gray-400 hover:text-[#d4af37] text-sm transition-colors"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Application</span>
              </button>
            </div>
            <div className="text-gray-500 text-sm">
              © {new Date().getFullYear()} Bailbonds Financed. All rights reserved. Licensed Louisiana Bail Bond Agents.
            </div>
          </div>
        </div>
      </footer>

      {/* Password Modal for Protected Links */}
      {protectedTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setProtectedTarget(null)}>
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-8 max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-[#d4af37]/20 rounded-full flex items-center justify-center">
                <Lock className="w-5 h-5 text-[#d4af37]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{protectedTarget.label}</h3>
                <p className="text-gray-400 text-sm">Enter access code to continue</p>
              </div>
            </div>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={appPassword}
              onChange={e => { setAppPassword(e.target.value); setAppError(false); }}
              onKeyDown={e => e.key === 'Enter' && handleAppAccess()}
              placeholder="Enter code"
              autoFocus
              className={`w-full bg-[#0a0a0a] border ${appError ? 'border-red-500' : 'border-white/20'} rounded-xl px-4 py-3 text-white text-center text-lg tracking-widest placeholder-gray-600 focus:outline-none focus:border-[#d4af37] transition-colors`}
            />
            {appError && <p className="text-red-400 text-sm mt-2 text-center">Incorrect code</p>}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setProtectedTarget(null)}
                className="flex-1 px-4 py-2.5 border border-white/10 rounded-xl text-gray-400 hover:text-white hover:border-white/30 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAppAccess}
                className="flex-1 px-4 py-2.5 bg-[#d4af37] hover:bg-[#e5c55a] text-[#0a0a0a] font-bold rounded-xl transition-colors"
              >
                Access
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
