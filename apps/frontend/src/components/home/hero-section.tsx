'use client';

import { useState, useEffect, lazy, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useIsMobile } from '@/hooks/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogOverlay,
} from '@/components/ui/dialog';
import { useTranslations } from 'next-intl';
import { trackCtaSignup } from '@/lib/analytics/gtm';
import { useAgentStartInput } from '@/hooks/dashboard';
import { ChatInput } from '@/components/thread/chat-input/chat-input';
import { DynamicGreeting } from '@/components/ui/dynamic-greeting';

// Lazy load heavy components
const bapXModesPanel = lazy(() => 
  import('@/components/dashboard/bapX-modes-panel').then(mod => ({ default: mod.bapXModesPanel }))
);
const GoogleSignIn = lazy(() => import('@/components/GoogleSignIn'));

const BlurredDialogOverlay = () => (
  <DialogOverlay className="bg-background/40 backdrop-blur-md" />
);

export function HeroSection() {
  const t = useTranslations('dashboard');
  const tAuth = useTranslations('auth');
  const isMobile = useIsMobile();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  
  // Close auth dialog and redirect when user logs in
  useEffect(() => {
    if (authDialogOpen && user && !isLoading) {
      setAuthDialogOpen(false);
      router.push('/dashboard');
    }
  }, [user, isLoading, authDialogOpen, router]);
  
  const handleAuthRequired = (pendingMessage: string) => {
    trackCtaSignup();
    setAuthDialogOpen(true);
  };

  // Use the agent start input hook for state management (same as dashboard)
  const {
    inputValue,
    setInputValue,
    isSubmitting,
    isRedirecting,
    chatInputRef,
    selectedAgentId,
    setSelectedAgent,
    selectedMode,
    selectedCharts,
    selectedOutputFormat,
    selectedTemplate,
    setSelectedMode,
    setSelectedCharts,
    setSelectedOutputFormat,
    setSelectedTemplate,
    handleSubmit,
  } = useAgentStartInput({
    redirectOnError: '/',
    requireAuth: true,
    onAuthRequired: handleAuthRequired,
    enableAutoSubmit: true,
    logPrefix: '[HeroSection]',
  });
  
  return (
    <section id="hero" className="w-full h-dvh relative overflow-hidden bg-white">
      {/* Vibrant Background Gradients - Dopamine Rush */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100 opacity-60"></div>
      <div className="absolute top-[-20%] left-[-10%] w-[100vw] h-[100vw] bg-[radial-gradient(circle_at_center,_rgba(59,130,246,0.15)_0%,_transparent_50%)] animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[100vw] h-[100vw] bg-[radial-gradient(circle_at_center,_rgba(236,72,153,0.1)_0%,_transparent_50%)] animate-pulse delay-1000 pointer-events-none"></div>

      <div className="flex flex-col h-full w-full relative z-10 px-4">
        {/* Floating Chat Bubbles - High Social Presence */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[15%] left-[10%] bg-blue-500 text-white px-6 py-3 rounded-[24px] rounded-bl-none shadow-xl text-sm font-bold animate-bounce opacity-80 decoration-none">
            Hey! Ready to build? 🚀
          </div>
          <div className="absolute top-[25%] right-[15%] bg-gradient-to-tr from-pink-500 to-purple-500 text-white px-6 py-3 rounded-[24px] rounded-br-none shadow-xl text-sm font-bold animate-bounce delay-700 opacity-80">
            bapX Social is LIVE! ✨
          </div>
        </div>

        {/* Brand Header */}
        <header className="py-8 flex justify-between items-center max-w-7xl mx-auto w-full">
           <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500 rounded-2xl shadow-lg flex items-center justify-center text-white font-black text-xl">b</div>
            <span className="text-3xl font-black tracking-tighter text-black">bapX</span>
          </div>
          <button onClick={() => setAuthDialogOpen(true)} className="px-6 py-2 bg-black text-white rounded-full font-bold hover:scale-105 transition-all shadow-lg text-sm">
            Enter Nexus
          </button>
        </header>

        {/* Main Hero Content */}
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8">
          <div className="space-y-4 max-w-3xl">
            <div className="inline-block px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-600 text-xs font-black tracking-widest uppercase animate-pulse">
              Social Super-App Alpha
            </div>
            <h1 className="text-6xl sm:text-7xl md:text-8xl font-black tracking-tighter text-black leading-[0.9]">
              The World's <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">Social OS.</span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-500 font-bold max-w-xl mx-auto leading-relaxed">
              Connect. Create. Conquer. The ultimate platform for the **One-Person Company**.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center gap-4">
            <button className="px-10 py-4 bg-blue-600 text-white font-black rounded-3xl text-lg shadow-[0_20px_40px_rgba(37,99,235,0.3)] hover:scale-105 hover:bg-blue-700 transition-all">
              Launch Agent 🚀
            </button>
            <button className="px-10 py-4 border-2 border-gray-200 text-black font-black rounded-3xl text-lg hover:bg-gray-50 transition-all">
              View Moments 🧭
            </button>
          </div>
        </div>

        {/* Chat Input - Integrated at Bottom */}
        <div className="w-full max-w-3xl mx-auto pb-12">
          <div className="bg-white/80 backdrop-blur-2xl rounded-[2.5rem] p-3 shadow-[0_30px_60px_rgba(0,0,0,0.1)] border border-white/50 relative group">
             <ChatInput
                ref={chatInputRef}
                onSubmit={handleSubmit}
                placeholder={"Ask your AI sidekick anything..."}
                loading={isSubmitting || isRedirecting}
                disabled={isSubmitting}
                value={inputValue}
                onChange={setInputValue}
                isLoggedIn={!!user}
                selectedAgentId={selectedAgentId}
                onAgentSelect={setSelectedAgent}
                autoFocus={false}
                enableAdvancedConfig={false}
                selectedMode={selectedMode}
                onModeDeselect={() => setSelectedMode(null)}
                animatePlaceholder={true}
                hideAttachments={false}
              />
          </div>
        </div>
      </div>

      {/* Auth Dialog */}
      <Dialog open={authDialogOpen} onOpenChange={setAuthDialogOpen}>
        <BlurredDialogOverlay />
        <DialogContent className="sm:max-w-md rounded-xl bg-background border border-border">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-medium">
                {tAuth('signInToContinue')}
              </DialogTitle>
            </div>
            <DialogDescription className="text-muted-foreground">
              {tAuth('signInOrCreateAccountToTalk')}
            </DialogDescription>
          </DialogHeader>

          <div className="w-full space-y-3 mt-8">
            <Suspense fallback={<div className="h-12 bg-muted/20 rounded-full animate-pulse" />}>
              <GoogleSignIn returnUrl="/dashboard" />
            </Suspense>
          </div>

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-background text-muted-foreground font-medium">
                {tAuth('orContinueWithEmail')}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <Link
              href={`/auth?returnUrl=${encodeURIComponent('/dashboard')}`}
              className="flex h-12 items-center justify-center w-full text-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm font-medium"
              onClick={() => {
                trackCtaSignup();
                setAuthDialogOpen(false);
              }}
            >
              {tAuth('signInWithEmail')}
            </Link>

            <Link
              href={`/auth?mode=signup&returnUrl=${encodeURIComponent('/dashboard')}`}
              className="flex h-12 items-center justify-center w-full text-center rounded-full border border-border bg-background hover:bg-accent/50 transition-all font-medium"
              onClick={() => {
                trackCtaSignup();
                setAuthDialogOpen(false);
              }}
            >
              {tAuth('createNewAccount')}
            </Link>
          </div>

          <div className="mt-8 text-center text-[13px] text-muted-foreground leading-relaxed">
            {tAuth('byContinuingYouAgreeSimple')}{' '}
            <a href="https://www.bapx.com/legal?tab=terms" target="_blank" rel="noopener noreferrer" className="text-foreground/70 hover:text-foreground underline underline-offset-2 transition-colors">
              {tAuth('termsOfService')}
            </a>{' '}
            and{' '}
            <a href="https://www.bapx.com/legal?tab=privacy" target="_blank" rel="noopener noreferrer" className="text-foreground/70 hover:text-foreground underline underline-offset-2 transition-colors">
              {tAuth('privacyPolicy')}
            </a>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
