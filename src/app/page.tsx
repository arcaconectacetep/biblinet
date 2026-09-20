import { redirect } from "next/navigation";

import { getSessionUser, homePathForRole } from "@/lib/auth/current-user";

/** Entry point: sends each visitor to the area that matches their role. */
export default async function RootPage() {
  const user = await getSessionUser();

  if (!user) redirect("/login");
  if (user.mustChangePassword) redirect("/change-password");

  redirect(homePathForRole(user.role));
}
