import { getInstance, Connect } from "@handcash/sdk"
import { HandCashConnect } from "@handcash/handcash-connect"

export class HandCashService {
  private appId: string
  private appSecret: string

  constructor() {
    this.appId = process.env.HANDCASH_APP_ID!
    this.appSecret = process.env.HANDCASH_APP_SECRET!

    if (!this.appId || !this.appSecret) {
      throw new Error("HandCash credentials not configured")
    }
  }

  // Get SDK v3 client (newer SDK)
  private getSDKClient(privateKey: string) {
    const sdk = getInstance({
      appId: this.appId,
      appSecret: this.appSecret,
    })
    return sdk.getAccountClient(privateKey)
  }

  // Get handcash-connect account (older SDK for features like friends)
  private getConnectAccount(privateKey: string) {
    const handCashConnect = new HandCashConnect({
      appId: this.appId,
      appSecret: this.appSecret,
    })
    return handCashConnect.getAccountFromAuthToken(privateKey)
  }

  // Profile operations
  async getUserProfile(privateKey: string) {
    const client = this.getSDKClient(privateKey)
    const { data, error } = await Connect.getCurrentUserProfile({ client: client as any })

    if (error) throw new Error(error.message || "Failed to get user profile")
    return data
  }

  // Friends operations (uses handcash-connect)
  async getFriends(privateKey: string) {
    try {
      console.log("[v0] Getting friends with privateKey:", privateKey?.substring(0, 10) + "...")
      const account = this.getConnectAccount(privateKey)
      console.log("[v0] Account object type:", typeof account)

      const result = await account.profile.getFriends()
      console.log("[v0] getFriends raw result:", JSON.stringify(result, null, 2))

      if (Array.isArray(result)) {
        console.log("[v0] Result is array, length:", result.length)
        return result
      }

      const friends = result?.friends || []
      console.log("[v0] Friends array:", friends, "Length:", friends.length)

      return friends
    } catch (error) {
      console.error("[v0] getFriends error:", error)
      throw error
    }
  }

  // Payment operations
  async sendPayment(
    privateKey: string,
    params: {
      destination: string
      amount: number
      currency?: string
      description?: string
    },
  ) {
    const client = this.getSDKClient(privateKey)

    const { data, error } = await Connect.pay({
      client: client as any,
      body: {
        instrumentCurrencyCode: params.currency || "BSV",
        description: params.description || undefined,
        receivers: [
          {
            destination: params.destination,
            sendAmount: params.amount,
          },
        ],
      },
    })

    if (error) throw new Error(error.message || "Payment failed")
    return data
  }

  async getBalance(privateKey: string) {
    const client = this.getSDKClient(privateKey)

    const { data: spendableBalances, error: spendableError } = await Connect.getSpendableBalances({
      client: client as any,
    })

    if (spendableError) throw new Error(spendableError.message || "Failed to get spendable balance")

    const { data: allBalances, error: allBalancesError } = await Connect.getBalances({
      client: client as any,
    })

    if (allBalancesError) {
      console.warn("[v0] All balances error:", allBalancesError)
    }

    return {
      spendableBalances: spendableBalances || {},
      allBalances: allBalances || {},
    }
  }

  async getExchangeRate(currencyCode = "USD") {
    const sdk = getInstance({
      appId: this.appId,
      appSecret: this.appSecret,
    })

    const { data, error } = await Connect.getExchangeRate({
      client: sdk.client as any,
      path: {
        currencyCode: currencyCode as any,
      },
    })

    if (error) {
      console.error("[HandCashService] Exchange rate error:", error)
      throw new Error(error.message || "Failed to get exchange rate")
    }

    // Handle variation in SDK response structure
    const rate = typeof data === "number" ? data : ((data as any)?.rate || (data as any)?.exchangeRate)

    if (typeof rate !== "number") {
      console.error("[HandCashService] Invalid exchange rate data received:", data)
    }

    return rate
  }

