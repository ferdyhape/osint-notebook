import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ChangePasswordForm, ProfileDetailsForm } from "@/components/ProfileForms";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="max-w-lg space-y-8">
      <h1 className="page-title">Account</h1>

      <section className="space-y-3">
        <h2 className="section-title">Profile</h2>
        <ProfileDetailsForm initial={{ email: user.email, name: user.name }} />
      </section>

      <section className="space-y-3">
        <h2 className="section-title">Password</h2>
        <ChangePasswordForm />
      </section>
    </div>
  );
}
