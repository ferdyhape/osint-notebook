import type { Metadata } from "next";
import { Suspense } from "react";
import Image from "next/image";
import { LoginForm } from "@/components/LoginForm";
import { ogImage, siteName } from "@/lib/site";

export const dynamic = "force-dynamic";

/** A sign-in page is thin content, so it does not compete for the product's own
 *  terms — but it is a legitimate public URL people search for by name, and it
 *  needs its own canonical so it can't be mistaken for a duplicate of the home
 *  page (which the ?next= redirects would otherwise make it look like). */
export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to OSINT Notebook to open your cases.",
  alternates: { canonical: "/login" },
  openGraph: { title: `Sign in · ${siteName}`, url: "/login", images: [ogImage] },
};


export default function LoginPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="mb-6">
          <Image src="/logo-mark.png" alt="" width={40} height={40} priority className="mb-3" />
          <h1 className="page-title">OSINT Notebook</h1>
          <p className="text-sm text-muted mt-1.5">Sign in to open your cases.</p>
        </div>
        <div className="card p-4">
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
