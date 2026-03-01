"use client";

type RootErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function RootError({ error, reset }: RootErrorProps) {
  console.error("Application render error:", error);

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-6">
        <section className="w-full rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-[0_14px_40px_rgba(0,0,0,0.06)]">
          <h1 className="text-xl font-black text-[#3D2926]">Something Went Wrong</h1>
          <p className="mt-2 text-sm text-[#6E5955]">
            We could not load the page right now. Please retry.
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-6 rounded-full bg-[#C72C48] px-6 py-3 text-sm font-bold text-white hover:bg-[#A61F38]"
          >
            Try Again
          </button>
        </section>
      </div>
    </main>
  );
}
