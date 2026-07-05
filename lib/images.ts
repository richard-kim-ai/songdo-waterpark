const base = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/site-images`;

export function publicUrl(path: string) {
  return `${base}/${path}`;
}

export const images = {
  hero: `${base}/hero.jpg`,
  layoutMaster: `${base}/layout-master.jpg`,
  layoutCabana: `${base}/layout-cabana.jpg`,
  cabanaDiagram: `${base}/cabana-diagram.jpg`,
  train: `${base}/train.jpg`,
  car: `${base}/car.jpg`,
  gallery1: `${base}/gallery-1.jpg`,
  gallery2: `${base}/gallery-2.jpg`,
  gallery3: `${base}/gallery-3.jpg`,
  gallery4: `${base}/gallery-4.jpg`,
  gallery5: `${base}/gallery-5.jpg`,
  gallery6: `${base}/gallery-6.jpg`,
  safetyRules: `${base}/safety-rules.jpeg`,
  mapPlaceholder: `${base}/map-placeholder.png`,
};
