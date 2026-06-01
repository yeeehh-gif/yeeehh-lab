"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Input } from "@/components/ui/input"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [alreadyLoggedIn, setAlreadyLoggedIn] = useState(false)
  const submittingRef = useRef(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session) setAlreadyLoggedIn(true)
    })
  }, [])

  const handleLogin = useCallback(async () => {
    // useRef 是同步的，防双重触发（移动端 pointerdown + click 都会触发）
    if (submittingRef.current) return
    submittingRef.current = true

    if (!email || !password) {
      setError("Please enter email and password")
      submittingRef.current = false
      return
    }

    setLoading(true)
    setError("")

    try {
      const supabase = createClient()
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (loginError) {
        setError(loginError.message)
        setLoading(false)
        submittingRef.current = false
        return
      }

      if (data?.session) {
        // 移动端 cookie 写入有延迟，等 300ms 确保 cookie 已持久化再跳转
        // 否则 middleware 读到空 cookie 又会踢回 /login
        await new Promise((r) => setTimeout(r, 300))
        window.location.replace("/dashboard")
      } else {
        setError("Login succeeded but no session returned. Please try again.")
        setLoading(false)
        submittingRef.current = false
      }
    } catch (err: any) {
      setError(err.message || "Network error. Please try again.")
      setLoading(false)
      submittingRef.current = false
    }
  }, [email, password])

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white border border-rule rounded-2xl p-8 shadow-card-md">
        <h1 className="font-display italic text-2xl font-bold text-ink mb-1">
          yeeehh&apos;s lab
        </h1>
        <p className="text-faint text-sm mb-8">Sign in to continue</p>

        {alreadyLoggedIn && (
          <a
            href="/dashboard"
            className="block w-full bg-accent-brand text-white font-bold text-sm py-3.5 rounded-lg text-center no-underline mb-5"
          >
            Already signed in — Go to dashboard →
          </a>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleLogin()
          }}
          className="space-y-5"
        >
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-ink">
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-ink">
              Password
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-md px-4 py-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              WebkitTapHighlightColor: "transparent",
              touchAction: "manipulation",
              userSelect: "none",
            }}
            className="w-full bg-charcoal text-white font-bold text-sm py-3.5 rounded-lg hover:bg-charcoal/90 transition-colors disabled:opacity-50 select-none"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="text-faint text-xs mt-6 text-center">
          Self-hosted · Personal use only
        </p>
      </div>
    </div>
  )
}
