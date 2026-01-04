"use client"

import { UserProfile } from "@/components/user-profile"
import { TemplateInfo } from "@/components/template-info"
import { LandingContent } from "@/components/landing-content"
import { AuthenticatedContent } from "@/components/authenticated-content"
import { useAuth } from "@/lib/auth-context"
import { HeaderBar } from "@/components/header-bar"

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth()

  return (
    <div className="bg-background min-h-screen">
      {/* 
        ═══════════════════════════════════════════════════════════════
        ⚠️  DO NOT MODIFY - HandCash Header with User Menu
        This HeaderBar component contains the HandCash login button 
        and user menu. Keep this intact for authentication to work.
        ═══════════════════════════════════════════════════════════════
      */}
      <HeaderBar />

      <div className="container mx-auto px-6 py-12 max-w-2xl">
        {/* 
          ═══════════════════════════════════════════════════════════
          CUSTOMIZABLE LANDING CONTENT
          Edit components/landing-content.tsx to change hero section
          ═══════════════════════════════════════════════════════════
        */}
        <LandingContent />

        {/* Main Content */}
        <div className="space-y-6">
          {/* 
            ═══════════════════════════════════════════════════════════
            ⚠️  DO NOT MODIFY - HandCash Login Card
            This UserProfile component shows the login button when
            user is logged out. Keep this intact.
            ═══════════════════════════════════════════════════════════
          */}
          <div className="bg-card rounded-3xl p-8 border border-border">
            <UserProfile />
          </div>

          {!isLoading && (
            <>
              {!isAuthenticated ? (
                // Shows setup instructions and template info when logged out
                <TemplateInfo />
              ) : (
                // Shows your custom app content when logged in
                // Edit components/authenticated-content.tsx to customize
                <AuthenticatedContent />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
