import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Je Tiki — украшения из дерева и серебра",
    short_name: "Je Tiki",
    description:
      "Современные украшения и небольшие предметы из дерева и серебра.",
    start_url: "/",
    display: "standalone",
    background_color: "#fbfbfa",
    theme_color: "#fbfbfa",
    lang: "ru",
    icons: [{ src: "/icon", sizes: "64x64", type: "image/png" }],
  };
}
