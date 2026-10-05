import Image from "next/image";
import Link from "next/link";
import type { FinalArticleCard } from "@/lib/payload-articles";
import { formatLotDate, lotArticleHref } from "@/lib/studio/data";
import pages from "@/components/studio/pages.module.css";

export function StoryList({ articles }: { articles: FinalArticleCard[] }) {
  return (
    <ol className={pages.storyList}>
      {articles.map((article) => (
        <li key={article.slug}>
          <Link data-cursor="Read story" href={lotArticleHref(article.slug)}>
            <span className={pages.storyThumb}>{article.imageUrl ? <Image alt="" className={pages.cover} fill sizes="200px" src={article.imageUrl} /> : null}</span>
            <span className={pages.storyCopy}>
              <strong>{article.title}</strong>
              <span>{article.excerpt}</span>
            </span>
            <span className={pages.storyMeta}>
              <span>{formatLotDate(article.publishedDate)}</span>
              <span>{article.categoryNames[0] ?? article.programTitle}</span>
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
