import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import type { Media } from "../../../payload-types";
import { finalArticleHref, titleHref } from "@/lib/content";
import { FinalArticleEmbed } from "./FinalArticleEmbed";

type RichTextNode = {
  backgroundColor?: string;
  checked?: boolean;
  children?: RichTextNode[];
  colSpan?: number;
  fields?: Record<string, unknown>;
  format?: number | string;
  headerState?: number;
  listType?: "bullet" | "check" | "number";
  relationTo?: string;
  rowSpan?: number;
  tag?: string;
  text?: string;
  type?: string;
  url?: string;
  value?: unknown;
};

type RichTextContent = {
  root?: { children?: RichTextNode[] };
};

export function FinalArticleRichText({ content }: { content: unknown }) {
  const root = content && typeof content === "object" ? (content as RichTextContent).root : undefined;
  const nodes = Array.isArray(root?.children) ? root.children : [];

  return <div className="final-article-richtext">{renderChildren(nodes)}</div>;
}

function renderChildren(children?: RichTextNode[], parentListType?: RichTextNode["listType"]): ReactNode {
  return children?.map((child, index) => renderNode(child, `${child.type || "node"}-${index}`, parentListType));
}

function renderNode(node: RichTextNode, key: string, parentListType?: RichTextNode["listType"]): ReactNode {
  if (node.text !== undefined) return renderText(node, key);

  const style = alignmentStyle(node.format);
  switch (node.type) {
    case "heading": {
      const children = renderChildren(node.children);
      if (node.tag === "h3") return <h3 key={key} style={style}>{children}</h3>;
      if (node.tag === "h4") return <h4 key={key} style={style}>{children}</h4>;
      if (node.tag === "h5") return <h5 key={key} style={style}>{children}</h5>;
      if (node.tag === "h6") return <h6 key={key} style={style}>{children}</h6>;
      return <h2 key={key} style={style}>{children}</h2>;
    }
    case "paragraph":
      return <p key={key} style={style}>{renderChildren(node.children)}</p>;
    case "quote":
      return <blockquote key={key} style={style}>{renderChildren(node.children)}</blockquote>;
    case "list":
      return node.listType === "number"
        ? <ol key={key}>{renderChildren(node.children, node.listType)}</ol>
        : <ul className={node.listType === "check" ? "is-checklist" : undefined} key={key}>{renderChildren(node.children, node.listType)}</ul>;
    case "listitem":
      return (
        <li aria-checked={parentListType === "check" ? Boolean(node.checked) : undefined} key={key}>
          {parentListType === "check" ? <span className="final-article-checkmark">{node.checked ? "✓" : ""}</span> : null}
          {renderChildren(node.children)}
        </li>
      );
    case "link":
    case "autolink":
      return renderLink(node, key);
    case "linebreak":
      return <br key={key} />;
    case "horizontalrule":
      return <hr key={key} />;
    case "table":
      return <div className="final-article-table" key={key}><table><tbody>{renderChildren(node.children)}</tbody></table></div>;
    case "tablerow":
      return <tr key={key}>{renderChildren(node.children)}</tr>;
    case "tablecell": {
      const Tag = node.headerState ? "th" : "td";
      return <Tag colSpan={node.colSpan} key={key} rowSpan={node.rowSpan} style={{ backgroundColor: node.backgroundColor }}>{renderChildren(node.children)}</Tag>;
    }
    case "upload":
      return renderUpload(node.value, key);
    case "relationship":
      return renderRelationship(node, key);
    case "block":
      return renderBlock(node, key);
    default:
      return <div key={key}>{renderChildren(node.children)}</div>;
  }
}

function renderText(node: RichTextNode, key: string): ReactNode {
  let content: ReactNode = node.text;
  if (typeof node.format === "number") {
    if (node.format & 16) content = <code>{content}</code>;
    if (node.format & 32) content = <sub>{content}</sub>;
    if (node.format & 64) content = <sup>{content}</sup>;
  }

  return <span key={key} style={textStyle(node.format)}>{content}</span>;
}

function renderLink(node: RichTextNode, key: string): ReactNode {
  const fields = node.fields || {};
  const href = fields.linkType === "internal"
    ? relationshipHref(fields.doc)
    : safeHref(typeof fields.url === "string" ? fields.url : node.url);
  const children = renderChildren(node.children);

  if (href.startsWith("/") || href.startsWith("#")) return <Link href={href} key={key}>{children}</Link>;
  return <a href={href} key={key} rel="noopener noreferrer" target="_blank">{children}</a>;
}

