"use client";

import Image from "next/image";
import Script from "next/script";
import { useEffect, useMemo, useRef } from "react";
import type { Media } from "../../../payload-types";

type Provider = "youtube" | "vimeo" | "instagram" | "tiktok" | "facebook" | "x" | "generic";

declare global {
  interface Window {
    FB?: { XFBML?: { parse: (rootNode?: HTMLElement) => void } };
    instgrm?: { Embeds?: { process: () => void } };
    twttr?: {
      widgets?: {
        createTweet?: (
          tweetId: string,
          target: HTMLElement,
          options?: { align?: "left" | "center" | "right"; dnt?: boolean; theme?: "light" | "dark"; width?: number },
        ) => Promise<HTMLElement>;
        load: (element?: HTMLElement) => void;
      };
    };
  }
}

const providerLabels: Record<Provider, string> = {
  facebook: "Facebook",
  generic: "External",
  instagram: "Instagram",
  tiktok: "TikTok",
  vimeo: "Vimeo",
  x: "X",
  youtube: "YouTube",
};

export function FinalArticleEmbed({ fields }: { fields: Record<string, unknown> }) {
  const type = cleanText(fields.type);
  const url = safeExternalUrl(fields.url);
  const provider = detectProvider(url, cleanText(fields.platform));
  const title = cleanText(fields.title) || providerLabels[provider];
  const caption = cleanText(fields.caption);
  const media = getMedia(fields.image);

  if (type === "image" && media?.url) {
    const image = (
      <Image
        alt={media.alt || caption || title}
        height={media.height || 760}
        sizes="(max-width: 900px) 100vw, 736px"
        src={media.url}
        width={media.width || 1200}
      />
    );
    return (
      <figure className="final-article-embed">
        {url ? <a aria-label={title} href={url} rel="noopener noreferrer" target="_blank">{image}</a> : image}
        {caption ? <figcaption>{caption}</figcaption> : null}
      </figure>
    );
  }

  const iframeUrl = getIframeUrl(url, provider);
  if (iframeUrl) {
    return (
      <figure className="final-article-embed" data-portrait={provider === "tiktok"}>
        <iframe
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          src={iframeUrl}
          title={title}
        />
        {caption ? <figcaption>{caption}</figcaption> : null}
      </figure>
    );
  }

  if (url && provider === "instagram") return <SocialEmbed caption={caption}><InstagramEmbed title={title} url={url} /></SocialEmbed>;
  if (url && provider === "facebook") return <SocialEmbed caption={caption}><FacebookEmbed url={url} /></SocialEmbed>;
  if (url && provider === "x") return <SocialEmbed caption={caption}><XEmbed title={title} url={url} /></SocialEmbed>;
  if (!url) return null;

  return <EmbedFallback caption={caption} platform={providerLabels[provider]} title={title} url={url} />;
}

function SocialEmbed({ caption, children }: { caption: string; children: React.ReactNode }) {
  return <figure className="final-article-embed final-article-social">{children}{caption ? <figcaption>{caption}</figcaption> : null}</figure>;
}

function InstagramEmbed({ title, url }: { title: string; url: string }) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    mount.innerHTML = "";
    const blockquote = document.createElement("blockquote");
    blockquote.className = "instagram-media";
    blockquote.setAttribute("data-instgrm-captioned", "true");
    blockquote.setAttribute("data-instgrm-permalink", url);
    blockquote.setAttribute("data-instgrm-version", "14");
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.rel = "noopener noreferrer";
    anchor.target = "_blank";
    anchor.textContent = title;
    blockquote.appendChild(anchor);
    mount.appendChild(blockquote);
    const timers = [150, 1000, 2500].map((delay) => window.setTimeout(() => window.instgrm?.Embeds?.process(), delay));
    return () => { timers.forEach(window.clearTimeout); mount.innerHTML = ""; };
  }, [title, url]);

  return <><Script id="instagram-embed" src="https://www.instagram.com/embed.js" strategy="lazyOnload" /><div className="final-article-social__widget is-instagram" ref={mountRef} /></>;
}

function FacebookEmbed({ url }: { url: string }) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    mount.innerHTML = "";
    const post = document.createElement("div");
    post.className = "fb-post";
    post.setAttribute("data-href", url);
    post.setAttribute("data-show-text", "true");
    post.setAttribute("data-width", "650");
    mount.appendChild(post);
    const timers = [150, 1000, 2500].map((delay) => window.setTimeout(() => window.FB?.XFBML?.parse(mount), delay));
    return () => { timers.forEach(window.clearTimeout); mount.innerHTML = ""; };
  }, [url]);

  return <><div id="fb-root" /><Script id="facebook-jssdk" src="https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v19.0" strategy="lazyOnload" /><div className="final-article-social__widget is-facebook" ref={mountRef} /></>;
}

