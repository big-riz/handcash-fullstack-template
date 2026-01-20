"use client"

import { UserProfile } from "@/components/user-profile"
import { TemplateInfo } from "@/components/template-info"
import { LandingContent } from "@/components/landing-content"
import { AuthenticatedContent } from "@/components/authenticated-content"
import { useAuth } from "@/lib/auth-context"
import { HeaderBar } from "@/components/header-bar"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { useEffect, useState } from "react"

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth()
  const [configStatus, setConfigStatus] = useState<{ hasAppId: boolean; hasAppSecret: boolean; isConfigured: boolean } | null>(null)
  const [activeTab, setActiveTab] = useState("mint")

  useEffect(() => {
    const checkConfig = async () => {
      try {
        const response = await fetch("/api/config-check", {
          credentials: "include",
        })
        if (response.ok) {
          const data = await response.json()
          setConfigStatus(data)
        }
      } catch (err) {
        console.error("Failed to check config:", err)
      }
    }
    checkConfig()
  }, [])

  return (
    <div className="bg-background min-h-screen">
      {/* 
        ═══════════════════════════════════════════════════════════════
        ⚠️  DO NOT MODIFY - HandCash Header with User Menu
        This HeaderBar component contains the HandCash login button 
        and user menu. Keep this intact for authentication to work.
        ═══════════════════════════════════════════════════════════════
      */}
      <HeaderBar activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="flex-grow">
        {/* 
          ═══════════════════════════════════════════════════════════
          CUSTOMIZABLE LANDING CONTENT
          Edit components/landing-content.tsx to change hero section
          ═══════════════════════════════════════════════════════════
        */}
        {!isLoading && !isAuthenticated && <LandingContent />}

        {/* Main Content for Authenticated Users */}
        {isAuthenticated && (
          <div className="space-y-6">
            {configStatus && !configStatus.isConfigured && (
              <div className="container mx-auto px-6 pt-8">
                <Alert variant="destructive" className="rounded-3xl border-border max-w-2xl mx-auto">
                  <AlertCircle className="h-5 w-5" />
                  <AlertTitle className="font-bold">Configuration Required</AlertTitle>
                  <AlertDescription>
                    {!configStatus.hasAppId && !configStatus.hasAppSecret && (
                      <>You need to add <code className="px-2 py-1 bg-background rounded font-mono text-sm">HANDCASH_APP_ID</code> and <code className="px-2 py-1 bg-background rounded font-mono text-sm">HANDCASH_APP_SECRET</code> to your environment variables.</>
                    )}
                    {!configStatus.hasAppId && configStatus.hasAppSecret && (
                      <>You need to add <code className="px-2 py-1 bg-background rounded font-mono text-sm">HANDCASH_APP_ID</code> to your environment variables.</>
                    )}
                    {configStatus.hasAppId && !configStatus.hasAppSecret && (
                      <>You need to add <code className="px-2 py-1 bg-background rounded font-mono text-sm">HANDCASH_APP_SECRET</code> to your environment variables.</>
                    )}
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* 
              ═══════════════════════════════════════════════════════════
              ⚠️  DO NOT MODIFY - HandCash Login Card
              This UserProfile component shows the login button when
              user is logged out. Keep this intact.
              ═══════════════════════════════════════════════════════════
            */}
            {!isLoading && <AuthenticatedContent activeTab={activeTab} onTabChange={setActiveTab} />}
          </div>
        )}

        {!isLoading && !isAuthenticated && (
          <div className="container mx-auto px-6 max-w-2xl pb-20">
            <TemplateInfo />
          </div>
        )}
      </div>
    </div>
  )
}