function renderUpload(value: unknown, key: string): ReactNode {
  const media = getMedia(value);
  if (!media?.url) return null;

  return (
    <figure className="final-article-upload" key={key}>
      <Image alt={media.alt || ""} height={media.height || 760} sizes="(max-width: 900px) 100vw, 736px" src={media.url} width={media.width || 1200} />
    </figure>
  );
}

function renderRelationship(node: RichTextNode, key: string): ReactNode {
  const href = relationshipHref(node);
  const value = node.value && typeof node.value === "object" ? node.value as Record<string, unknown> : undefined;
  const label = cleanText(value?.titleTh) || cleanText(value?.title) || cleanText(value?.name) || cleanText(value?.slug) || "Related content";
  return <p className="final-article-relationship" key={key}><Link href={href}>{label} <span>↗</span></Link></p>;
}

function renderBlock(node: RichTextNode, key: string): ReactNode {
  const fields = blockFields(node);
  if (fields.blockType === "articleImageGroup") return <ArticleImageGroup fields={fields} key={key} />;
  if (fields.blockType === "articleEmbed") return <FinalArticleEmbed fields={fields} key={key} />;
  return null;
}

function ArticleImageGroup({ fields }: { fields: Record<string, unknown> }) {
  const rows = Array.isArray(fields.images) ? fields.images : [];
  const images = rows
    .map((row) => row && typeof row === "object" ? row as Record<string, unknown> : undefined)
    .map((row) => ({ alt: cleanText(row?.alt), media: getMedia(row?.image) }))
    .filter((item): item is { alt: string; media: Media & { url: string } } => Boolean(item.media?.url));

  if (!images.length) return null;
  const layout = images.length >= 3 ? "three" : images.length === 2 ? "two" : cleanText(fields.layout) || "normal";
  const displayWidth = ["small", "medium", "large", "full"].includes(cleanText(fields.displayWidth))
    ? cleanText(fields.displayWidth)
    : "medium";
  const imageFit = cleanText(fields.imageFit) === "cover" ? "cover" : "contain";

  return (
    <figure className="final-article-image-group" data-fit={imageFit} data-layout={layout} data-width={displayWidth}>
      <div>
        {images.slice(0, 3).map(({ alt, media }) => (
          <span key={media.id}>
            <Image alt={alt || media.alt || ""} fill sizes={images.length === 1 ? "(max-width: 900px) 100vw, 736px" : "(max-width: 900px) 100vw, 38vw"} src={media.url} />
          </span>
        ))}
      </div>
      {cleanText(fields.caption) ? <figcaption>{cleanText(fields.caption)}</figcaption> : null}
    </figure>
  );
}

function blockFields(node: RichTextNode): Record<string, unknown> {
  const fields = node.fields || {};
  const data = fields.data;
  return data && typeof data === "object" ? data as Record<string, unknown> : fields;
}

function relationshipHref(value: unknown): string {
  const record = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const relationTo = cleanText(record.relationTo);
  const related = record.value && typeof record.value === "object" ? record.value as Record<string, unknown> : {};
  const slug = cleanText(related.slug);
  if (relationTo === "articles" && slug) return finalArticleHref(slug);
  if (relationTo === "programs" && slug) return titleHref(slug);
  if (relationTo === "categories" && slug) return `/category/${encodeURIComponent(slug)}`;
  return "#";
}

function getMedia(value: unknown): Media | undefined {
  if (!value || typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  if (typeof record.url === "string") return value as Media;
  if (record.value && typeof record.value === "object" && typeof (record.value as Record<string, unknown>).url === "string") return record.value as Media;
  return undefined;
}

function safeHref(value: unknown): string {
  const text = cleanText(value);
  if (!text) return "#";
  if (text.startsWith("/") || text.startsWith("#")) return text;
  return safeExternalUrl(text) || "#";
}

function safeExternalUrl(value: unknown): string {
  const text = cleanText(value);
  if (!text) return "";
  try {
    const url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
}


function alignmentStyle(format?: number | string): CSSProperties | undefined {
  if (typeof format !== "string" || !["left", "center", "right", "justify", "start", "end"].includes(format)) return undefined;
  return { textAlign: format as CSSProperties["textAlign"] };
}

function textStyle(format?: number | string): CSSProperties | undefined {
  if (typeof format !== "number") return undefined;
  return {
    fontStyle: format & 2 ? "italic" : undefined,
    fontWeight: format & 1 ? 800 : undefined,
    textDecoration: [format & 4 ? "line-through" : "", format & 8 ? "underline" : ""].filter(Boolean).join(" ") || undefined,
  };
}

function cleanText(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (value && typeof value === "object") {
    const localized = value as Record<string, unknown>;
    return cleanText(localized.th) || cleanText(localized.en);
  }
  return "";
}
