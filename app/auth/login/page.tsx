import { redirect } from "next/navigation"

export default function AuthRedirectPage() {
  // Redirect to family login page
  redirect("/family/login")
}
