import { images } from '@/lib/images';

const ITEMS = [
  { label: '물놀이장 전경', src: images.gallery1 },
  { label: '발물놀이터', src: images.gallery2 },
  { label: '카바나 내부', src: images.gallery3 },
  { label: '카바나 외부', src: images.gallery4 },
  { label: '신나는기차', src: images.gallery5 },
  { label: '캠핑장 전경', src: images.gallery6 },
];

export default function Gallery() {
  return (
    <section id="gallery" className="py-20 bg-gradient-to-b from-white to-blue-50/30">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">포토 갤러리</h2>
          <p className="text-lg text-gray-600">송도국제캠핑장 물놀이장의 생생한 모습</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {ITEMS.map((item) => (
            <div
              key={item.label}
              className="relative rounded-xl overflow-hidden shadow-lg group cursor-pointer aspect-video"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.src}
                alt={item.label}
                className="w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                <p className="text-white font-semibold text-lg p-6">{item.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
