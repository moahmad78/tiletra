export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  productCount: number;
  featured: boolean;
};

export const categories: Category[] = [
  {
    id: "cat-1",
    name: "Floor Tiles",
    slug: "floor-tiles",
    description: "Durable, slip-resistant tiles for every room in your home.",
    image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=80",
    productCount: 48,
    featured: true,
  },
  {
    id: "cat-2",
    name: "Wall Tiles",
    slug: "wall-tiles",
    description: "Beautiful wall tiles to elevate your bathroom and kitchen.",
    image: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800&q=80",
    productCount: 36,
    featured: true,
  },
  {
    id: "cat-3",
    name: "Bathroom Tiles",
    slug: "bathroom-tiles",
    description: "Waterproof, elegant tiles crafted for wet spaces.",
    image: "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=800&q=80",
    productCount: 52,
    featured: true,
  },
  {
    id: "cat-4",
    name: "Kitchen Tiles",
    slug: "kitchen-tiles",
    description: "Easy-to-clean, grease-resistant tiles for your kitchen.",
    image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80",
    productCount: 30,
    featured: true,
  },
  {
    id: "cat-5",
    name: "Outdoor Tiles",
    slug: "outdoor-tiles",
    description: "Weather-resistant tiles for patios, balconies & gardens.",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
    productCount: 24,
    featured: false,
  },
  {
    id: "cat-6",
    name: "Designer Tiles",
    slug: "designer-tiles",
    description: "Artistic, decorative tiles to make a bold statement.",
    image: "https://images.unsplash.com/photo-1615529182904-14819c35db37?w=800&q=80",
    productCount: 18,
    featured: false,
  },
];

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}
