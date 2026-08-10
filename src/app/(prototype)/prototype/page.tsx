import Link from "next/link";
import { styleDetails, type PrototypeStyle } from "@/components/prototype/blog/blog-data";

const styles: PrototypeStyle[] = ["style-1", "style-2", "style-3", "style-4", "style-5", "style-8", "style-9", "style-10", "style-11"];

export default function PrototypeComparisonPage() {
  return (
    <main className="prototype-hub">
      <header className="prototype-hub__header">
        <div><p>Thai PBS · Blog redesign study</p><h1>Nine ways to<br/>tell the story.</h1></div>
        <p>Compare nine complete, responsive directions. Each uses the same catalog data, routes and article structure.</p>
      </header>
      <section className="prototype-hub__grid" aria-label="Blog prototype styles">
        {styles.map((style, index) => {
          const details = styleDetails[style];
          return (
            <Link className={`prototype-hub__card prototype-hub__card--${index + 1}`} href={`/prototype/${style}`} key={style}>
              <div className="prototype-hub__preview"><span className="prototype-hub__mock-nav"/><span className="prototype-hub__mock-title"/><span className="prototype-hub__mock-copy"/><span className="prototype-hub__mock-art"/></div>
              <div><span>0{index + 1}</span><p>{details.label}</p><h2>{details.name}</h2><small>{details.note}</small></div>
              <span className="prototype-hub__open">Open prototype ↗</span>
            </Link>
          );
        })}
      </section>
      <footer className="prototype-hub__footer"><span>Homepage · Category · Article</span><Link href="/prototype/programs">View original prototype</Link></footer>
    </main>
  );
}
