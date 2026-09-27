import { getCurrentUser } from '@/lib/auth';
import { FixifyHomepage } from '@/components/marketing/FixifyHomepage';

export const metadata = {
  title: 'Fixify — Your problem. Properly fixed.',
  description:
    'Tell Fixify what is happening. We help turn it into the right service, a clear booking and a properly recorded job.',
};

export default async function HomePage() {
  const user = await getCurrentUser();

  return <FixifyHomepage isSignedIn={Boolean(user)} />;
}
