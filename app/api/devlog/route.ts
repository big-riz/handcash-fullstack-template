import { NextResponse } from "next/server"
import * as fs from "fs"
import * as path from "path"

export async function GET() {
    try {
        const devlogPath = path.join(process.cwd(), "devlog.txt")
        
        if (!fs.existsSync(devlogPath)) {
            return NextResponse.json({ content: "" })
        }

        const content = fs.readFileSync(devlogPath, "utf-8")
        return NextResponse.json({ content })
    } catch (error) {
        console.error("Failed to read devlog:", error)
        return NextResponse.json({ content: "" })
    }
}
