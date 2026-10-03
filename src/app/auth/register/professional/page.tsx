import { ProfessionalRegisterForm } from './ProfessionalRegisterForm';

export const metadata = {
  title: 'Professional Registration - Fixify',
  description: 'Create your professional account and start accepting jobs on Fixify',
};

export default function ProfessionalRegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--color-porcelain)] to-[var(--color-paper)] flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <ProfessionalRegisterForm />
        <div className="mt-8 text-center text-sm text-[var(--color-ink-4)]">
          <p>
            Looking to book services instead?{' '}
            <a href="/auth/register" className="font-semibold text-[var(--color-teal)] hover:underline">
              Register as a customer
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
