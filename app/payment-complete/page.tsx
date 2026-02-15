
"use client"

import { useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

function PaymentCompleteContent() {
    const searchParams = useSearchParams()
    const router = useRouter()

    // HandCash typically appends paymentRequestId as 'requestId' or 'paymentRequestId'
    const requestId = searchParams.get("requestId") || searchParams.get("paymentRequestId")
    const transactionId = searchParams.get("transactionId")

    useEffect(() => {
        const findAndRedirect = async () => {
            if (!requestId) {
                // If no requestId, just go home
                router.replace("/")
                return
            }

            try {
                // We'll search for the intent by paymentRequestId
                // We can use the status API but we need the intentId.
                // Or we can add a search-by-request-id endpoint.
                // To keep it simple, let's just go to mint-complete and let it handle the search if we update it
                // Or better, let's create an endpoint that resolves a requestId to an intentId
                const res = await fetch(`/api/mint/status?paymentRequestId=${requestId}`)
                const data = await res.json()

                if (data.intentId) {
                    router.replace(`/mint-complete?intentId=${data.intentId}`)
                } else {
                    router.replace(`/mint-complete?requestId=${requestId}`) // Fallback status check by ID
                }
            } catch (err) {
                console.error("Redirect error:", err)
                router.replace("/")
            }
        }

        findAndRedirect()
    }, [requestId, router])

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <h1 className="text-2xl font-black uppercase italic tracking-tighter">Redirecting...</h1>
        </div>
    )
}

export default function PaymentCompletePage() {
    return (
        <Suspense fallback={null}>
            <PaymentCompleteContent />
        </Suspense>
    )
}