  async getInventory(privateKey: string, limit = 100) {
    const client = this.getSDKClient(privateKey)
    const { data, error } = await Connect.getItemsInventory({
      client: client as any,
      body: { from: 0, to: limit },
    })

    if (error) throw new Error(error.message || "Failed to get inventory")

    // HandCash API returns {items: [...]} in data
    const rawItems = (data as any)?.items || (Array.isArray(data) ? data : [])

    return rawItems.map((item: any) => ({
      id: item.id || item.origin,
      origin: item.origin,
      name: item.name,
      description: item.description,
      imageUrl: item.mediaDetails?.image?.url || item.imageUrl || item.image,
      multimediaUrl: item.mediaDetails?.multimedia?.url || item.multimediaUrl,
      rarity: item.rarity,
      color: item.color,
      count: item.count || item.amount || item.quantity,
      groupingValue: item.groupingValue,
      attributes: item.attributes,
      collection: item.collection,
    }))
  }

  async getFullInventory(privateKey: string, batchSize = 500) {
    const client = this.getSDKClient(privateKey)
    const allItems: any[] = []
    let from = 0

    while (true) {
      const { data, error } = await Connect.getItemsInventory({
        client: client as any,
        body: {
          from,
          to: from + batchSize,
          fetchAttributes: true,
        },
      })

      if (error) throw new Error(error.message || "Failed to get inventory")

      const batchItems = (data as any)?.items || (Array.isArray(data) ? data : [])
      allItems.push(...batchItems)

      if (!batchItems.length || batchItems.length < batchSize) {
        break
      }
      from += batchSize
    }

    return allItems.map((item: any) => ({
      id: item.id || item.origin,
      origin: item.origin,
      name: item.name,
      description: item.description,
      imageUrl: item.mediaDetails?.image?.url || item.imageUrl || item.image,
      multimediaUrl: item.mediaDetails?.multimedia?.url || item.multimediaUrl,
      rarity: item.rarity,
      color: item.color,
      count: item.count || item.amount || item.quantity,
      groupingValue: item.groupingValue,
      attributes: item.attributes,
      collection: item.collection,
    }))
  }

  // Item operations (uses SDK v3)
  async transferItem(
    privateKey: string,
    params: {
      itemOrigin: string | string[]
      destination: string
    },
  ) {
    const client = this.getSDKClient(privateKey)

    const body = Array.isArray(params.itemOrigin)
      ? { itemOrigins: params.itemOrigin, destination: params.destination }
      : { itemOrigin: params.itemOrigin, destination: params.destination }

    const { data, error } = await Connect.transferItem({
      client,
      body,
    })

    if (error) throw new Error(error.message || "Failed to transfer item")
    return data
  }

  async lockItems(privateKey: string, itemOrigins: string[]) {
    const client = this.getSDKClient(privateKey)

    const { data, error } = await Connect.lockItems({
      client,
      body: { itemOrigins },
    })

    if (error) throw new Error(error.message || "Failed to lock items")
    return data
  }

  async unlockItems(privateKey: string, itemOrigins: string[]) {
    const client = this.getSDKClient(privateKey)

    const { data, error } = await Connect.unlockItems({
      client,
      body: { itemOrigins },
    })

    if (error) throw new Error(error.message || "Failed to unlock items")
    return data
  }

  async getLockedItems(privateKey: string, limit = 100) {
    const client = this.getSDKClient(privateKey)

    const { data, error } = await Connect.getLockedItems({
      client,
      body: {
        from: 0,
        to: limit,
        fetchAttributes: true,
      },
    })

    if (error) throw new Error(error.message || "Failed to get locked items")
    return data
  }

  async resolveHandles(privateKey: string, handles: string[]) {
    const account = this.getConnectAccount(privateKey)
    const cleanedHandles = handles
      .map((handle) => handle.trim().replace(/^[@$]/, ""))
      .filter(Boolean)

    const result: Record<string, string> = {}

    for (let i = 0; i < cleanedHandles.length; i += 10) {
      const batch = cleanedHandles.slice(i, i + 10)
      try {
        const profiles = await account.profile.getPublicProfilesByHandle(batch)
        profiles.forEach((profile: { handle: string; id: string }) => {
          result[profile.handle.toLowerCase()] = profile.id
        })
      } catch (error) {
        console.error("[HandCashService] Error resolving handles batch:", error)
      }
    }

    return result
  }

