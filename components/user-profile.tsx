"use client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Loader2, User } from "lucide-react"
import { LogoutButton } from "@/components/logout-button"
import { LoginButton } from "@/components/login-button"
import { useAuth } from "@/lib/auth-context"

interface UserProfile {
  publicProfile: {
    handle: string
    displayName: string
    avatarUrl: string
    paymail: string
  }
}

export function UserProfile() {
  const { user, isLoading, error } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8 text-destructive">
        <p className="text-lg font-semibold">{error}</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex p-5 bg-muted rounded-full mb-6">
          <User className="w-14 h-14 text-muted-foreground" />
        </div>
        <h2 className="text-3xl font-bold mb-3">Welcome</h2>
        <p className="text-muted-foreground text-lg mb-8 max-w-sm mx-auto">
          Connect your Handcash wallet to view your profile
        </p>
        <LoginButton />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-6">
        <Avatar className="w-20 h-20">
          <AvatarImage src={user.publicProfile.avatarUrl || "/placeholder.svg"} alt={user.publicProfile.displayName} />
          <AvatarFallback className="text-2xl font-bold">
            {user.publicProfile.displayName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-2xl font-bold truncate">{user.publicProfile.displayName}</h3>
            <Badge variant="secondary" className="shrink-0 rounded-full px-3 py-1">
              Connected
            </Badge>
          </div>
          <p className="text-muted-foreground text-lg mb-1">@{user.publicProfile.handle}</p>
          <p className="text-sm font-mono text-muted-foreground break-all">{user.publicProfile.paymail}</p>
        </div>
      </div>
      <LogoutButton />
    </div>
  )
}
