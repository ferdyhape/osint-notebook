import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ChangePasswordForm, ProfileDetailsForm } from "@/components/ProfileForms";

export const dynamic = "force-dynamic";

/** Behind a login, so there is nothing here for a crawler to index — and a case
 *  title is the investigation's subject, which should never reach a search
 *  result. `follow: false` too, so the private URLs it links to aren't queued. */
export const metadata: Metadata = {
  title: "Profile",
  robots: { index: false, follow: false },
};


export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="space-y-8">
      <h1 className="page-title">Account</h1>

      {/* Side-by-side once there's room for it — stacked on top of each other
       *  in a narrow max-w-lg column left the right half of a desktop screen
       *  as dead space. */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-3xl">
        <section className="space-y-3">
          <h2 className="section-title">Profile</h2>
          <ProfileDetailsForm initial={{ email: user.email, name: user.name }} />
        </section>

        <section className="space-y-3">
          <h2 className="section-title">Password</h2>
          <ChangePasswordForm />
        </section>
      </div>
    </div>
  );
}
