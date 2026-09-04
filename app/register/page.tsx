import { Suspense } from "react";
import Image from "next/image";
import { RegisterForm } from "@/components/RegisterForm";

export const dynamic = "force-dynamic";

export default function RegisterPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="mb-6">
          <Image src="/logo-mark.png" alt="" width={40} height={40} priority className="mb-3" />
          <h1 className="page-title">Create an account</h1>
          <p className="text-sm text-muted mt-1.5">Start your own OSINT case notebook.</p>
        </div>
        <div className="card p-4">
          <Suspense fallback={null}>
            <RegisterForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
