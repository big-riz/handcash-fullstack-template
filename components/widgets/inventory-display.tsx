"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Package, RefreshCw, Send, Eye, ChevronDown, ChevronUp, Flame } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { ItemTransferDialog } from "@/components/widgets/item-transfer-dialog"
import { ItemInspectDialog } from "@/components/widgets/item-inspect-dialog"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useInventory, type InventoryItem } from "@/hooks/use-inventory"

export function InventoryDisplay() {
  const { items, collections, isLoading, error, isBurning, fetchInventory, burnItem } = useInventory()
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [isTransferOpen, setIsTransferOpen] = useState(false)
  const [inspectItem, setInspectItem] = useState<InventoryItem | null>(null)
  const [isInspectOpen, setIsInspectOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [burnItemState, setBurnItemState] = useState<InventoryItem | null>(null)
  const [isBurnDialogOpen, setIsBurnDialogOpen] = useState(false)

  const handleTransfer = (item: InventoryItem) => {
    setSelectedItem(item)
    setIsTransferOpen(true)
  }

  const handleTransferSuccess = () => {
    fetchInventory()
    setIsTransferOpen(false)
    setSelectedItem(null)
  }

  const handleBurnClick = (item: InventoryItem) => {
    setBurnItemState(item)
    setIsBurnDialogOpen(true)
  }

  const handleBurnConfirm = async () => {
    if (!burnItemState || !burnItemState.origin) {
      return
    }

    try {
      await burnItem(burnItemState.origin)
      setIsBurnDialogOpen(false)
      setBurnItemState(null)
      toast.success("Item burned successfully")
    } catch (err: any) {
      toast.error(err.message || "Failed to burn item")
    }
  }

  return (
    <>
      <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-6">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 glass rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg">
              <Package className="w-5 h-5 md:w-6 md:h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-fluid-3xl font-black uppercase italic tracking-tighter">My Collection</h3>
              <p className="text-fluid-xs md:text-fluid-sm text-muted-foreground font-medium uppercase tracking-[0.2em]">Inventory System</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="lg"
            onClick={() => fetchInventory()}
            disabled={isLoading}
            className="rounded-xl md:rounded-2xl px-4 md:px-6 h-12 md:h-14 font-bold border-border bg-background/50 backdrop-blur-sm hover:translate-y-[-2px] transition-all w-full md:w-auto"
          >
            <RefreshCw className={`w-4 md:w-5 h-4 md:h-5 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh Gear
          </Button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 md:py-32 gap-4">
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <p className="font-bold text-muted-foreground animate-pulse uppercase tracking-widest text-fluid-xs">Accessing Vault...</p>
          </div>
        ) : error ? (
          <Alert variant="destructive" className="rounded-2xl md:rounded-[2rem] border-destructive/20 bg-destructive/5 p-6 md:p-8">
            <AlertDescription className="font-bold text-base md:text-lg text-center">{error}</AlertDescription>
          </Alert>
        ) : items.length === 0 ? (
          <div className="text-center py-20 md:py-32 glass rounded-2xl md:rounded-[3rem]">
            <div className="w-16 h-16 md:w-24 md:h-24 glass rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 opacity-40">
              <Package className="w-8 h-8 md:w-10 md:h-10 text-muted-foreground" />
            </div>
            <h4 className="text-fluid-2xl font-black uppercase italic tracking-tighter mb-2">The Vault is Empty</h4>
            <p className="text-fluid-sm text-muted-foreground font-medium max-w-[250px] mx-auto px-4">
              Start minting to populate your exclusive collection.
            </p>
          </div>
        ) : (
          <>
            <div className="grid-responsive-3">
              {(isExpanded ? items : items.slice(0, 6)).map((item) => (
                <div
                  key={item.id}
                  className="glass-card rounded-2xl md:rounded-[2.5rem] overflow-hidden group transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 hover:translate-y-[-4px] md:hover:translate-y-[-8px] border-white/5"
                >
                  <div className="aspect-square bg-muted/20 relative overflow-hidden">
                    <img
                      src={item.imageUrl || "/placeholder.svg?height=400&width=400"}
                      alt={item.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    {item.rarity && (
                      <div className="absolute top-3 right-3 md:top-4 md:right-4">
                        <Badge className="bg-primary/90 text-primary-foreground backdrop-blur-md px-3 md:px-4 py-1 md:py-1.5 rounded-lg md:rounded-xl border-none font-black text-[9px] md:text-[10px] tracking-[0.2em] shadow-xl">
                          {item.rarity.toUpperCase()}
                        </Badge>
                      </div>
                    )}
                  </div>

                  <div className="p-4 md:p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-black uppercase italic tracking-tighter text-lg md:text-xl truncate">{item.name}</h4>
                      {item.count !== undefined && item.count > 1 && (
                        <Badge variant="outline" className="rounded-lg text-[9px] md:text-[10px] font-black shrink-0 ml-2 border-primary/30 text-primary uppercase">
                          x{item.count}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mb-3 md:mb-4">
                      <Badge variant="secondary" className="rounded-lg font-bold text-[9px] md:text-[10px] uppercase tracking-widest bg-muted/60 text-muted-foreground">
                        {item.collection?.name || "Standard Edition"}
                      </Badge>
                    </div>

                    {item.description && (
                      <p className="text-xs text-muted-foreground font-medium line-clamp-2 mb-3 md:mb-4 h-8">{item.description}</p>
                    )}

                    <div className="grid grid-cols-2 gap-2 md:gap-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-lg md:rounded-xl font-bold h-10 md:h-12 text-xs md:text-sm border-border/50 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all gap-1.5 md:gap-2"
                        onClick={() => {
                          setInspectItem(item)
                          setIsInspectOpen(true)
                        }}
                      >
                        <Eye className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-lg md:rounded-xl font-bold h-10 md:h-12 text-xs md:text-sm border-border/50 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all gap-1.5 md:gap-2"
                        onClick={() => handleTransfer(item)}
                      >
                        <Send className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        Send
                      </Button>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-full mt-2 md:mt-3 rounded-lg md:rounded-xl font-bold h-9 md:h-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all opacity-0 group-hover:opacity-100 duration-300 gap-1.5 md:gap-2"
                      onClick={() => handleBurnClick(item)}
                      disabled={!item.origin}
                    >
                      <Flame className="w-3 h-3 md:w-3.5 md:h-3.5" />
                      <span className="text-[9px] md:text-[10px] uppercase tracking-widest font-black">Destroy Item</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            {items.length > 6 && (
              <div className="flex justify-center mt-8 md:mt-12">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="rounded-xl md:rounded-[1.5rem] px-6 md:px-10 h-14 md:h-16 font-black uppercase italic tracking-tighter text-base md:text-lg border-border bg-background/50 backdrop-blur-sm shadow-xl hover:translate-y-[-2px] transition-all"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="w-5 h-5 md:w-6 md:h-6 mr-2 md:mr-3" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-5 h-5 md:w-6 md:h-6 mr-2 md:mr-3" />
                      Show All Gear ({items.length - 6} more)
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {selectedItem && (
        <ItemTransferDialog
          item={selectedItem}
          open={isTransferOpen}
          onOpenChange={setIsTransferOpen}
          onSuccess={handleTransferSuccess}
        />
      )}

      {inspectItem && (
        <ItemInspectDialog
          item={inspectItem}
          open={isInspectOpen}
          onOpenChange={setIsInspectOpen}
          collections={collections}
        />
      )}

      <AlertDialog open={isBurnDialogOpen} onOpenChange={setIsBurnDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to burn this item?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The item "{burnItemState?.name}" will be permanently destroyed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBurning}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBurnConfirm} disabled={isBurning} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isBurning ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Burning...
                </>
              ) : (
                <>
                  <Flame className="w-4 h-4 mr-2" />
                  Burn Item
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
