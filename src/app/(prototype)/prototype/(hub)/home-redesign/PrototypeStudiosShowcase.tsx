import Link from "next/link";
import { StudiosShowcase } from "@/components/StudiosShowcase";
import styles from "./PrototypeStudiosShowcase.module.css";

export async function PrototypeStudiosShowcase() {
  return (
    <section className={styles.studios} aria-labelledby="prototype-studios-heading" id="studios">
      <header className={styles.intro}>
        <p className={styles.identity}>Thai PBS Studios</p>
        <div className={styles.titleBlock}>
          <h2 id="prototype-studios-heading">STUDIOS</h2>
          <p>Original voices.<br />Global stories.</p>
        </div>
        <div className={styles.introFoot}>
          <p>เรื่องเล่าจากประเทศไทย<br />สร้างสรรค์เพื่อผู้ชมทั่วโลก</p>
          <Link href="/studios">เข้าสู่ Thai PBS Studios <span aria-hidden="true">↗</span></Link>
        </div>
      </header>
      <div className={styles.showcaseFrame}>
        <StudiosShowcase showCurtain={false} />
      </div>
    </section>
  );
}