  // Item operations (uses handcash-connect)
  async transferItems(
    privateKey: string,
    params: {
      origins: string[]
      destination: string | string[]
    },
  ) {
    const account = this.getConnectAccount(privateKey)

    const destinations = Array.isArray(params.destination) ? params.destination : [params.destination]

    let destinationsWithOrigins: Array<{ origins: string[]; destination: string }> = []

    if (destinations.length === 1) {
      destinationsWithOrigins = [
        {
          origins: params.origins,
          destination: destinations[0],
        },
      ]
    } else {
      if (params.origins.length < destinations.length) {
        throw new Error("Not enough item origins for all destinations")
      }

      destinationsWithOrigins = destinations.map((destination, index) => ({
        destination,
        origins: [params.origins[index]],
      }))
    }

    const result = await account.items.transfer({
      destinationsWithOrigins,
    })

    return result
  }

  // Validation
  async validateAuthToken(privateKey: string): Promise<boolean> {
    try {
      await this.getUserProfile(privateKey)
      return true
    } catch {
      return false
    }
  }

  // Payment Requests (v3 API)
  async createPaymentRequest(params: {
    productName: string
    productDescription?: string
    productImageUrl?: string
    receivers: { destination: string; amount: number; currencyCode?: string }[]
    instrumentCurrencyCode?: string
    currencyCode?: string
    expirationType?: "one_time" | "never" | "expiration" | "limit"
    expirationTime?: string
    remainingUnits?: number
    redirectUrl?: string
    webhookUrl?: string
    metadata?: any
  }) {
    const url = "https://cloud.handcash.io/v3/paymentRequests"

    // Construct the body according to HandCash v3 "Corrected Documentation"
    const body: any = {
      product: {
        name: params.productName,
        description: params.productDescription || params.productName,
        imageUrl: params.productImageUrl,
      },
      receivers: params.receivers.map(r => ({
        destination: r.destination,
        sendAmount: r.amount,
        // currencyCode is WRONG in receivers array according to corrected docs
      })),
      instrumentCurrencyCode: params.instrumentCurrencyCode || "BSV",
      currency: params.currencyCode || params.receivers[0]?.currencyCode || "BSV",
      expirationType: params.expirationType || "one_time",
      redirectUrl: params.redirectUrl,
      webhookUrl: params.webhookUrl,
      notifications: params.webhookUrl ? {
        webhook: {
          webhookUrl: params.webhookUrl
        }
      } : undefined,
      metadata: params.metadata,
    }

    if (params.expirationTime) {
      body.expirationTime = params.expirationTime;
    }

    if (params.remainingUnits !== undefined) {
      body.remainingUnits = params.remainingUnits;
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "app-id": this.appId,
        "app-secret": this.appSecret,
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[HandCashService] createPaymentRequest failed:", response.status, errorText, "Body sent:", JSON.stringify(body, null, 2));
      throw new Error(`Failed to create payment request: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json()
    return data
  }

  async getPaymentRequest(paymentRequestId: string) {
    const url = `https://cloud.handcash.io/v3/paymentRequests/${paymentRequestId}`

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "app-id": this.appId,
        "app-secret": this.appSecret,
      },
    })

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get payment request: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return await response.json()
  }

  async updatePaymentRequest(paymentRequestId: string, body: any) {
    const url = `https://cloud.handcash.io/v3/paymentRequests/${paymentRequestId}`

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "app-id": this.appId,
        "app-secret": this.appSecret,
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update payment request: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return await response.json()
  }

  async getPaymentRequestTemplate(templateId: string) {
    const url = `https://cloud.handcash.io/v3/paymentRequests/templates/${templateId}`

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "app-id": this.appId,
        "app-secret": this.appSecret,
      },
    })

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get template: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return await response.json()
  }

  async updatePaymentRequestTemplate(templateId: string, body: any) {
    const url = `https://cloud.handcash.io/v3/paymentRequests/templates/${templateId}`

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "app-id": this.appId,
        "app-secret": this.appSecret,
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update template: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return await response.json()
  }

  async getCampaign(campaignId: string) {
    const url = `https://cloud.handcash.io/v3/campaigns/${campaignId}`

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "app-id": this.appId,
        "app-secret": this.appSecret,
      },
    })

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get campaign: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return await response.json()
  }

  async updateCampaign(campaignId: string, body: any) {
    const url = `https://cloud.handcash.io/v3/campaigns/${campaignId}`

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "app-id": this.appId,
        "app-secret": this.appSecret,
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update campaign: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return await response.json()
  }
}

// Export singleton instance
export const handcashService = new HandCashService()
