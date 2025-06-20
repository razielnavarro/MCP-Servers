# Cart Management MCP Server

A specialized MCP (Model Context Protocol) server for managing user shopping cart operations.

## Features

- **Cart Operations**: Add, remove, and update items in user carts
- **Bulk Operations**: Add or remove multiple items at once
- **Cart Management**: View cart contents and clear entire carts
- **Cart Analytics**: Get cart statistics and item counts

## Available Tools

### Cart Operations

- `addToCart` - Add an item to a user's cart
- `removeFromCart` - Remove an item from a user's cart
- `updateCartItem` - Update quantity of an item in cart
- `viewCart` - View all items in a user's cart
- `clearCart` - Remove all items from a user's cart

### Bulk Operations

- `addMultipleToCart` - Add multiple items to cart at once
- `removeMultipleFromCart` - Remove multiple items from cart at once

### Cart Analytics

- `getCartItemCount` - Get total items and unique items in cart

## Database Schema

The server uses a single `carts` table with the following structure:

- `userId` - User identifier
- `itemId` - Item identifier (references inventory items)
- `quantity` - Quantity of the item in cart
- `addedAt` - When the item was first added to cart
- `updatedAt` - When the item was last updated in cart

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Configure your Cloudflare D1 database in `wrangler.jsonc`

3. Generate and apply database migrations:

   ```bash
   npm run db:generate
   npm run db:migrate
   ```

4. Deploy to Cloudflare Workers:
   ```bash
   npm run deploy
   ```

## Usage

This MCP server is designed to be used with OpenAI agents for shopping cart management tasks. It provides a clean separation of concerns for cart operations, allowing agents to focus specifically on user shopping experience without being concerned with inventory management.

## Architecture

The server follows a clean architecture pattern:

- **Entities**: Database table definitions
- **Schemas**: Zod validation schemas
- **Tools**: MCP tool implementations
- **Index**: Main server entry point

This separation allows for easy testing, maintenance, and extension of functionality.

## Integration with Inventory Server

This cart server works in conjunction with the Inventory MCP Server. The cart server manages user shopping carts while the inventory server manages the actual product catalog and stock levels. This separation allows for:

- **Scalability**: Each server can be scaled independently
- **Specialization**: Each agent can focus on its specific domain
- **Maintenance**: Changes to cart logic don't affect inventory logic and vice versa
- **Testing**: Each server can be tested in isolation
