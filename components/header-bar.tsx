"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Rocket, LogOut, Shield, Menu, ShoppingBag, Package, ShieldCheck } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { FaqModal } from "@/components/faq-modal"
import { LoginButton } from "@/components/login-button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface BusinessProfile {
  publicProfile?: {
    avatarUrl?: string
  }
}

interface HeaderBarProps {
  activeTab?: string
  onTabChange?: (value: string) => void
}

export function HeaderBar({ activeTab, onTabChange }: HeaderBarProps) {
  const router = useRouter()
  const { user, isAuthenticated, logout } = useAuth()
  const [businessAvatar, setBusinessAvatar] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    const fetchBusinessProfile = async () => {
      try {
        const response = await fetch("/api/business/profile")
        if (response.ok) {
          const data: BusinessProfile = await response.json()
          if (data.publicProfile?.avatarUrl) {
            setBusinessAvatar(data.publicProfile.avatarUrl)
          }
        }
      } catch (err) {
        // Silently fail - will use default logo
      }
    }

    const checkAdminStatus = async () => {
      try {
        const response = await fetch("/api/admin/status", {
          credentials: "include",
        })
        if (response.ok) {
          const data = await response.json()
          setIsAdmin(data.isAdmin === true)
        }
      } catch (err) {
        setIsAdmin(false)
      }
    }

    fetchBusinessProfile()
    if (isAuthenticated) {
      checkAdminStatus()
    }
  }, [isAuthenticated])

  const handleLogout = async () => {
    await logout()
  }

  // Navigation Items
  const navItems = [
    { label: "Mint", href: "/" }, // Using / which scrolls to #mint if AuthenticatedContent is loaded, or simple top. 
    // Actually if we use anchors, we need to be careful if sections don't exist in logged out state.
    // But user requested specific generic nav.
    // If logged out: "Mint" -> Login CTA (Landing).
    // If logged in: "Mint" -> #mint.
    // Let's keep it simple: Link to anchors if logged in, otherwise just links or hidden.
    // "My Items" only makes sense if logged in.
    // "Devlog" / "FAQ" make sense always.
  ]

  const NavContent = () => (
    <>
      {isAuthenticated && activeTab && onTabChange ? (
        <Tabs value={activeTab} onValueChange={onTabChange} className="hidden md:flex">
          <TabsList className="h-12 p-1 bg-muted/50 backdrop-blur-md border border-border/50 rounded-xl shadow-sm">
            <TabsTrigger
              value="mint"
              className="rounded-lg px-6 h-full data-[state=active]:bg-background data-[state=active]:shadow-sm text-sm font-bold transition-all gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              Mint
            </TabsTrigger>
            <TabsTrigger
              value="inventory"
              className="rounded-lg px-6 h-full data-[state=active]:bg-background data-[state=active]:shadow-sm text-sm font-bold transition-all gap-2"
            >
              <Package className="w-4 h-4" />
              Collection
            </TabsTrigger>
            <TabsTrigger
              value="trust"
              className="rounded-lg px-6 h-full data-[state=active]:bg-background data-[state=active]:shadow-sm text-sm font-bold transition-all gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              Trust
            </TabsTrigger>
          </TabsList>
        </Tabs>
      ) : (
        <>
          <Button variant="ghost" asChild className="hidden md:flex">
            <Link href="/#devlog">Devlog</Link>
          </Button>
          <div className="hidden md:flex">
            <FaqModal />
          </div>
        </>
      )}
    </>
  )

  const MobileNav = () => {
    const [open, setOpen] = useState(false)
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="w-5 h-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-4 mt-8">
            {isAuthenticated && activeTab && onTabChange ? (
              <>
                <button
                  onClick={() => {
                    onTabChange("mint")
                    setOpen(false)
                  }}
                  className={`text-lg font-medium text-left ${activeTab === "mint" ? "text-primary" : ""}`}
                >
                  Mint
                </button>
                <button
                  onClick={() => {
                    onTabChange("inventory")
                    setOpen(false)
                  }}
                  className={`text-lg font-medium text-left ${activeTab === "inventory" ? "text-primary" : ""}`}
                >
                  Collection
                </button>
                <button
                  onClick={() => {
                    onTabChange("trust")
                    setOpen(false)
                  }}
                  className={`text-lg font-medium text-left ${activeTab === "trust" ? "text-primary" : ""}`}
                >
                  Trust
                </button>
              </>
            ) : (
              <>
                {isAuthenticated && (
                  <>
                    <Link href="/#mint" className="text-lg font-medium" onClick={() => setOpen(false)}>Mint</Link>
                    <Link href="/#inventory" className="text-lg font-medium" onClick={() => setOpen(false)}>My Items</Link>
                  </>
                )}
              </>
            )}
            <Link href="/#devlog" className="text-lg font-medium" onClick={() => setOpen(false)}>Devlog</Link>
            <div className="flex justify-start">
              <FaqModal />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    )
  }


  return (
    <div className="border-b border-border/50 bg-background/60 backdrop-blur-xl sticky top-0 z-50">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-4 hover:opacity-80 transition-all hover:translate-y-[-1px]">
            <div className="p-1.5 bg-primary/10 rounded-full shadow-sm group overflow-hidden relative">
              <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity animate-pulse" />
              <img src="/gopnik-logo.jpg" alt="Logo" className="w-10 h-10 rounded-full object-cover relative z-10" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-2xl uppercase italic tracking-tighter leading-none">Gopnik</span>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary opacity-80 leading-none mt-1">Minting App</span>
            </div>
          </Link>

          {/* Center Nav (Desktop) */}
          <div className="flex items-center gap-2">
            <NavContent />
          </div>

          <div className="flex items-center gap-4">
            {/* User Info or Login */}
            {isAuthenticated && user ? (
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
                      <span className="text-xs leading-none text-muted-foreground mt-1">${user.publicProfile.handle}</span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-2xl">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-bold leading-none">{user.publicProfile.displayName}</p>
                      <p className="text-xs leading-none text-muted-foreground">${user.publicProfile.handle}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {isMounted && isAdmin && (
                    <DropdownMenuItem
                      onClick={() => router.push("/admin")}
                      className="cursor-pointer font-medium"
                    >
                      <Shield className="mr-2 h-4 w-4" />
                      <span>Admin</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-destructive focus:text-destructive cursor-pointer font-medium"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden sm:block">
                <LoginButton />
              </div>
            )}

            {/* Mobile Menu */}
            <MobileNav />
          </div>
        </div>
      </div>
    </div>
  )
}
