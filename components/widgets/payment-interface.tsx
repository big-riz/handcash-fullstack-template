"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Send, Wallet, RefreshCw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Balance {
  spendableBalances: {
    items: Array<{
      spendableBalance: number
      currencyCode: string
    }>
  }
  allBalances: {
    items: Array<{
      currency: {
        code: string
        logoUrl: string
        symbol: string
      }
      units: number
      fiatEquivalent: {
        currencyCode: string
        units: number
      }
    }>
  }
}

export function PaymentInterface() {
  const [balance, setBalance] = useState<Balance | null>(null)
  const [isLoadingBalance, setIsLoadingBalance] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form state
  const [destination, setDestination] = useState("")
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [denominationCurrency, setDenominationCurrency] = useState("BSV")

  const fetchBalance = async () => {
    setIsLoadingBalance(true)
    setError(null)
    try {
      const response = await fetch("/api/payments/balance", {
        credentials: "include", // Automatically sends cookies
      })

      if (!response.ok) {
        // Not authenticated or error
        setIsLoadingBalance(false)
        return
      }

      const data = await response.json()
      setBalance(data)
    } catch (err) {
      console.error("[v0] Balance fetch error:", err)
      setError("Failed to load balance")
    } finally {
      setIsLoadingBalance(false)
    }
  }

  useEffect(() => {
    fetchBalance()
  }, [])

  const handleSendPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSending(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch("/api/payments/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Automatically sends cookies
        body: JSON.stringify({
          destination,
          amount,
          currency: denominationCurrency,
          description,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Payment failed")
      }

      setSuccess(`Payment sent successfully! Transaction ID: ${data.data?.transactionId || "N/A"}`)
      setDestination("")
      setAmount("")
      setDescription("")
      fetchBalance()
    } catch (err: any) {
      console.error("[v0] Payment error:", err)
      setError(err.message || "Failed to send payment")
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Balance Card */}
      <Card className="p-6 rounded-3xl border-border">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Wallet className="w-6 h-6 text-primary" />
            <h3 className="text-xl font-bold">Wallet Balance</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={fetchBalance} disabled={isLoadingBalance} className="rounded-full">
            <RefreshCw className={`w-5 h-5 ${isLoadingBalance ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {isLoadingBalance ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : balance ? (
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-3">Spendable Balance</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {balance.spendableBalances?.items?.map((item) => (
                  <div key={item.currencyCode} className="p-4 bg-muted rounded-2xl">
                    <div className="text-xs text-muted-foreground mb-1 font-semibold">{item.currencyCode}</div>
                    <div className="text-2xl font-bold">
                      {item.spendableBalance.toFixed(item.currencyCode === "BSV" ? 8 : 2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {balance.allBalances?.items && balance.allBalances.items.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-3">Total Balance</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {balance.allBalances.items.map((item) => (
                    <div key={item.currency.code} className="p-4 bg-muted/50 rounded-2xl">
                      <div className="text-xs text-muted-foreground mb-1 font-semibold">{item.currency.code}</div>
                      <div className="text-2xl font-bold">
                        {item.units.toFixed(item.currency.code === "BSV" ? 8 : 2)}
                      </div>
                      {item.fiatEquivalent && (
                        <div className="text-xs text-muted-foreground mt-1">
                          ≈ ${item.fiatEquivalent.units.toFixed(2)} {item.fiatEquivalent.currencyCode}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8 text-lg">No balance data available</p>
        )}
      </Card>

      {/* Payment Form */}
      <Card className="p-6 rounded-3xl border-border">
        <div className="flex items-center gap-3 mb-6">
          <Send className="w-6 h-6 text-primary" />
          <h3 className="text-xl font-bold">Send Payment</h3>
        </div>

        <form onSubmit={handleSendPayment} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="destination" className="font-semibold">
              Recipient (Handle, Paymail, or Address)
            </Label>
            <Input
              id="destination"
              type="text"
              placeholder="@username or user@handcash.io or 1A1z..."
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              required
              className="rounded-2xl h-12"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency" className="font-semibold">
              Denomination Currency
            </Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Select value={denominationCurrency} onValueChange={setDenominationCurrency}>
                  <SelectTrigger id="currency" className="rounded-2xl h-12">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="BSV">BSV</SelectItem>
                    <SelectItem value="MNEE">MNEE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDenominationCurrency("USD")}
                className={`rounded-2xl font-semibold ${denominationCurrency === "USD" ? "bg-muted" : ""}`}
              >
                USD (Default)
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount" className="font-semibold">
              Amount ({denominationCurrency})
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="rounded-2xl h-12 text-lg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="font-semibold">
              Message (Optional)
            </Label>
            <Textarea
              id="description"
              placeholder="Add a note to your payment..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="rounded-2xl"
            />
          </div>

          {error && (
            <Alert variant="destructive" className="rounded-2xl">
              <AlertDescription className="font-medium">{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="rounded-2xl border-primary/50 bg-primary/5">
              <AlertDescription className="text-primary font-semibold">{success}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full rounded-full h-14 text-lg font-bold" disabled={isSending}>
            {isSending ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Sending Payment...
              </>
            ) : (
              <>
                <Send className="w-5 h-5 mr-2" />
                Send Payment
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 p-4 bg-muted rounded-2xl">
          <h4 className="text-sm font-bold mb-3">Supported Recipients</h4>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="rounded-full font-semibold">
              Handcash Handles
            </Badge>
            <Badge variant="secondary" className="rounded-full font-semibold">
              Paymail Addresses
            </Badge>
            <Badge variant="secondary" className="rounded-full font-semibold">
              Bitcoin Addresses
            </Badge>
          </div>
        </div>
      </Card>
    </div>
  )
}
