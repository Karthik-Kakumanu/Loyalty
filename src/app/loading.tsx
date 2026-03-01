export default function RootLoading() {
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-6">
        <section className="w-full rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-[0_14px_40px_rgba(0,0,0,0.06)]">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[#FCECEF] border-t-[#C72C48]" />
          <h1 className="mt-5 text-lg font-bold text-[#3D2926]">Loading Revistra</h1>
          <p className="mt-2 text-sm text-[#6E5955]">
            Preparing your premium loyalty experience.
          </p>
        </section>
      </div>
    </main>
  );
}
