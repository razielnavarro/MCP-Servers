# Supermarket MCP Servers

This project contains two specialized MCP (Model Context Protocol) servers for a supermarket system, designed to work with OpenAI agents and Cloudflare Workers.

## Architecture Overview

The original monolithic MCP server has been separated into two specialized servers:

### 🏪 Inventory Management MCP Server (`inventory-mcp-server/`)

- **Purpose**: Manages product catalog and stock levels
- **Database**: Separate D1 database for inventory data
- **Tools**: Item CRUD operations, stock management, search and filtering
- **Use Case**: Inventory management agents, stock monitoring, product catalog management

### 🛒 Cart Management MCP Server (`cart-mcp-server/`)

- **Purpose**: Manages user shopping carts
- **Database**: Separate D1 database for cart data
- **Tools**: Cart operations, bulk item management, cart analytics
- **Use Case**: Shopping assistant agents, checkout process, cart management

## Benefits of Separation

### 1. **Agent Specialization**

- **Inventory Agent**: Focuses solely on stock management, product catalog, and inventory operations
- **Cart Agent**: Focuses on user shopping experience, cart management, and checkout process

### 2. **Scalability**

- Each server can be scaled independently based on load
- Inventory operations (typically admin-focused) can have different scaling needs than cart operations (user-focused)

### 3. **Maintenance & Development**

- Changes to cart logic don't affect inventory logic and vice versa
- Each server can be developed, tested, and deployed independently
- Easier to assign different teams to different domains

### 4. **Security & Access Control**

- Different access patterns for inventory vs cart operations
- Inventory operations might require admin privileges
- Cart operations are user-specific

### 5. **Performance**

- Smaller, focused servers with specific tool sets
- Reduced memory footprint per server
- Better caching strategies for different data types

## Project Structure

```
MCP-Servers/
├── inventory-mcp-server/          # Inventory management server
│   ├── src/
│   │   ├── entities/             # Database entities
│   │   ├── schemas/              # Zod validation schemas
│   │   ├── tools.ts              # MCP tools implementation
│   │   └── index.ts              # Server entry point
│   ├── package.json
│   ├── wrangler.jsonc
│   └── README.md
├── cart-mcp-server/              # Cart management server
│   ├── src/
│   │   ├── entities/             # Database entities
│   │   ├── schemas/              # Zod validation schemas
│   │   ├── tools.ts              # MCP tools implementation
│   │   └── index.ts              # Server entry point
│   ├── package.json
│   ├── wrangler.jsonc
│   └── README.md
└── my-mcp-server/                # Original monolithic server (for reference)
```

## Setup Instructions

### Prerequisites

- Node.js 18+
- Cloudflare account with D1 databases
- Wrangler CLI

### 1. Set up Inventory Server

```bash
cd inventory-mcp-server
npm install
# Configure wrangler.jsonc with your D1 database ID
npm run db:generate
npm run db:migrate
npm run deploy
```

### 2. Set up Cart Server

```bash
cd cart-mcp-server
npm install
# Configure wrangler.jsonc with your D1 database ID
npm run db:generate
npm run db:migrate
npm run deploy
```

## Usage with OpenAI Agents

### Inventory Agent Example

```typescript
// Agent specialized for inventory management
const inventoryAgent = new Agent({
  name: "Inventory Manager",
  tools: [
    // Connect to inventory-mcp-server
    { name: "listItems", description: "List all inventory items" },
    { name: "updateStock", description: "Update item stock levels" },
    { name: "getLowStockItems", description: "Get items with low stock" },
    // ... other inventory tools
  ],
});
```

### Cart Agent Example

```typescript
// Agent specialized for cart management
const cartAgent = new Agent({
  name: "Shopping Assistant",
  tools: [
    // Connect to cart-mcp-server
    { name: "addToCart", description: "Add item to user cart" },
    { name: "viewCart", description: "View user's cart contents" },
    { name: "checkout", description: "Process checkout" },
    // ... other cart tools
  ],
});
```

## Agent Handoff Scenarios

### Scenario 1: Stock Check During Shopping

1. **Cart Agent** receives request to add item to cart
2. **Cart Agent** hands off to **Inventory Agent** to check stock availability
3. **Inventory Agent** confirms stock and returns to **Cart Agent**
4. **Cart Agent** proceeds with cart operation

### Scenario 2: Low Stock Alert

1. **Inventory Agent** detects low stock items
2. **Inventory Agent** hands off to **Cart Agent** to notify users with items in cart
3. **Cart Agent** notifies affected users about stock issues

### Scenario 3: Checkout Process

1. **Cart Agent** handles cart review and checkout initiation
2. **Cart Agent** hands off to **Inventory Agent** for final stock verification
3. **Inventory Agent** reserves stock and returns confirmation
4. **Cart Agent** completes checkout and clears cart

## Migration from Monolithic Server

The original `my-mcp-server` contains the combined functionality. To migrate:

1. **Data Migration**: Export data from original server and import to appropriate new servers
2. **Tool Mapping**: Map original tools to new specialized servers
3. **Agent Updates**: Update agent configurations to use new server endpoints
4. **Testing**: Verify all functionality works with separated servers

## Development

### Adding New Features

- **Inventory Features**: Add to `inventory-mcp-server/src/tools.ts`
- **Cart Features**: Add to `cart-mcp-server/src/tools.ts`
- **Shared Features**: Consider creating a shared library or third server

### Testing

Each server can be tested independently:

```bash
# Test inventory server
cd inventory-mcp-server
npm run dev

# Test cart server
cd cart-mcp-server
npm run dev
```

## Contributing

1. Follow the established architecture pattern
2. Add appropriate schemas for new tools
3. Update README files with new functionality
4. Test both servers independently
5. Consider impact on agent handoff scenarios

## License

This project is licensed under the MIT License.
# MCP-Servers
