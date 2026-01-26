"use client"

import { SlavicSurvivors } from "@/components/game/SlavicSurvivors"

export default function PlayPage() {
    return (
        <div className="full-viewport overflow-hidden bg-black prevent-pull-refresh">
            <SlavicSurvivors />
        </div>
    )
}
