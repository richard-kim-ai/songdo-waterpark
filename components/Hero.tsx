import { renderLines } from '@/lib/renderLines';

export default function Hero({
  heroUrl,
  title,
  subtitle,
  ctaTicketLabel,
  ctaCabanaLabel,
}: {
  heroUrl: string;
  title: string;
  subtitle: string;
  ctaTicketLabel: string;
  ctaCabanaLabel: string;
}) {
  return (
    <section
      className="relative min-h-screen flex items-center justify-center"
      style={{
        background: `linear-gradient(rgba(87, 181, 231, 0.15), rgba(87, 181, 231, 0.05)), url('${heroUrl}') center/cover no-repeat`,
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/70 to-transparent"></div>
      <div className="relative w-full max-w-7xl mx-auto px-6 py-32 mt-16">
        <div className="max-w-2xl">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            {renderLines(title)}
          </h1>
          <p className="text-xl text-gray-700 mb-10 leading-relaxed">{renderLines(subtitle)}</p>
          <div className="flex flex-wrap gap-4">
            <a
              href="#pricing"
              className="px-8 py-4 bg-primary text-white font-semibold !rounded-button hover:bg-opacity-90 transition-all whitespace-nowrap cursor-pointer"
            >
              {ctaTicketLabel}
            </a>
            <a
              href="#cabana"
              className="px-8 py-4 bg-secondary text-white font-semibold !rounded-button hover:bg-opacity-90 transition-all whitespace-nowrap cursor-pointer"
            >
              {ctaCabanaLabel}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
