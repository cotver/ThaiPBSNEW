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
import { StyleEightArticle, StyleEightCategory, StyleEightHome } from "./StyleEightPrototype";
import { StyleNineArticle, StyleNineCategory, StyleNineHome } from "./StyleNinePrototype";
import { StyleTenArticle, StyleTenCategory, StyleTenHome } from "./StyleTenPrototype";
import { StyleElevenArticle, StyleElevenCategory, StyleElevenHome } from "./StyleElevenPrototype";

export function BlogPrototypeHome({ categoryTiles, collections, style, titles }: { categoryTiles: CategoryTile[]; collections: TitleCollections; style: PrototypeStyle; titles: Title[] }) {
  if (style === "style-1") return <StyleOneHome categoryTiles={categoryTiles} collections={collections} titles={titles} />;
  if (style === "style-2") return <StyleTwoHome categoryTiles={categoryTiles} collections={collections} titles={titles} />;
  if (style === "style-4") return <StyleFourHome categoryTiles={categoryTiles} collections={collections} titles={titles} />;
  if (style === "style-5") return <StyleFiveHome categoryTiles={categoryTiles} collections={collections} titles={titles} />;
  if (style === "style-8") return <StyleEightHome categoryTiles={categoryTiles} collections={collections} titles={titles} />;
  if (style === "style-9") return <StyleNineHome categoryTiles={categoryTiles} collections={collections} titles={titles} />;
  if (style === "style-10") return <StyleTenHome categoryTiles={categoryTiles} collections={collections} titles={titles} />;
  if (style === "style-11") return <StyleElevenHome categoryTiles={categoryTiles} collections={collections} titles={titles} />;
  return <StyleThreeHome categoryTiles={categoryTiles} collections={collections} titles={titles} />;
}

export function BlogPrototypeCategory({ category, style, titles }: { category: PrototypeCategory; style: PrototypeStyle; titles: Title[] }) {
  if (style === "style-1") return <StyleOneCategory category={category} titles={titles} />;
  if (style === "style-2") return <StyleTwoCategory category={category} titles={titles} />;
  if (style === "style-4") return <StyleFourCategory category={category} titles={titles} />;
  if (style === "style-5") return <StyleFiveCategory category={category} titles={titles} />;
  if (style === "style-8") return <StyleEightCategory category={category} titles={titles} />;
  if (style === "style-9") return <StyleNineCategory category={category} titles={titles} />;
  if (style === "style-10") return <StyleTenCategory category={category} titles={titles} />;
  if (style === "style-11") return <StyleElevenCategory category={category} titles={titles} />;
  return <StyleThreeCategory category={category} titles={titles} />;
}

export function BlogPrototypeArticle({ related, style, title }: { related: Title[]; style: PrototypeStyle; title: Title }) {
  if (style === "style-1") return <StyleOneArticle related={related} title={title} />;
  if (style === "style-2") return <StyleTwoArticle related={related} title={title} />;
  if (style === "style-4") return <StyleFourArticle related={related} title={title} />;
  if (style === "style-5") return <StyleFiveArticle related={related} title={title} />;
  if (style === "style-8") return <StyleEightArticle related={related} title={title} />;
  if (style === "style-9") return <StyleNineArticle related={related} title={title} />;
  if (style === "style-10") return <StyleTenArticle related={related} title={title} />;
  if (style === "style-11") return <StyleElevenArticle related={related} title={title} />;
  return <StyleThreeArticle related={related} title={title} />;
}
