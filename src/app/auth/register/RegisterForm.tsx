'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { Eye, EyeOff, AlertCircle, ArrowRight, Loader2, Home, Wrench as WrenchIcon } from 'lucide-react';
import { registerWithEmail } from './actions';

type UserRole = 'customer' | 'professional';

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRole = (searchParams?.get('role') as UserRole) || 'customer';

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    role: defaultRole,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value, type } = e.target;
    if (type === 'radio') {
      setFormData(prev => ({ ...prev, role: value as UserRole }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!formData.fullName.trim()) { setError('Please enter your full name.'); return; }
    if (!formData.email.trim()) { setError('Please enter your email address.'); return; }
    if (formData.password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (formData.password !== formData.confirmPassword) { setError('Passwords do not match.'); return; }

    setIsLoading(true);
    try {
      const result = await registerWithEmail({
        email: formData.email,
        password: formData.password,
        full_name: formData.fullName,
        role: formData.role,
      });

      if (result.success) {
        router.push('/auth/verify-email');
      } else {
        setError(result.error || 'Failed to create account. Please try again.');
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  const inputClass = "w-full px-4 py-3 rounded-xl border border-[#3a3f4a] bg-[#0a0b0d] text-[#f4f5f3] placeholder-[#a0a8b0]/60 text-sm focus:outline-none focus:ring-2 focus:ring-[#5fe3b0]/40 focus:border-[#5fe3b0]/60 disabled:opacity-50 transition-all";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Full name */}
      <div>
        <label htmlFor="fullName" className="block text-sm font-semibold text-[#f4f5f3] mb-2">Full name</label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          autoComplete="name"
          placeholder="Your full name"
          value={formData.fullName}
          onChange={handleChange}
          disabled={isLoading}
          required
          className={inputClass}
        />
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-semibold text-[#f4f5f3] mb-2">Email address</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={formData.email}
          onChange={handleChange}
          disabled={isLoading}
          required
          className={inputClass}
        />
      </div>

      {/* Password */}
      <div>
        <label htmlFor="password" className="block text-sm font-semibold text-[#f4f5f3] mb-2">Password</label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={formData.password}
            onChange={handleChange}
            disabled={isLoading}
            required
            className={`${inputClass} pr-12`}
          />
          <button type="button" onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#a0a8b0] hover:text-[#f4f5f3] transition-colors">
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Confirm password */}
      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-semibold text-[#f4f5f3] mb-2">Confirm password</label>
        <div className="relative">
          <input
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirm ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Re-enter your password"
            value={formData.confirmPassword}
            onChange={handleChange}
            disabled={isLoading}
            required
            className={`${inputClass} pr-12`}
          />
          <button type="button" onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#a0a8b0] hover:text-[#f4f5f3] transition-colors">
            {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Role selection */}
      <div>
        <p className="text-sm font-semibold text-[#f4f5f3] mb-3">I'm signing up as:</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: 'customer', icon: Home, label: 'Customer', sub: 'I need property services' },
            { value: 'professional', icon: WrenchIcon, label: 'Professional', sub: 'I provide services' },
          ].map(({ value, icon: Icon, label, sub }) => (
            <label
              key={value}
              className={`relative flex flex-col gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                formData.role === value
                  ? 'border-[#5fe3b0] bg-[#5fe3b0]/8'
                  : 'border-[#3a3f4a] bg-[#0a0b0d] hover:border-[#5fe3b0]/40'
              }`}
            >
              <input
                type="radio"
                name="role"
                value={value}
                checked={formData.role === value}
                onChange={handleChange}
                disabled={isLoading}
                className="sr-only"
              />
              <Icon className={`w-5 h-5 ${formData.role === value ? 'text-[#5fe3b0]' : 'text-[#a0a8b0]'}`} strokeWidth={1.75} />
              <div>
                <p className={`text-sm font-bold ${formData.role === value ? 'text-[#5fe3b0]' : 'text-[#f4f5f3]'}`}>{label}</p>
                <p className="text-[#a0a8b0] text-xs">{sub}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-[#5fe3b0] text-[#0a0b0d] font-bold text-sm rounded-xl hover:bg-[#4ecf9f] disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-lg hover:shadow-[#5fe3b0]/20"
      >
        {isLoading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Creating account…</>
        ) : (
          <>Create account <ArrowRight className="w-4 h-4" /></>
        )}
      </button>
    </form>
  );
}
