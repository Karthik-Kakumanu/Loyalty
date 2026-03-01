import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Revistra | User Loyalty App",
  description:
    "User-first loyalty app for billing, payments, reservations, and digital membership access.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Revistra",
    description: "Billing, payments, reservations, and member identity in one app.",
    images: [{ url: "/logo.jpg", alt: "Revistra brand logo" }],
  },
};

export default async function HomePage() {
  // Gracefully fall back to intro view if session read fails.
  let session: Awaited<ReturnType<typeof getSession>> | null = null;

  try {
    session = await getSession();
  } catch (error) {
    console.error("Failed to read session on landing page", error);
  }

  if (session?.userId) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen overflow-x-clip bg-white">
      <section className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-5 pb-10 pt-8 sm:max-w-lg sm:px-8">
        <header className="rounded-[2rem] border border-[#EDE8E3] bg-white p-4 shadow-[0_30px_80px_-52px_rgba(15,23,42,0.35)] sm:p-5">
          <div className="overflow-hidden rounded-[1.5rem] border border-[#F3EFEC] bg-white px-4 py-6 sm:px-6 sm:py-8">
            <Image
              src="/logo.jpg"
              alt="Revistra"
              width={4320}
              height={1728}
              priority
              sizes="(max-width: 640px) 92vw, 560px"
              className="h-auto w-full object-contain"
            />
          </div>
        </header>

        <div className="mt-10 pb-safe">
          <Link
            href="/auth"
            className="flex h-14 w-full items-center justify-center rounded-full bg-[#C72C48] px-5 text-base font-bold text-white shadow-[0_24px_44px_-24px_rgba(199,44,72,0.9)] transition duration-200 hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C72C48] focus-visible:ring-offset-2"
          >
            Continue with OTP
          </Link>
        </div>
      </section>
    </main>
  );
}
