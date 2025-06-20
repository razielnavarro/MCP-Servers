import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerTools } from "./tools";

interface Env {
  DB: D1Database;
}

export class CartMCP extends McpAgent<Env> {
  server = new McpServer({
    name: "Cart Management MCP",
    version: "1.0.0",
  });

  async init() {
    registerTools(this.server, this.env);
  }
}
