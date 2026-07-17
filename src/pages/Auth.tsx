import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Fuel, Mail, Lock, Eye, EyeOff, ArrowRight, User, Phone, ShieldCheck } from 'lucide-react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { toast } from 'sonner';
import { ConfirmationResult } from 'firebase/auth';

export default function Auth() {
  const { signIn, signInWithEmail, signUpWithEmail, signInWithPhone, setupRecaptcha, recaptchaSolved, verifyOtp, authError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isLogin, setIsLogin] = useState(location.pathname !== '/signup');
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    setIsLogin(location.pathname !== '/signup');
    // Reset phone auth state when switching between login/signup
    setConfirmationResult(null);
    setOtp('');
  }, [location.pathname]);

  useEffect(() => {
    if (authMethod === 'phone' && !confirmationResult) {
      // Small delay to ensure the container is in the DOM
      const timer = setTimeout(() => {
        setupRecaptcha('recaptcha-container');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [authMethod, confirmationResult]);

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    const toastId = toast.loading('Connecting to Google...');
    try {
      await signIn();
      toast.success('Successfully signed in with Google!', { id: toastId });
    } catch (error) {
      toast.error('Failed to sign in with Google', { id: toastId });
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) return;
    
    setIsSigningIn(true);
    const toastId = toast.loading('Sending verification code...');
    try {
      const result = await signInWithPhone(phoneNumber, 'recaptcha-container');
      if (result) {
        setConfirmationResult(result);
        toast.success('Verification code sent!', { id: toastId });
      }
    } catch (error: any) {
      if (error.code === 'auth/billing-not-enabled') {
        toast.error('Phone authentication requires billing to be enabled in the Firebase Console.', { 
          id: toastId,
          duration: 6000 
        });
      } else {
        toast.error('Failed to send code. Please check your number and try again.', { id: toastId });
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || !confirmationResult) return;
    
    setIsSigningIn(true);
    const toastId = toast.loading('Verifying code...');
    try {
      await verifyOtp(confirmationResult, otp);
      toast.success('Successfully verified!', { id: toastId });
    } catch (error) {
      toast.error('Invalid verification code', { id: toastId });
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    if (!isLogin && !agreed) return;
    
    setIsSigningIn(true);
    const toastId = toast.loading(isLogin ? 'Signing in...' : 'Creating account...');
    try {
      if (isLogin) {
        await signInWithEmail(email.trim(), password);
        toast.success('Welcome back!', { id: toastId });
      } else {
        await signUpWithEmail(email.trim(), password);
        toast.success('Account created successfully!', { id: toastId });
      }
    } catch (error: any) {
      if (isLogin && error.code === 'auth/user-not-found') {
        toast.error('Account not found. Redirecting to registration...', { id: toastId });
        setTimeout(() => {
          setIsLogin(false);
          navigate('/signup');
        }, 1500);
      } else if (!isLogin && error.code === 'auth/email-already-in-use') {
        toast.error('Account already exists. Redirecting to login...', { id: toastId });
        setTimeout(() => {
          setIsLogin(true);
          navigate('/login');
        }, 1500);
      } else if (isLogin && error.code === 'auth/invalid-credential') {
        toast.error('Invalid email or password. If you don\'t have an account, please sign up.', { id: toastId });
      } else {
        toast.error(isLogin ? 'Sign in failed' : 'Account creation failed', { id: toastId });
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-10 px-6 shadow-sm sm:rounded-[2rem] sm:px-10 border border-gray-100">
          
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 rounded-2xl border-2 border-emerald-500/20 p-1 mb-6 flex items-center justify-center">
              <div className="w-full h-full bg-emerald-600 rounded-xl flex items-center justify-center">
                <Fuel className="h-8 w-8 text-white" />
              </div>
            </div>
            <h2 className="text-center text-3xl font-bold text-gray-900 tracking-tight">
              {isLogin ? 'Welcome Back' : 'Join SL Fuel Monitor'}
            </h2>
            <p className="mt-2 text-center text-base text-gray-500">
              {isLogin ? 'Monitor fuel prices in real-time.' : 'Start tracking fuel prices today.'}
            </p>
          </div>

          {/* Auth Method Toggle */}
          <div className="flex p-1 bg-gray-100 rounded-2xl mb-8">
            <button
              onClick={() => { setAuthMethod('email'); setConfirmationResult(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-xl transition-all ${
                authMethod === 'email' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Mail className="w-4 h-4" />
              Email
            </button>
            <button
              onClick={() => { setAuthMethod('phone'); setConfirmationResult(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-xl transition-all ${
                authMethod === 'phone' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Phone className="w-4 h-4 text-amber-500" />
              <div className="flex items-center gap-1.5 animate-pulse">
                <span>Phone</span>
                <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 uppercase tracking-wide">Soon</span>
              </div>
            </button>
          </div>

          {authError && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3 text-rose-600 text-sm">
              <p className="font-medium">{authError}</p>
            </div>
          )}

          {authMethod === 'email' ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                      <User className="h-5 w-5" />
                    </div>
                    <input
                      type="text"
                      required={!isLogin}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="block w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 text-gray-900 font-medium transition-all placeholder:text-gray-300 placeholder:font-normal"
                      placeholder="John Karimu"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                    <Mail className="h-5 w-5" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 text-gray-900 font-medium transition-all placeholder:text-gray-300 placeholder:font-normal"
                    placeholder="john@slfuelmonitor.sl"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-bold text-gray-700">
                    Password
                  </label>
                  {isLogin && (
                    <Link to="#" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700">
                      Forgot?
                    </Link>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-11 pr-12 py-3.5 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 text-gray-900 font-medium transition-all placeholder:text-gray-300 placeholder:font-normal tracking-widest"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {isLogin ? (
                <div className="flex items-center">
                  <input
                    id="keep-signed-in"
                    type="checkbox"
                    checked={keepSignedIn}
                    onChange={(e) => setKeepSignedIn(e.target.checked)}
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                  />
                  <label htmlFor="keep-signed-in" className="ml-2 block text-sm text-gray-600">
                    Keep me signed in
                  </label>
                </div>
              ) : (
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="terms"
                      type="checkbox"
                      required
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded mt-0.5"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="terms" className="text-gray-600">
                      I agree to the{' '}
                      <Link to="#" className="font-semibold text-emerald-600 hover:text-emerald-700">Terms of Service</Link>
                      {', '}
                      <Link to="#" className="font-semibold text-emerald-600 hover:text-emerald-700">Privacy Policy</Link>
                      {', and '}
                      <Link to="#" className="font-semibold text-emerald-600 hover:text-emerald-700">Cookie Policy</Link>
                    </label>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={isSigningIn || !email || !password || (!isLogin && !agreed)}
                showNotification={false}
                className="w-full flex justify-center items-center gap-2 py-4 px-4 border border-transparent rounded-2xl text-base font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
              >
                {isSigningIn ? (isLogin ? 'Signing in...' : 'Creating account...') : (isLogin ? 'Sign In' : 'Create Account')}
                {!isSigningIn && <ArrowRight className="h-5 w-5" />}
              </Button>
            </form>
          ) : (
            <div className="text-center py-10 bg-gray-50 rounded-2xl border border-gray-100">
              <Phone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900">Coming Soon</h3>
              <p className="text-gray-500 mt-2 px-6">Phone authentication is currently under development. Please check back later!</p>
            </div>
          )}

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              {isLogin ? (
                <>
                  New to SL Fuel Monitor?{' '}
                  <button 
                    onClick={() => navigate('/signup')}
                    className="font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
                  >
                    Register for free
                  </button>
                </>
              ) : (
                <>
                  Member already?{' '}
                  <button 
                    onClick={() => navigate('/login')}
                    className="font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
                  >
                    Sign in here
                  </button>
                </>
              )}
            </p>
          </div>

          <div className="mt-8 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-4 bg-white text-gray-400 font-medium">Or continue with</span>
            </div>
          </div>

          <div className="mt-6">
            <Button
              onClick={handleGoogleSignIn}
              disabled={isSigningIn}
              showNotification={false}
              className="w-full flex justify-center items-center gap-3 py-3.5 px-4 border border-gray-200 rounded-2xl shadow-sm text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Google
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
