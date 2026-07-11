"use client"

import { useRouter } from "next/navigation"

export default function LogoutButton() {
  const router = useRouter()
  return (
    <button
      onClick={async () => {
        await fetch("/api/admin/logout", { method: "POST" })
        router.push("/admin/login")
        router.refresh()
      }}
      style={{ fontSize: 13, color: "#737373", textDecoration: "underline", background: "none", border: "none", cursor: "pointer" }}
    >
      sair
    </button>
  )
}
