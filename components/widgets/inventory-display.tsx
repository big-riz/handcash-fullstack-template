"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Package, RefreshCw, Send } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { ItemTransferDialog } from "@/components/widgets/item-transfer-dialog"

interface InventoryItem {
  id: string
  origin: string
  name: string
  description: string
  imageUrl: string
  collection?: {
    name: string
  }
  attributes?: Array<{
    name: string
    value: string
  }>
}

export function InventoryDisplay() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [isTransferOpen, setIsTransferOpen] = useState(false)

  const fetchInventory = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/inventory", {
        credentials: "include",
      })

      if (!response.ok) {
        if (response.status === 401) {
          setIsLoading(false)
          return
        }
        throw new Error("Failed to fetch inventory")
      }

      const data = await response.json()
      setItems(data.items || [])
    } catch (err: any) {
      console.error("[v0] Inventory fetch error:", err)
      setError(err.message || "Failed to load inventory")
    } finally {
      setIsLoading(false)
    }
  }

  const handleTransfer = (item: InventoryItem) => {
    setSelectedItem(item)
    setIsTransferOpen(true)
  }

  const handleTransferSuccess = () => {
    fetchInventory()
    setIsTransferOpen(false)
    setSelectedItem(null)
  }

  useEffect(() => {
    fetchInventory()
  }, [])

  return (
    <>
      <Card className="p-6 rounded-3xl border-border">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Package className="w-6 h-6 text-primary" />
            <h3 className="text-xl font-bold">My Inventory</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={fetchInventory} disabled={isLoading} className="rounded-full">
            <RefreshCw className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <Alert variant="destructive" className="rounded-2xl">
            <AlertDescription className="font-medium">{error}</AlertDescription>
          </Alert>
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground text-lg">No items in your inventory yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="border border-border rounded-2xl overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className="aspect-square bg-muted relative">
                  <img
                    src={item.imageUrl || "/placeholder.svg?height=200&width=200"}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <h4 className="font-bold mb-1 truncate text-base">{item.name}</h4>
                  {item.collection && (
                    <Badge variant="secondary" className="mb-2 rounded-full font-semibold">
                      {item.collection.name}
                    </Badge>
                  )}
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{item.description}</p>
                  {item.attributes && item.attributes.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {item.attributes.slice(0, 3).map((attr, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs rounded-full">
                          {attr.name}: {attr.value}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <Button
                    size="sm"
                    variant="default"
                    className="w-full rounded-full font-semibold h-10"
                    onClick={() => handleTransfer(item)}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {selectedItem && (
        <ItemTransferDialog
          item={selectedItem}
          open={isTransferOpen}
          onOpenChange={setIsTransferOpen}
          onSuccess={handleTransferSuccess}
        />
      )}
    </>
  )
}
