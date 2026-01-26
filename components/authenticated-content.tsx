import { InventoryDisplay } from "@/components/widgets/inventory-display"
import { MintModule } from "@/components/mint-module"
import { StatsSection } from "@/components/stats-section"
import { AppFooter } from "@/components/app-footer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Gamepad2 } from "lucide-react"
import { SlavicSurvivors } from "@/components/game/SlavicSurvivors"
import { DevLog } from "@/components/game/DevLog"
import { GameComments } from "@/components/game/GameComments"

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
            <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 space-y-12">
              <div className="flex flex-col items-center justify-center p-12 border border-border rounded-3xl bg-card/50 backdrop-blur-sm text-center space-y-6">
                 <h2 className="text-4xl font-black italic uppercase text-primary">Slavic Survivors</h2>
                 <p className="text-muted-foreground max-w-lg">Enter the exclusion zone. Survive the waves. Collect the loot.</p>
                 <a 
                   href="/play" 
                   className="inline-flex items-center justify-center h-16 px-12 text-xl font-black uppercase tracking-widest text-black bg-primary rounded-full hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(74,222,128,0.4)]"
                 >
                   Launch Game
                 </a>
              </div>
              <GameComments />
              <DevLog />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <AppFooter />
    </div>
  )
}
