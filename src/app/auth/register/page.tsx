import { RegisterForm } from './RegisterForm';
import { Lockup } from '@/components/brand/Lockup';

export const metadata = {
  title: 'Create your Fixify account',
  description: 'Create a customer account to get your property problem moving.',
};

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-porcelain)] px-5 py-8 text-[var(--color-ink)] sm:px-8 sm:py-12">
      <div className="w-full max-w-[480px] motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500">
        <header className="mb-8 text-center">
          <Lockup size="md" href="/" className="mx-auto w-fit" />
          <p className="mt-4 text-sm font-medium text-[var(--color-ink-3)]">Property maintenance, made clearer.</p>
        </header>
        <RegisterForm />
        <p className="mt-6 text-center text-xs text-[var(--color-ink-4)]">
          <a href="/" className="hover:text-[var(--color-teal)]">Back to homepage</a>
        </p>
      </div>
    </main>
  );
}
