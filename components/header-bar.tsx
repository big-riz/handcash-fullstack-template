"use client"

import { useAuth } from "@/lib/auth-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Rocket, LogOut } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

export function HeaderBar() {
  const { user, isAuthenticated, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
  }

  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <div className="border-b bg-card/95 backdrop-blur sticky top-0 z-50">
      <div className="container mx-auto px-6 max-w-2xl">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-2xl">
              <Rocket className="w-6 h-6 text-primary" />
            </div>
          </div>

          {/* User Info */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-12 gap-3 px-3 rounded-2xl hover:bg-muted focus-visible:ring-0 focus-visible:ring-offset-0"
              >
                <Avatar className="h-9 w-9">
                  <AvatarImage
                    src={user.publicProfile.avatarUrl || "/placeholder.svg"}
                    alt={user.publicProfile.displayName}
                  />
                  <AvatarFallback className="font-bold">
                    {user.publicProfile.displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start text-left hidden sm:flex">
                  <span className="text-sm font-bold leading-none">{user.publicProfile.displayName}</span>
                  <span className="text-xs leading-none text-muted-foreground mt-1">@{user.publicProfile.handle}</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-2xl">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-bold leading-none">{user.publicProfile.displayName}</p>
                  <p className="text-xs leading-none text-muted-foreground">@{user.publicProfile.handle}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-destructive focus:text-destructive cursor-pointer font-medium"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}
