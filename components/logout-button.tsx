"use client"

import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

export function LogoutButton() {
  const { logout, isLoading } = useAuth()

  return (
    <Button
      variant="outline"
      onClick={logout}
      disabled={isLoading}
      className="w-full bg-transparent rounded-full h-12 font-semibold"
    >
      <LogOut className="w-4 h-4 mr-2" />
      {isLoading ? "Logging out..." : "Logout"}
    </Button>
  )
}
