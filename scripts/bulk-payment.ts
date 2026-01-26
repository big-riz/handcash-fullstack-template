import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'

// Load .env and .env.local files FIRST
dotenv.config({ path: path.join(process.cwd(), '.env') })
dotenv.config({ path: path.join(process.cwd(), '.env.local'), override: true })

import { getInstance, Connect } from '@handcash/sdk'

interface PaymentResult {
  handle: string
  success: boolean
  error?: string
  transactionId?: string
}

class BulkPaymentService {
  private readonly BATCH_SIZE = 10
  private readonly AMOUNT = 0.0001
  private readonly DENOMINATION_CURRENCY = 'USD'
  private readonly INSTRUMENT_CURRENCY = 'BSV'
  private results: PaymentResult[] = []
  private appId: string
  private appSecret: string

  constructor() {
    this.appId = process.env.HANDCASH_APP_ID!
    this.appSecret = process.env.HANDCASH_APP_SECRET!

    if (!this.appId || !this.appSecret) {
      throw new Error('HANDCASH_APP_ID and HANDCASH_APP_SECRET must be set in .env file')
    }
  }

  private getSDKClient(privateKey: string) {
    const sdk = getInstance({
      appId: this.appId,
      appSecret: this.appSecret,
    })
    return sdk.getAccountClient(privateKey)
  }

  async run(filePath: string, authToken: string, message?: string) {
    console.log('=== HandCash Bulk Payment Script ===')
    console.log(`Amount per payment: $${this.AMOUNT}`)
    console.log(`Batch size: ${this.BATCH_SIZE}`)
    console.log(`Denomination: ${this.DENOMINATION_CURRENCY}`)
    console.log(`Instrument: ${this.INSTRUMENT_CURRENCY}`)
    if (message) {
      console.log(`Message: ${message}`)
    }
    console.log('')

    // Read handles from file
    const handles = await this.readHandlesFromFile(filePath)
    console.log(`Loaded ${handles.length} handles from file`)
    console.log('')

    // Validate auth token
    console.log('Validating auth token...')
    const isValid = await this.validateAuthToken(authToken)
    if (!isValid) {
      throw new Error('Invalid auth token. Please check your BUSINESS_AUTH_TOKEN.')
    }
    console.log('Auth token is valid ✓')
    console.log('')

    // Check balance
    const balance = await this.getBalance(authToken)
    const usdBalance = balance.spendableBalances?.USD || 0
    const totalRequired = this.AMOUNT * handles.length
    console.log(`Current USD balance: $${usdBalance}`)
    console.log(`Total required: $${totalRequired}`)

    if (usdBalance < totalRequired) {
      console.warn(`⚠️  WARNING: Insufficient balance. You may not be able to complete all payments.`)
    }
    console.log('')

    // Process in batches
    const batches = this.createBatches(handles)
    console.log(`Processing ${batches.length} batches...`)
    console.log('')

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i]
      console.log(`\n--- Batch ${i + 1}/${batches.length} ---`)
      await this.processBatch(batch, authToken, message)

