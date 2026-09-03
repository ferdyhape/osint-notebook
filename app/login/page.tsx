import { Suspense } from "react";
import Image from "next/image";
import { LoginForm } from "@/components/LoginForm";

export const dynamic = "force-dynamic";

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
