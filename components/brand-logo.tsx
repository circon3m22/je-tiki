import Image from "next/image";

type BrandLogoProps = {
  tone?: "dark" | "light";
  className?: string;
  priority?: boolean;
};

const logoAssets = {
  dark: {
    src: "/brand/je-tiki-logo-dark.webp",
    width: 190,
    height: 78,
  },
  light: {
    src: "/brand/je-tiki-logo-light.png",
    width: 1206,
    height: 492,
  },
} as const;

export function BrandLogo({
  tone = "dark",
  className = "",
  priority = false,
}: BrandLogoProps) {
  const logo = logoAssets[tone];

  return (
    <Image
      src={logo.src}
      alt="Je Tiki"
      width={logo.width}
      height={logo.height}
      className={`block h-auto ${className}`}
      priority={priority}
    />
  );
}