      // Small delay between batches to avoid rate limiting
      if (i < batches.length - 1) {
        console.log('Waiting 2 seconds before next batch...')
        await this.sleep(2000)
      }
    }

    // Generate report
    this.generateReport()
  }

  private async validateAuthToken(privateKey: string): Promise<boolean> {
    try {
      const client = this.getSDKClient(privateKey)
      const { error } = await Connect.getCurrentUserProfile({ client })
      return !error
    } catch {
      return false
    }
  }

  private async getBalance(privateKey: string) {
    const client = this.getSDKClient(privateKey)

    const { data: spendableBalances } = await Connect.getSpendableBalances({
      client,
    })

    const { data: allBalances } = await Connect.getBalances({
      client,
    })

    return {
      spendableBalances: spendableBalances || {},
      allBalances: allBalances || {},
    }
  }

  private async readHandlesFromFile(filePath: string): Promise<string[]> {
    const absolutePath = path.isAbsolute(filePath)
      ? filePath
      : path.join(process.cwd(), filePath)

    if (!fs.existsSync(absolutePath)) {
      throw new Error(`File not found: ${absolutePath}`)
    }

    const content = fs.readFileSync(absolutePath, 'utf-8')
    const handles = content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => line.replace(/^[@$]/, '')) // Remove @ or $ prefix if present

    if (handles.length === 0) {
      throw new Error('No handles found in file')
    }

    return handles
  }

  private createBatches(handles: string[]): string[][] {
    const batches: string[][] = []
    for (let i = 0; i < handles.length; i += this.BATCH_SIZE) {
      batches.push(handles.slice(i, i + this.BATCH_SIZE))
    }
    return batches
  }

  private async processBatch(batch: string[], authToken: string, message?: string) {
    console.log(`Processing ${batch.length} payments in a single transaction...`)

    try {
      const client = this.getSDKClient(authToken)

      // Build receivers array for bulk payment
      const receivers = batch.map(handle => ({
        destination: handle,
        sendAmount: this.AMOUNT,
      }))

      console.log(`  → Sending $${this.AMOUNT} each to: ${batch.join(', ')}...`)

      const { data, error } = await Connect.pay({
        client,
        body: {
          instrumentCurrencyCode: this.INSTRUMENT_CURRENCY,
          denominationCurrencyCode: this.DENOMINATION_CURRENCY,
          description: message || 'Bulk payment',
          receivers,
        },
      })

      if (error) {
        throw new Error(error.message || 'Batch payment failed')
      }

      const transactionId = (data as any)?.transactionId || 'unknown'

      // Mark all as successful
      batch.forEach(handle => {
        this.results.push({
          handle,
          success: true,
          transactionId
        })
      })

      console.log(`  ✓ Batch success! TX: ${transactionId}`)
    } catch (error: any) {
      const errorMessage = error.message || String(error)

      // Mark all in batch as failed if the batch fails
      batch.forEach(handle => {
        this.results.push({
          handle,
          success: false,
          error: errorMessage
        })
      })

      console.error(`  ✗ Batch failed: ${errorMessage}`)
    }
  }

  private generateReport() {
    console.log('\n\n=== Payment Report ===')

    const successful = this.results.filter(r => r.success)
    const failed = this.results.filter(r => !r.success)

    console.log(`Total payments: ${this.results.length}`)
    console.log(`Successful: ${successful.length}`)
    console.log(`Failed: ${failed.length}`)
    console.log(`Total sent: $${(successful.length * this.AMOUNT).toFixed(4)}`)

    if (failed.length > 0) {
      console.log('\nFailed payments:')
      failed.forEach(result => {
        console.log(`  - ${result.handle}: ${result.error}`)
      })
    }

    // Save detailed report to file
    const reportPath = path.join(process.cwd(), `payment-report-${Date.now()}.json`)
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2))
    console.log(`\nDetailed report saved to: ${reportPath}`)
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2)

  if (args.length < 1) {
    console.error('Usage: npm run bulk-payment <handles-file.txt> [message]')
    console.error('Example: npm run bulk-payment handles.txt "Mint @ squat.zone"')
    console.error('\nMake sure to set BUSINESS_AUTH_TOKEN in your .env file')
    process.exit(1)
  }

  const filePath = args[0]
  const message = args[1]
  const authToken = process.env.BUSINESS_AUTH_TOKEN

  if (!authToken) {
    console.error('Error: BUSINESS_AUTH_TOKEN not found in environment')
    console.error('Please add it to your .env.local file')
    process.exit(1)
  }

  const service = new BulkPaymentService()

  try {
    await service.run(filePath, authToken, message)
    console.log('\n✓ Bulk payment completed!')
  } catch (error: any) {
    console.error('\n✗ Error:', error.message)
    process.exit(1)
  }
}

main()
