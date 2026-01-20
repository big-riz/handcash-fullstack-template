"use client"

import { ExternalLink, Milestone } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"

export function TrustSection() {
    return (
        <div className="mt-16 py-12 border-t border-border">
            <div className="max-w-4xl mx-auto px-4">
                <h2 className="text-2xl font-bold mb-8 text-center flex items-center justify-center gap-2">
                    <Milestone className="w-6 h-6 text-primary" />
                    Development Progress
                </h2>

                <div className="mb-12">
                    <div className="flex justify-between text-sm font-semibold mb-2">
                        <span>Current Milestone: Alpha Release</span>
                        <span>65% Funded</span>
                    </div>
                    <Progress value={65} className="h-4 rounded-full" />
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                        Total Mints: 1,240 / 2,000 goal
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <div className="p-6 bg-muted/30 rounded-3xl border border-border">
                        <h3 className="font-bold mb-2">Transparency</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Track our progress and see exactly how funds are being used to develop the game.
                        </p>
                        <Button variant="outline" size="sm" className="w-full gap-2">
                            View Roadmap in GitHub <ExternalLink className="w-4 h-4" />
                        </Button>
                    </div>

                    <div className="p-6 bg-muted/30 rounded-3xl border border-border">
                        <h3 className="font-bold mb-2">Community Support</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Join our community to give feedback, report bugs, and suggest new features.
                        </p>
                        <Button variant="outline" size="sm" className="w-full gap-2">
                            Join Discord Server <ExternalLink className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
