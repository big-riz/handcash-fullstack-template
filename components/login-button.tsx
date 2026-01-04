"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import Image from "next/image"

export function LoginButton() {
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()

  const handleLogin = async () => {
    setIsLoading(true)
    try {
      await login()
    } catch (error) {
      console.error("[v0] Login error:", error)
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleLogin}
      className="h-14 px-8 text-lg font-bold rounded-full min-w-[280px]"
      disabled={isLoading}
    >
      <Image src="/handcash-logo.png" alt="HandCash" width={24} height={24} className="mr-3" />
      {isLoading ? "Connecting..." : "Connect with Handcash"}
    </Button>
  )
}
