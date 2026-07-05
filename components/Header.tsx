const NAV_ITEMS = [
  { href: '#pricing', label: '입장안내' },
  { href: '#cabana', label: '카바나' },
  { href: '#facilities', label: '부속시설' },
  { href: '#info', label: '이용안내' },
  { href: '#gallery', label: '갤러리' },
];

export default function Header() {
  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-deep-tide/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <a href="#" className="flex items-center gap-2 text-white">
          <span className="h-2.5 w-2.5 rounded-full bg-sun-flare" />
          <span className="font-display font-bold tracking-wide">
            송도국제캠핑장 <span className="text-sun-flare">물놀이장</span>
          </span>
        </a>
        <nav className="hidden gap-8 md:flex">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-white/80 transition hover:text-sun-flare"
            >
              {item.label}
            </a>
          ))}
        </nav>
        <a
          href="#pricing"
          className="rounded-full bg-sun-flare px-5 py-2 text-sm font-bold text-deep-tide transition hover:brightness-95"
        >
          입장권 구매
        </a>
      </div>
    </header>
  );
}
