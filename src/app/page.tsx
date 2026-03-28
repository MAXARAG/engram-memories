import { redirect } from "next/navigation";

// Root "/" redirects to the main app entry point.
// Auth guard in (app)/layout.tsx handles unauthenticated access → /login.
export default function RootPage() {
  redirect("/animales");
}
