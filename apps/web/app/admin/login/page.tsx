"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [erro, setErro] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)
    setCarregando(true)
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setErro(data.error ?? "falha no login")
        return
      }
      router.push(params.get("from") || "/admin")
      router.refresh()
    } finally {
      setCarregando(false)
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto mt-24 flex w-full max-w-sm flex-col gap-4 rounded-lg border border-neutral-200 p-8 shadow-sm"
    >
      <h1 className="text-lg font-semibold">Painel interno — Anatomia do Gasto</h1>
      <label className="flex flex-col gap-1 text-sm">
        Usuário
        <input
          className="rounded border border-neutral-300 px-3 py-2"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          autoFocus
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Senha
        <input
          type="password"
          className="rounded border border-neutral-300 px-3 py-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
      </label>
      {erro && <p className="text-sm text-red-600">{erro}</p>}
      <button
        type="submit"
        disabled={carregando}
        className="rounded bg-neutral-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {carregando ? "Entrando…" : "Entrar"}
      </button>
    </form>
  )
}

export default function AdminLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
