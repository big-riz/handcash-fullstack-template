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
    const { data, error } = await Connect.getCurrentUserProfile({ client })

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
      client,
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
      client,
    })

    if (spendableError) throw new Error(spendableError.message || "Failed to get spendable balance")

    const { data: allBalances, error: allBalancesError } = await Connect.getBalances({
      client,
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
      client: sdk.client,
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
      client,
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

  // Item operations (uses handcash-connect)
  async transferItems(
    privateKey: string,
    params: {
      origins: string[]
      destination: string
    },
  ) {
    const account = this.getConnectAccount(privateKey)

    const result = await account.items.transfer({
      destinationsWithOrigins: [
        {
          origins: params.origins,
          destination: params.destination,
        },
      ],
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
}

// Export singleton instance
export const handcashService = new HandCashService()
