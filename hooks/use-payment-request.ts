
import { useCallback } from "react"

interface UsePaymentRequestResult {
    openPaymentRequestPopup: (url: string) => Promise<boolean>
}

export function usePaymentRequest(): UsePaymentRequestResult {
    const openPaymentRequestPopup = useCallback((url: string): Promise<boolean> => {
        return new Promise((resolve) => {
            const width = 500
            const height = 700
            const left = window.screen.width / 2 - width / 2
            const top = window.screen.height / 2 - height / 2

            const popup = window.open(
                url,
                "HandCash Payment",
                `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`
            )

            if (!popup) {
                console.error("Popup blocked")
                resolve(false)
                return
            }

            const messageHandler = (event: MessageEvent) => {
                // In production, verify event.origin matches your domain or HandCash domain if redirected back
                if (event.data === "payment_complete" || (typeof event.data === "object" && event.data.status === "payment_complete")) {
                    window.removeEventListener("message", messageHandler)
                    popup.close()
                    resolve(true)
                }
            }

            window.addEventListener("message", messageHandler)

            // Optional: Check if popup is closed manually
            const checkClosed = setInterval(() => {
                if (popup.closed) {
                    clearInterval(checkClosed)
                    window.removeEventListener("message", messageHandler)
                    // If closed without message, we assume cancelled or user closed it. 
                    // We resolve false unless we successfully resolved true already (which creates a race but practically okay)
                    resolve(false)
                }
            }, 1000)

        })
    }, [])

    return { openPaymentRequestPopup }
}
