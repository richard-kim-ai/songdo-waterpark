// 연결 URL이 입력되어 있으면 새 창으로 바로 이동하고, 비어 있으면 기존처럼
// 페이지 내 해당 섹션(#pricing / #cabana)으로 스크롤한다.
function NavLink({
  url,
  anchor,
  label,
  className,
}: {
  url: string;
  anchor: string;
  label: string;
  className: string;
}) {
  if (url) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className={className}>
        {label}
      </a>
    );
  }
  return (
    <a href={anchor} className={className}>
      {label}
    </a>
  );
}

export default function MobileNav({
  ticketLabel,
  cabanaLabel,
  ticketUrl,
  cabanaUrl,
}: {
  ticketLabel: string;
  cabanaLabel: string;
  ticketUrl: string;
  cabanaUrl: string;
}) {
  const base =
    'flex-1 px-6 py-4 text-white font-bold text-center hover:bg-opacity-90 transition-all whitespace-nowrap cursor-pointer';

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white shadow-2xl md:hidden z-50 border-t border-gray-200">
      <div className="flex">
        <NavLink
          url={ticketUrl}
          anchor="#pricing"
          label={ticketLabel}
          className={`${base} bg-primary`}
        />
        <NavLink
          url={cabanaUrl}
          anchor="#cabana"
          label={cabanaLabel}
          className={`${base} bg-secondary`}
        />
      </div>
    </div>
  );
}
