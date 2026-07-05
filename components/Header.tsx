const NAV_ITEMS = [
  { href: '#pricing', label: '입장안내' },
  { href: '#cabana', label: '카바나' },
  { href: '#facilities', label: '부속시설' },
  { href: '#info', label: '이용안내' },
  { href: '#gallery', label: '갤러리' },
];

export default function Header() {
  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm shadow-sm z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="font-pacifico text-2xl text-primary">logo</div>
          <div className="hidden md:flex items-center gap-8">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-gray-700 hover:text-primary transition-colors cursor-pointer"
              >
                {item.label}
              </a>
            ))}
          </div>
          <div className="w-6 h-6 flex items-center justify-center md:hidden cursor-pointer">
            <i className="ri-menu-line text-2xl text-gray-700"></i>
          </div>
        </div>
      </div>
    </nav>
  );
}
