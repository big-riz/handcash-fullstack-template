# HandCash Widgets

This folder contains pre-built widget components that demonstrate HandCash API integrations. These are ready-to-use, customizable widgets you can include in your app or use as reference implementations.

## Available Widgets

### `friends-list.tsx`
Displays the user's HandCash friends with avatars and handles.
- **API Used:** `/api/friends`
- **Features:** Fetches and displays friend list with loading states

### `inventory-display.tsx`
Shows the user's digital items/collectibles inventory.
- **API Used:** `/api/inventory`, `/api/items/transfer`
- **Features:** 
  - Display items with images and metadata
  - Transfer items to other users
  - Loading and error states

### `payment-interface.tsx`
Payment form for sending BSV to other HandCash users.
- **API Used:** `/api/payments/send`, `/api/payments/balance`, `/api/payments/rate`
- **Features:**
  - Send payments in BSV or USD
  - Real-time balance display
  - Exchange rate conversion
  - Transaction history

### `item-transfer-dialog.tsx`
Modal dialog for transferring digital items.
- **Features:**
  - Transfer to HandCash handles or Bitcoin addresses
  - Quantity selection
  - Confirmation flow

## How to Use Widgets

1. **Include as-is:** Import and use widgets directly in your authenticated content
2. **Customize:** Copy a widget to your components folder and modify styling/behavior
3. **Reference:** Study widget code to learn HandCash API integration patterns
4. **Remove:** Delete any widgets you don't need from `authenticated-content.tsx`

## Core HandCash Components (DO NOT MODIFY)

These components are in the root `components/` folder and handle authentication:
- `header-bar.tsx` - Top navigation with user menu and logout
- `login-button.tsx` - HandCash OAuth login button
- `user-profile.tsx` - User profile display with login state

**Important:** Keep these core components intact to maintain HandCash authentication functionality.

## HandCash Service Layer

All HandCash API calls go through `lib/handcash-service.ts` which abstracts SDK complexity. Use this service in your custom components to interact with HandCash APIs for profiles, payments, friends, and inventory.
