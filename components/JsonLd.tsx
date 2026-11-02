import React from "react";
import { safeJsonLd } from "@/lib/seo";

interface JsonLdProps {
  data?: Record<string, any> | Array<Record<string, any>>;
  schema?: Record<string, any> | Array<Record<string, any>>;
  id?: string;
}

/**
 * Renders an SEO Schema.org script tag safely escaped against HTML/XSS injection.
 * Supports both `data` and `schema` props for compatibility.
 */
export default function JsonLd({ data, schema, id }: JsonLdProps) {
  const payload = data || schema;
  if (!payload) return null;

  return (
    <script
      id={id}
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: safeJsonLd(payload),
      }}
    />
  );
}
