"use client"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { HelpCircle, AlertTriangle } from "lucide-react"

export function FaqModal() {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                    <HelpCircle className="w-4 h-4 mr-2" />
                    FAQ
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold mb-4">Frequently Asked Questions</DialogTitle>
                    <DialogDescription>
                        Everything you need to know about the collection and minting process.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                    <section>
                        <h3 className="font-bold text-lg mb-2">What happens when I mint?</h3>
                        <p className="text-muted-foreground">
                            You send a small payment ($0.25) to the game development fund. In return, the system instantly mints a unique digital collectible item directly to your HandCash wallet.
                        </p>
                    </section>

                    <section>
                        <h3 className="font-bold text-lg mb-2">Are these items tradable?</h3>
                        <p className="text-muted-foreground">
                            Yes! All items are standard HandCash items. You can view, transfer, or sell them on the HandCash market (if listed) or send them to friends directly from your inventory.
                        </p>
                    </section>

                    <section>
                        <h3 className="font-bold text-lg mb-2 flex items-center gap-2 text-amber-600 dark:text-amber-500">
                            <AlertTriangle className="w-5 h-5" />
                            Why is my mint pending / not appearing?
                        </h3>
                        <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl">
                            <p className="text-sm text-foreground font-medium mb-2">
                                App Whitelisting Required
                            </p>
                            <p className="text-sm text-muted-foreground">
                                HandCash item minting via the minter tooling requires this app to be <strong>whitelisted</strong> by HandCash.
                                If you are the developer, please ensure your App ID is approved for minting operations.
                                For users: if an error occurs, please contact support with your payment usage order ID.
                            </p>
                        </div>
                    </section>

                    <section>
                        <h3 className="font-bold text-lg mb-2">Where do the funds go?</h3>
                        <p className="text-muted-foreground">
                            100% of the proceeds go towards the "Squat Zone Deuce" game development milestones, specifically art assets and server costs.
                        </p>
                    </section>
                </div>
            </DialogContent>
        </Dialog>
    )
}
