"use client"

import { UserProfile } from "@/components/user-profile"
import { Shield, AlertCircle, RefreshCw } from "lucide-react"
import { Card } from "@/components/ui/card"
import { HeaderBar } from "@/components/header-bar"
import { MintInterface } from "@/components/admin/mint-interface"
import { PaymentRequestManagement } from "@/components/admin/payment-request-management"
import { BusinessInventoryDisplay } from "@/components/admin/business-inventory-display"
import { BusinessPaymentInterface } from "@/components/admin/business-payment-interface"
import { BusinessWalletInfo } from "@/components/admin/business-wallet-info"
import { ItemTemplatesDisplay } from "@/components/admin/item-templates-display"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function AdminDashboard() {
  const [hasBusinessAuthToken, setHasBusinessAuthToken] = useState<boolean | null>(null)

  useEffect(() => {
    const checkConfig = async () => {
      try {
        const response = await fetch("/api/admin/config-check", {
          credentials: "include",
        })
        if (response.ok) {
          const data = await response.json()
          setHasBusinessAuthToken(data.hasBusinessAuthToken)
        }
      } catch (err) {
        console.error("Failed to check config:", err)
      }
    }
    checkConfig()
  }, [])

  return (
    <div className="bg-background min-h-screen">
      <HeaderBar />

      <div className="container mx-auto px-6 py-12 max-w-2xl">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold">Admin Dashboard</h1>
          </div>
          <p className="text-muted-foreground text-lg">Business wallet management powered by HandCash</p>
        </div>

        <div className="space-y-6">
          {hasBusinessAuthToken === false && (
            <Alert variant="destructive" className="rounded-3xl border-border">
              <AlertCircle className="h-5 w-5" />
              <AlertTitle className="font-bold">Configuration Required</AlertTitle>
              <AlertDescription>
                To use business wallet features (minting, collections), you need to add <code className="px-2 py-1 bg-background rounded font-mono text-sm">BUSINESS_AUTH_TOKEN</code> to your environment variables.
              </AlertDescription>
            </Alert>
          )}

          <Card className="p-8 rounded-3xl border-border">
            <UserProfile showAdminBadge={true} />
          </Card>

          <BusinessWalletInfo />

          <BusinessPaymentInterface />

          <BusinessInventoryDisplay />

          <ItemTemplatesDisplay />

          <GameAccessSettings />

          <div id="mint-section">
            <MintInterface />
          </div>

          <PaymentRequestManagement />
        </div>
      </div>
    </div>
  )
}

function GameAccessSettings() {
  const [collectionId, setCollectionId] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncInfo, setSyncInfo] = useState<{ count: number; ids: string[] } | null>(null)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/admin/settings")
        if (response.ok) {
          const data = await response.json()
          setCollectionId(data.settings?.access_collection_id || "")

          // Also check for the precomputed list
          const authIds = data.settings?.authorized_collection_ids
          if (authIds) {
            try {
              const parsed = JSON.parse(authIds)
              setSyncInfo({ count: parsed.length, ids: parsed })
            } catch (e) { }
          }
        }
      } catch (err) {
        console.error("Failed to fetch settings:", err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchSettings()
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_collection_id: collectionId }),
      })
      if (response.ok) {
        toast.success("Settings saved successfully")
      } else {
        toast.error("Failed to save settings")
      }
    } catch (err) {
      toast.error("An error occurred")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSync = async () => {
    setIsSyncing(true)
    try {
      const response = await fetch("/api/admin/collections/sync", {
        method: "POST",
      })
      if (response.ok) {
        const data = await response.json()
        setSyncInfo({ count: data.count, ids: data.ids })
        toast.success(`Synced ${data.count} authorized collections!`)
      } else {
        toast.error("Failed to sync collections")
      }
    } catch (err) {
      toast.error("Sync error occurred")
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <Card className="p-8 rounded-3xl border-border">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">Game Access Controls</h2>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSync}
          disabled={isSyncing}
          className="rounded-full gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
          {syncInfo ? "Resync IDs" : "Sync Auth IDs"}
        </Button>
      </div>

      <div className="space-y-6">
        <div>
          <label className="text-sm font-medium mb-1.5 block">Legacy Single Collection ID (Optional Override)</label>
          <div className="flex gap-2">
            <Input
              value={collectionId}
              onChange={(e) => setCollectionId(e.target.value)}
              placeholder="Specific HandCash Collection ID"
              disabled={isLoading}
              className="rounded-xl border-border bg-background"
            />
            <Button
              onClick={handleSave}
              className="rounded-xl"
              disabled={isLoading || isSaving}
            >
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>

        {syncInfo && (
          <div className="p-4 bg-muted/50 rounded-2xl border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold">Precomputed Auth List</span>
              <Badge variant="secondary" className="rounded-full">
                {syncInfo.count} Collections
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-1 mb-1">
              {syncInfo.ids.join(", ")}
            </p>
            <p className="text-[10px] text-muted-foreground italic">
              Access is currently granted if a user owns an item from ANY of these IDs.
            </p>
          </div>
        )}

        <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
          <p className="text-xs text-muted-foreground">
            <strong>How it works:</strong> The "Auth IDs" list is precomputed from your business inventory and local collections database. Users owning items from these collections gain entry. Use "Sync Auth IDs" to update this list after making changes or adding new collections.
          </p>
        </div>
      </div>
    </Card>
  )
}