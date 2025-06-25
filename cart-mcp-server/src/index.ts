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
    registerTools(this.server, this.env, this.props);
  }
}

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);

    const userId = request.headers.get("X-User-ID");

    if (userId) {
      ctx.props = {
        userId: userId,
      };
    }
    if (url.pathname === "/sse" || url.pathname === "/sse/message") {
      return CartMCP.serveSSE("/sse").fetch(request, env, ctx);
    }

    if (url.pathname === "/mcp") {
      return CartMCP.serve("/mcp").fetch(request, env, ctx);
    }

    return new Response("Not found", { status: 404 });
  },
};
