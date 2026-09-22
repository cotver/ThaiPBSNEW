import Image from "next/image";

export default function EntranceLoading() {
  return (
    <main className="fixed inset-0 grid place-items-center overflow-hidden bg-black">
      <Image alt="Thai PBS Parvilions" className="h-auto w-[min(42vw,180px)] drop-shadow-[0_18px_28px_rgba(0,0,0,0.5)]" height={1772} preload src="/LOGO/Logo.png" width={1772} />
    </main>
  );
}
