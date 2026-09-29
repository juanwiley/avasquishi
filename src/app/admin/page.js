// /admin — owner dashboard. Not linked from the site; hidden from search.
import AdminClient from "./AdminClient";

export const metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminClient />;
}
