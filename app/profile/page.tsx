import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ChangePasswordForm, ProfileDetailsForm } from "@/components/profile/ProfileForms";

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
       *  as dead space. No max-width of its own: it fills the page's own
       *  container (see the max-w-5xl <main> in layout.tsx) the same way
       *  every other page here does, rather than capping short of it and
       *  leaving a second, narrower band of whitespace on the right. Grid
       *  items stretch to the row's height by default, so each `section` is
       *  already as tall as its sibling; `flex flex-col` plus the card's own
       *  `flex-1` (see ProfileForms.tsx) carries that height down into the
       *  visible card, so the two line up evenly like a Bootstrap `col-6`
       *  pair rather than each card stopping at its own content. */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
        <section className="flex flex-col space-y-3">
          <h2 className="section-title">Profile</h2>
          <ProfileDetailsForm initial={{ email: user.email, name: user.name }} />
        </section>

        <section className="flex flex-col space-y-3">
          <h2 className="section-title">Password</h2>
          <ChangePasswordForm />
        </section>
      </div>
    </div>
  );
}
