import homepageNexus from '@/assets/homepage-nexus.png';
import { InteractiveGrid } from '@/components/ui/interactive-grid.tsx';
import { RainbowButton } from '@/components/ui/rainbow-button.tsx';
import { ShineBorder } from '@/components/ui/shine-border.tsx';
import { useDownloadLink } from '@/hooks/useDownloadLink.ts';
import { Link } from '@tanstack/react-router';
import { Download } from 'lucide-react';

export function HeroSection() {
  const { downloadUrl, loading } = useDownloadLink();
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
          <Link
            to={downloadUrl as string}
            disabled={loading || !downloadUrl}
            className="flex gap-4 justify-center  pointer-events-auto z-30 relative rounded-2xl overflow-hidden"
            target="_blank"
          >
            <RainbowButton
              className="w-full max-w-xs "
            >
              {loading ? 'Loading...' : 'Download'}
              {!loading && <Download className="ml-1 w-4 h-4" />}
            </RainbowButton>
          </Link>
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
