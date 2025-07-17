import { redirect } from "next/navigation";

export default function Home() {
  redirect("/dashboard");
  // This page immediately redirects to the dashboard.
}
