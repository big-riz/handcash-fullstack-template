import { InventoryDisplay } from "@/components/widgets/inventory-display"
import { MintModule } from "@/components/mint-module"
import { TrustSection } from "@/components/trust-section"
import { AppFooter } from "@/components/app-footer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ShoppingBag, Package, ShieldCheck } from "lucide-react"

export function AuthenticatedContent() {
  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-gradient-to-b from-primary/10 via-background to-background -z-10 pointer-events-none" />
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full -z-10 animate-pulse-slow" />
      <div className="absolute bottom-[10%] left-[-10%] w-[30%] h-[30%] bg-secondary/10 blur-[100px] rounded-full -z-10" />

      <div className="container mx-auto px-4 flex-grow pt-12 pb-20">
        {/* Brand Header */}
        <div className="text-center mb-16 animate-in fade-in slide-in-from-top-4 duration-1000">
          <h1 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter mb-4 bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/60">
            Gopnik Mint
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground font-medium max-w-2xl mx-auto leading-tight">
            Exclusive digital collectibles for the modern street legend.
          </p>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="mint" className="w-full">
          <div className="flex justify-center mb-12">
            <TabsList className="h-16 p-1.5 bg-muted/50 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl">
              <TabsTrigger
                value="mint"
                className="rounded-xl px-8 h-full data-[state=active]:bg-background data-[state=active]:shadow-lg text-lg font-bold transition-all gap-2"
              >
                <ShoppingBag className="w-5 h-5" />
                Mint
              </TabsTrigger>
              <TabsTrigger
                value="inventory"
                className="rounded-xl px-8 h-full data-[state=active]:bg-background data-[state=active]:shadow-lg text-lg font-bold transition-all gap-2"
              >
                <Package className="w-5 h-5" />
                Collection
              </TabsTrigger>
              <TabsTrigger
                value="trust"
                className="rounded-xl px-8 h-full data-[state=active]:bg-background data-[state=active]:shadow-lg text-lg font-bold transition-all gap-2"
              >
                <ShieldCheck className="w-5 h-5" />
                Trust
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="mint" className="animate-in fade-in zoom-in-95 duration-500 mt-0">
            <div className="flex flex-col items-center">
              <div className="w-full max-w-2xl">
                <div className="mb-6 flex items-center justify-center gap-3">
                  <div className="h-[1px] flex-grow bg-gradient-to-r from-transparent to-border" />
                  <span className="text-sm font-black uppercase tracking-widest text-muted-foreground">Main Action</span>
                  <div className="h-[1px] flex-grow bg-gradient-to-l from-transparent to-border" />
                </div>
                <MintModule />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="inventory" className="animate-in fade-in slide-in-from-bottom-4 duration-500 mt-0">
            <div className="max-w-5xl mx-auto">
              <InventoryDisplay />
            </div>
          </TabsContent>

          <TabsContent value="trust" className="animate-in fade-in slide-in-from-bottom-4 duration-500 mt-0">
            <div className="max-w-4xl mx-auto">
              <TrustSection />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <AppFooter />
    </div>
  )
}
