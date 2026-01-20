import { db } from "./db"
import { payments } from "./schema"
import { eq, desc, or } from "drizzle-orm"

export interface Payment {
  id: string
  paymentRequestId: string
  transactionId: string
  amount: number
  currency: string
  paidBy?: string
  paidAt: string
  status: "completed" | "failed" | "cancelled"
  metadata?: Record<string, any>
}

export async function savePayment(payment: Payment): Promise<void> {
  try {
    // Check if payment with this ID or transaction ID already exists
    const existing = await db
      .select()
      .from(payments)
      .where(
        or(
          eq(payments.id, payment.id),
          eq(payments.transactionId, payment.transactionId)
        )
      )
      .limit(1)

    if (existing.length > 0) {
      // Update existing payment
      await db
        .update(payments)
        .set({
          paymentRequestId: payment.paymentRequestId,
          transactionId: payment.transactionId,
          amount: payment.amount.toString(),
          currency: payment.currency,
          paidBy: payment.paidBy,
          paidAt: new Date(payment.paidAt),
          status: payment.status,
          metadata: payment.metadata,
        })
        .where(eq(payments.id, existing[0].id))
    } else {
      // Insert new payment
      await db.insert(payments).values({
        id: payment.id,
        paymentRequestId: payment.paymentRequestId,
        transactionId: payment.transactionId,
        amount: payment.amount.toString(),
        currency: payment.currency,
        paidBy: payment.paidBy,
        paidAt: payment.paidAt ? new Date(payment.paidAt) : new Date(),
        status: payment.status,
        metadata: payment.metadata,
      })
    }
  } catch (error) {
    console.error("[PaymentsStorage] Error saving payment:", error)
    throw error
  }
}

export async function getPaymentsByPaymentRequestId(paymentRequestId: string): Promise<Payment[]> {
  try {
    const results = await db
      .select()
      .from(payments)
      .where(eq(payments.paymentRequestId, paymentRequestId))
      .orderBy(desc(payments.paidAt))

    return results.map((p) => ({
      id: p.id,
      paymentRequestId: p.paymentRequestId,
      transactionId: p.transactionId,
      amount: parseFloat(p.amount),
      currency: p.currency,
      paidBy: p.paidBy || undefined,
      paidAt: p.paidAt.toISOString(),
      status: p.status as "completed" | "failed" | "cancelled",
      metadata: p.metadata as Record<string, any> | undefined,
    }))
  } catch (error) {
    console.error("[PaymentsStorage] Error getting payments by request ID:", error)
    return []
  }
}

export async function getAllPayments(): Promise<Payment[]> {
  try {
    const results = await db
      .select()
      .from(payments)
      .orderBy(desc(payments.paidAt))

    return results.map((p) => ({
      id: p.id,
      paymentRequestId: p.paymentRequestId,
      transactionId: p.transactionId,
      amount: parseFloat(p.amount),
      currency: p.currency,
      paidBy: p.paidBy || undefined,
      paidAt: p.paidAt.toISOString(),
      status: p.status as "completed" | "failed" | "cancelled",
      metadata: p.metadata as Record<string, any> | undefined,
    }))
  } catch (error) {
    console.error("[PaymentsStorage] Error getting all payments:", error)
    return []
  }
}

export async function getPaymentById(paymentId: string): Promise<Payment | null> {
  try {
    const results = await db
      .select()
      .from(payments)
      .where(
        or(
          eq(payments.id, paymentId),
          eq(payments.transactionId, paymentId)
        )
      )
      .limit(1)

    if (results.length === 0) return null

    const p = results[0]
    return {
      id: p.id,
      paymentRequestId: p.paymentRequestId,
      transactionId: p.transactionId,
      amount: parseFloat(p.amount),
      currency: p.currency,
      paidBy: p.paidBy || undefined,
      paidAt: p.paidAt.toISOString(),
      status: p.status as "completed" | "failed" | "cancelled",
      metadata: p.metadata as Record<string, any> | undefined,
    }
  } catch (error) {
    console.error("[PaymentsStorage] Error getting payment by ID:", error)
    return null
  }
}

