import { InventoryDisplay } from "@/components/widgets/inventory-display"
import { MintModule } from "@/components/mint-module"
import { StatsSection } from "@/components/stats-section"
import { AppFooter } from "@/components/app-footer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ShoppingBag, Package, BarChart2, Gamepad2 } from "lucide-react"
import { SlavicSurvivors } from "@/components/game/SlavicSurvivors"

interface AuthenticatedContentProps {
  activeTab: string
  onTabChange: (value: string) => void
}

export function AuthenticatedContent({ activeTab, onTabChange }: AuthenticatedContentProps) {
  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-gradient-to-b from-primary/10 via-background to-background -z-10 pointer-events-none" />
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full -z-10 animate-pulse-slow" />
      <div className="absolute bottom-[10%] left-[-10%] w-[30%] h-[30%] bg-secondary/10 blur-[100px] rounded-full -z-10" />

      <div className="container-responsive flex-grow pt-8 md:pt-12 pb-12 md:pb-20">
        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
          <TabsContent value="mint" className="animate-in fade-in zoom-in-95 duration-500 mt-0">
            <div className="flex flex-col items-center">
              <div className="w-full max-w-2xl px-2 sm:px-4">
                <MintModule onTabChange={onTabChange} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="inventory" className="animate-in fade-in slide-in-from-bottom-4 duration-500 mt-0">
            <div className="max-w-6xl mx-auto px-2 sm:px-4">
              <InventoryDisplay />
            </div>
          </TabsContent>

          <TabsContent value="stats" className="animate-in fade-in slide-in-from-bottom-4 duration-500 mt-0">
            <div className="max-w-7xl mx-auto px-2 sm:px-4">
              <StatsSection />
            </div>
          </TabsContent>

          <TabsContent value="game" className="animate-in fade-in slide-in-from-bottom-4 duration-500 mt-0">
            <div className="w-full max-w-7xl mx-auto px-2 sm:px-4">
              <SlavicSurvivors />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <AppFooter />
    </div>
  )
}
