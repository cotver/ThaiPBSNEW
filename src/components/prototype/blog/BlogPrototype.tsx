import type { Title } from "@/lib/content";
import type { CategoryTile, TitleCollections } from "@/lib/payload-content";
import type { PrototypeCategory, PrototypeStyle } from "./blog-data";
import {
  StyleOneArticle,
  StyleOneCategory,
  StyleOneHome,
  StyleThreeArticle,
  StyleThreeCategory,
  StyleThreeHome,
  StyleTwoArticle,
  StyleTwoCategory,
  StyleTwoHome,
} from "./StylePrototypes";
import { StyleFourArticle, StyleFourCategory, StyleFourHome } from "./StyleFourPrototype";
import { StyleFiveArticle, StyleFiveCategory, StyleFiveHome } from "./StyleFivePrototype";
import { StyleSixArticle, StyleSixCategory, StyleSixHome } from "./StyleSixPrototype";

export function BlogPrototypeHome({ categoryTiles, collections, style, titles }: { categoryTiles: CategoryTile[]; collections: TitleCollections; style: PrototypeStyle; titles: Title[] }) {
  if (style === "style-1") return <StyleOneHome categoryTiles={categoryTiles} collections={collections} titles={titles} />;
  if (style === "style-2") return <StyleTwoHome categoryTiles={categoryTiles} collections={collections} titles={titles} />;
  if (style === "style-4") return <StyleFourHome categoryTiles={categoryTiles} collections={collections} titles={titles} />;
  if (style === "style-5") return <StyleFiveHome categoryTiles={categoryTiles} collections={collections} titles={titles} />;
  if (style === "style-6") return <StyleSixHome categoryTiles={categoryTiles} collections={collections} titles={titles} />;
  return <StyleThreeHome categoryTiles={categoryTiles} collections={collections} titles={titles} />;
}

export function BlogPrototypeCategory({ category, style, titles }: { category: PrototypeCategory; style: PrototypeStyle; titles: Title[] }) {
  if (style === "style-1") return <StyleOneCategory category={category} titles={titles} />;
  if (style === "style-2") return <StyleTwoCategory category={category} titles={titles} />;
  if (style === "style-4") return <StyleFourCategory category={category} titles={titles} />;
  if (style === "style-5") return <StyleFiveCategory category={category} titles={titles} />;
  if (style === "style-6") return <StyleSixCategory category={category} titles={titles} />;
  return <StyleThreeCategory category={category} titles={titles} />;
}

export function BlogPrototypeArticle({ related, style, title }: { related: Title[]; style: PrototypeStyle; title: Title }) {
  if (style === "style-1") return <StyleOneArticle related={related} title={title} />;
  if (style === "style-2") return <StyleTwoArticle related={related} title={title} />;
  if (style === "style-4") return <StyleFourArticle related={related} title={title} />;
  if (style === "style-5") return <StyleFiveArticle related={related} title={title} />;
  if (style === "style-6") return <StyleSixArticle related={related} title={title} />;
  return <StyleThreeArticle related={related} title={title} />;
}
