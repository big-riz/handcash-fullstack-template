import { ReactNode } from "react"

export function StatRow({ label, value, icon }: { label: string, value: string | undefined, icon: ReactNode }) {
    return (
        <div className="flex justify-between items-center bg-white/5 p-1.5 rounded hover:bg-white/10 transition-colors">
            <div className="flex items-center gap-2 text-white/80 uppercase text-[10px] tracking-wider font-bold">
                {icon}
                {label}
            </div>
            <div className="text-white font-bold">{value}</div>
        </div>
    )
}
