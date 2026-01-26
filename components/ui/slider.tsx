import * as React from "react"

interface SliderProps {
    value: number[]
    onValueChange: (value: number[]) => void
    min: number
    max: number
    step: number
    className?: string
}

export function Slider({
    value,
    onValueChange,
    min,
    max,
    step,
    className = ""
}: SliderProps) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onValueChange([parseFloat(e.target.value)])
    }

    return (
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value[0]}
            onChange={handleChange}
            className={`w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-500 touch-target ${className}`}
            style={{
                background: `linear-gradient(to right, rgb(6 182 212) 0%, rgb(6 182 212) ${((value[0] - min) / (max - min)) * 100}%, rgba(255,255,255,0.1) ${((value[0] - min) / (max - min)) * 100}%, rgba(255,255,255,0.1) 100%)`,
                minHeight: '44px',
                padding: '20px 0'
            }}
        />
    )
}
