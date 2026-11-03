import KimjangGame from "@/components/KimjangGame";

export default function Home() {
  return (
    <main className="mx-auto flex max-w-[460px] flex-col gap-[18px] px-4 pt-7 pb-10">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="m-0 font-sign text-[34px] leading-[1.05] font-normal text-balance">
          온라인
          <br />
          <span className="text-basin">김장</span>하기
        </h1>
        {/* looks like the label on a box of 절임배추 */}
        <div className="rotate-2 rounded border-2 border-leaf bg-paper px-2.5 py-1.5 text-center font-ui text-sm leading-tight text-leaf shadow-[2px_3px_0_rgba(31,51,38,0.15)]">
          절임배추
          <b className="block font-sign text-xl font-normal text-ink">20kg</b>
        </div>
      </header>

      <KimjangGame />

      {/* same series, send people to the other game */}
      <footer className="mt-4 border-t border-line pt-4 text-center text-sm text-ink-dim">
        노점 간식이 더 땡긴다면{" "}
        <a
          href="https://bungeoppang-seven.vercel.app"
          className="font-ui text-ink underline decoration-basin decoration-2 underline-offset-4"
        >
          🐟 온라인 붕어빵 굽기
        </a>
      </footer>
    </main>
  );
}
