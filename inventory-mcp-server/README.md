# Inventory Management MCP Server

A specialized MCP (Model Context Protocol) server for managing supermarket inventory operations.

## Features

- **Item Management**: Create, read, update, and delete inventory items
- **Stock Management**: Update stock levels and track low stock items
- **Search & Filter**: Search items by name and filter by category
- **Sorting**: Sort items by price, name, or creation date

## Available Tools

### Item Management

- `listItems` - List all items with optional filtering and sorting
- `getItem` - Get details of a specific item
- `createItem` - Create a new inventory item
- `updateItem` - Update item details
- `deleteItem` - Remove an item from inventory

### Stock Management

- `updateStock` - Update stock quantity for an item
- `getLowStockItems` - Get items with stock below threshold

### Search & Discovery

- `searchItems` - Search items by name

## Database Schema

The server uses a single `items` table with the following structure:

- `id` (Primary Key) - Unique item identifier
- `name` - Item name
- `price` - Item price in cents
- `stock` - Current stock quantity
- `category` - Item category (optional)
- `description` - Item description (optional)
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

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

This MCP server is designed to be used with OpenAI agents for inventory management tasks. It provides a clean separation of concerns for inventory operations, allowing agents to focus specifically on stock management without being concerned with cart operations.

## Architecture

The server follows a clean architecture pattern:

- **Entities**: Database table definitions
- **Schemas**: Zod validation schemas
- **Tools**: MCP tool implementations
- **Index**: Main server entry point

This separation allows for easy testing, maintenance, and extension of functionality.
