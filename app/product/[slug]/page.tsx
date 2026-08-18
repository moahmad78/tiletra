import { getProductBySlug, getProducts } from "@/lib/actions/products";
import ProductDetailsClient from "@/components/ProductDetailsClient";
import { notFound } from "next/navigation";

export const revalidate = 60;

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const relatedProducts = await getProducts({
    categorySlug: product.categorySlug,
    limit: 4,
  }).then((prods) => prods.filter((p) => p.id !== product.id).slice(0, 3));

  return (
    <ProductDetailsClient
      product={product}
      relatedProducts={relatedProducts}
    />
  );
}
