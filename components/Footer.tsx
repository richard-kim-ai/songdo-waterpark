import Link from 'next/link';

export default function Footer({
  logoUrl,
  mapUrl,
  tagline,
  addressTitle,
  hoursTitle,
  termsLabel,
  privacyLabel,
  address,
  phone,
  email,
  copyright,
  poolSeason,
  poolWeekdayHours,
  poolWeekendHours,
  blogUrl,
  instagramUrl,
  youtubeUrl,
}: {
  logoUrl: string;
  mapUrl: string;
  tagline: string;
  addressTitle: string;
  hoursTitle: string;
  termsLabel: string;
  privacyLabel: string;
  address: string;
  phone: string;
  email: string;
  copyright: string;
  poolSeason: string;
  poolWeekdayHours: string;
  poolWeekendHours: string;
  blogUrl: string;
  instagramUrl: string;
  youtubeUrl: string;
}) {
  const snsLinks = [
    { url: blogUrl, icon: 'ri-quill-pen-line', label: '블로그' },
    { url: instagramUrl, icon: 'ri-instagram-fill', label: '인스타그램' },
    { url: youtubeUrl, icon: 'ri-youtube-fill', label: '유튜브' },
  ].filter((s) => s.url.trim());

  return (
    <footer className="bg-gray-900 text-white py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="grid md:grid-cols-3 gap-8 md:gap-12 mb-10 md:mb-12">
          <div>
            <Link href="/">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoUrl}
                alt="송도국제캠핑장"
                className="h-16 md:h-24 w-auto mb-5 md:mb-6 cursor-pointer"
              />
            </Link>
            <p className="text-gray-400 leading-relaxed">{tagline}</p>
          </div>
          <div>
            <h4 className="font-bold text-lg mb-6">{addressTitle}</h4>
            <div className="space-y-3 text-gray-400">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 flex items-center justify-center">
                  <i className="ri-map-pin-line text-lg"></i>
                </div>
                <p>{address}</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 flex items-center justify-center">
                  <i className="ri-phone-line text-lg"></i>
                </div>
                <p>{phone}</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 flex items-center justify-center">
                  <i className="ri-mail-line text-lg"></i>
                </div>
                <p>{email}</p>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-bold text-lg mb-6">{hoursTitle}</h4>
            <div className="space-y-3 text-gray-400">
              <p>하계 시즌: {poolSeason}</p>
              <p>평일: {poolWeekdayHours}</p>
              <p>주말: {poolWeekendHours}</p>
            </div>
            {/* SNS 아이콘은 관리자에서 URL을 입력한 것만 노출된다. */}
            {snsLinks.length > 0 && (
              <div className="flex gap-3 md:gap-4 mt-6">
                {snsLinks.map((sns) => (
                  <a
                    key={sns.icon}
                    href={sns.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={sns.label}
                    title={sns.label}
                    className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-full hover:bg-primary transition-colors cursor-pointer"
                  >
                    <i className={`${sns.icon} text-xl`}></i>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
        <div
          className="h-64 rounded-lg overflow-hidden mb-12"
          style={{ background: `url('${mapUrl}') center/cover no-repeat` }}
        ></div>
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-400 text-sm">{copyright}</p>
          <div className="flex gap-6 text-sm">
            <a href="#" className="text-gray-400 hover:text-white transition-colors cursor-pointer">
              {termsLabel}
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors cursor-pointer">
              {privacyLabel}
            </a>
            <Link
              href="/admin"
              className="text-gray-500 hover:text-white transition-colors cursor-pointer"
            >
              관리자 로그인
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
