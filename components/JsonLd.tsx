import React from "react";
import { safeJsonLd } from "@/lib/seo";

interface JsonLdProps {
  data: Record<string, any> | Array<Record<string, any>>;
  id?: string;
}

/**
 * Renders an SEO Schema.org script tag safely escaped against HTML/XSS injection.
 */
export default function JsonLd({ data, id }: JsonLdProps) {
  if (!data) return null;

  return (
    <script
      id={id}
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: safeJsonLd(data),
      }}
    />
  );
}