function XEmbed({ title, url }: { title: string; url: string }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const tweetId = useMemo(() => extractStatusId(url), [url]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || !tweetId) return;
    mount.innerHTML = "";
    const renderTweet = () => {
      if (window.twttr?.widgets?.createTweet) {
        void window.twttr.widgets.createTweet(tweetId, mount, { align: "center", dnt: true, theme: "dark", width: Math.min(550, mount.clientWidth || 550) });
      } else {
        window.twttr?.widgets?.load(mount);
      }
    };
    const timers = [150, 1000, 2500].map((delay) => window.setTimeout(renderTweet, delay));
    return () => { timers.forEach(window.clearTimeout); mount.innerHTML = ""; };
  }, [tweetId]);

  if (!tweetId) return <EmbedCard platform="X" title={title} url={url} />;
  return <><Script id="twitter-wjs" src="https://platform.twitter.com/widgets.js" strategy="lazyOnload" /><div className="final-article-social__widget is-x" ref={mountRef} /></>;
}

function EmbedFallback({ caption, platform, title, url }: { caption: string; platform: string; title: string; url: string }) {
  return (
    <figure className="final-article-embed">
      <EmbedCard platform={platform} title={title} url={url} />
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  );
}

function EmbedCard({ platform, title, url }: { platform: string; title: string; url: string }) {
  return (
    <a className="final-article-external" href={url} rel="noopener noreferrer" target="_blank">
      <span>{platform}</span><strong>{title}</strong><small>{url}</small><b aria-hidden="true">↗</b>
    </a>
  );
}

function detectProvider(rawUrl: string, selected: string): Provider {
  if (["youtube", "vimeo", "instagram", "tiktok", "facebook", "x"].includes(selected)) return selected as Provider;
  const parsed = parseUrl(rawUrl);
  if (!parsed) return "generic";
  const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
  if (host.endsWith("youtube.com") || host === "youtu.be") return "youtube";
  if (host.endsWith("vimeo.com")) return "vimeo";
  if (host.endsWith("instagram.com")) return "instagram";
  if (host.endsWith("tiktok.com")) return "tiktok";
  if (host.endsWith("facebook.com") || host.endsWith("fb.com") || host.endsWith("fb.watch")) return "facebook";
  if (host === "x.com" || host.endsWith("twitter.com")) return "x";
  return "generic";
}

function getIframeUrl(rawUrl: string, provider: Provider): string {
  const parsed = parseUrl(rawUrl);
  if (!parsed) return "";
  const parts = parsed.pathname.split("/").filter(Boolean);
  if (provider === "youtube") {
    const id = parsed.searchParams.get("v") || (parsed.hostname.includes("youtu.be") ? parts[0] : ["shorts", "embed"].includes(parts[0]) ? parts[1] : "");
    return id ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?rel=0` : "";
  }
  if (provider === "vimeo") return parts[0] ? `https://player.vimeo.com/video/${encodeURIComponent(parts[0])}` : "";
  if (provider === "tiktok") {
    const videoIndex = parts.indexOf("video");
    const id = videoIndex >= 0 ? parts[videoIndex + 1] : "";
    return id ? `https://www.tiktok.com/embed/v2/${encodeURIComponent(id)}` : "";
  }
  return "";
}

function extractStatusId(rawUrl: string): string {
  const parsed = parseUrl(rawUrl);
  const parts = parsed?.pathname.split("/").filter(Boolean) || [];
  const statusIndex = parts.indexOf("status");
  return statusIndex >= 0 ? parts[statusIndex + 1] || "" : "";
}

function parseUrl(rawUrl: string): URL | null {
  try { return rawUrl ? new URL(rawUrl) : null; } catch { return null; }
}

function safeExternalUrl(value: unknown): string {
  const text = cleanText(value);
  if (!text) return "";
  try {
    const url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : "";
  } catch { return ""; }
}

function getMedia(value: unknown): Media | undefined {
  if (!value || typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  if (typeof record.url === "string") return value as Media;
  if (record.value && typeof record.value === "object" && typeof (record.value as Record<string, unknown>).url === "string") return record.value as Media;
  return undefined;
}

function cleanText(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (value && typeof value === "object") {
    const localized = value as Record<string, unknown>;
    return cleanText(localized.th) || cleanText(localized.en);
  }
  return "";
}
