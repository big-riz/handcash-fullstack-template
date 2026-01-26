# Bulk Payment Script

This script sends bulk payments via HandCash, processing 10 handles at a time.

## Features

- Sends $0.0001 (USD) to each handle in a text file
- Processes payments in batches of 10 to avoid rate limiting
- Validates auth token before starting
- Checks balance before processing
- Provides detailed progress logging
- Generates a JSON report of all transactions
- Handles errors gracefully and continues processing

## Setup

### 1. Add Business Wallet Token

Add your HandCash Business Wallet auth token to your `.env.local` file:

```bash
HANDCASH_BUSINESS_WALLET_TOKEN=your_business_wallet_token_here
```

You can get this token from your HandCash Developer Dashboard.

### 2. Create a Handles File

Create a text file with one handle per line (without @ or $ prefix):

```
alice
bob
charlie
dave
eve
```

See `handles-example.txt` for an example.

## Usage

Run the script with:

```bash
npm run bulk-payment <path-to-handles-file>
```

### Examples

```bash
# Using the example file
npm run bulk-payment handles-example.txt

# Using an absolute path
npm run bulk-payment C:\Users\You\Desktop\handles.txt

# Using a relative path
npm run bulk-payment ./my-handles.txt
```

## Output

The script will:

1. Load and validate handles from the file
2. Validate your auth token
3. Check your balance
4. Process payments in batches of 10
5. Display progress for each payment
6. Generate a summary report
7. Save a detailed JSON report to `payment-report-[timestamp].json`

### Example Output

```
=== HandCash Bulk Payment Script ===
Amount per payment: $0.0001
Batch size: 10
Currency: USD

Loaded 50 handles from file

Validating auth token...
Auth token is valid ✓

Current USD balance: $100.50
Total required: $0.0050

Processing 5 batches...

--- Batch 1/5 ---
Processing 10 payments...
  → Sending $0.0001 to alice...
  ✓ Success! TX: abc123...
  → Sending $0.0001 to bob...
  ✓ Success! TX: def456...
  ...

=== Payment Report ===
Total payments: 50
Successful: 48
Failed: 2
Total sent: $0.0048

Failed payments:
  - invalidhandle: User not found
  - suspended: Account suspended

Detailed report saved to: payment-report-1737800000000.json
```

## Configuration

You can modify these values in `scripts/bulk-payment.ts`:

- `BATCH_SIZE`: Number of payments to process at once (default: 10)
- `AMOUNT`: Amount to send per payment (default: 0.0001)
- `CURRENCY`: Currency code (default: 'USD')

## Error Handling

The script handles errors gracefully:

- If a payment fails, it logs the error and continues with the next one
- All results (success and failure) are saved to the report
- The script will warn you if your balance is insufficient but will still attempt payments

## Security Notes

- Never commit your `.env.local` file with your business wallet token
- Keep your handles file secure if it contains sensitive information
- Review the handles file before running to avoid accidental payments
- Start with a small test file to verify everything works correctly

## Troubleshooting

### "Invalid auth token"
- Check that your `HANDCASH_BUSINESS_WALLET_TOKEN` is correctly set in `.env.local`
- Verify the token is valid and hasn't expired

### "File not found"
- Check the path to your handles file
- Use absolute paths if relative paths aren't working

### "Insufficient balance"
- Add more funds to your HandCash business wallet
- Reduce the number of handles or the payment amount

### Rate limiting errors
- Increase the delay between batches (modify the `sleep(2000)` value)
- Reduce the `BATCH_SIZE`
