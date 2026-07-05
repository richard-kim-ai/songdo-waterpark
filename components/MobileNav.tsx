export default function MobileNav() {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white shadow-2xl md:hidden z-50 border-t border-gray-200">
      <div className="flex">
        <a
          href="#pricing"
          className="flex-1 px-6 py-4 bg-primary text-white font-bold text-center hover:bg-opacity-90 transition-all whitespace-nowrap cursor-pointer"
        >
          입장권 구매
        </a>
        <a
          href="#cabana"
          className="flex-1 px-6 py-4 bg-secondary text-white font-bold text-center hover:bg-opacity-90 transition-all whitespace-nowrap cursor-pointer"
        >
          카바나 예약
        </a>
      </div>
    </div>
  );
}
