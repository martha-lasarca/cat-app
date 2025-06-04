import { redirect } from "next/navigation"

export default function Home() {
  // Redirect to login page
  redirect("/login")

  // This won't be rendered due to the redirect
  return null

  // /** rest of code here **/
}
