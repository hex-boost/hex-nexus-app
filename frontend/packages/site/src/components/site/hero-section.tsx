import homepageNexus from '@/assets/homepage-nexus.png';
import { InteractiveGrid } from '@/components/ui/interactive-grid.tsx';
import { RainbowButton } from '@/components/ui/rainbow-button.tsx';
import { ShineBorder } from '@/components/ui/shine-border.tsx';
import { useDownloadLink } from '@/hooks/useDownloadLink.ts';
import { Download, Loader2 } from 'lucide-react';

export function HeroSection() {
  const { loading } = useDownloadLink();
  const downloadPageUrl = '/download.html';

  return (
    <section className="relative min-h-screen pt-32 pb-16 overflow-hidden  bg-background">

      <InteractiveGrid containerClassName="absolute inset-0 pointer-events-none " className="opacity-30" points={40} />

      <ShineBorder
        className="relative z-10 max-w-6xl mx-auto px-6 py-8"
        borderClassName="border border-white/10 rounded-xl overflow-hidden"
      >
        <div className="text-center mb-16 ">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
            Empower Your Boosting Experience
            <br />
            Accounts On Demand, Zero Hassle
          </h1>
          <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
            Transform Your Workflow with All-in-One Account Renter
          </p>
          <a
            href={loading ? '#' : downloadPageUrl}
            className="flex gap-4 justify-center pointer-events-auto z-30 relative rounded-2xl overflow-hidden"
            target="_blank"
            // Remove download attribute as we're using the redirect page now
          >
            <RainbowButton className="w-full max-w-xs">
              {loading
                ? <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                : 'Download for Free'}
              {!loading && <Download className="ml-2 w-4 h-4" />}
            </RainbowButton>
          </a>
        </div>

        <div className="relative rounded-2xl overflow-hidden bg-background">
          <img
            src={homepageNexus}
            alt="Background Gradient"
            width={1920}
            height={1080}
            className="w-full h-auto"
          />

        </div>
      </ShineBorder>
    </section>
  );
}
