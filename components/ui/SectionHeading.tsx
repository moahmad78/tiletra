import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  className?: string;
  centered?: boolean;
}

export function SectionHeading({
  title,
  subtitle,
  className,
  centered = true,
}: SectionHeadingProps) {
  return (
    <div className={cn("mb-12", centered && "text-center", className)}>
      <h2 className="text-3xl font-bold tracking-tight text-dark md:text-4xl lg:text-5xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 max-w-2xl text-lg text-gray-600 mx-auto">
          {subtitle}
        </p>
      )}
    </div>
  );
}
