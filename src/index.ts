import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";
import { PaperlessAPI } from "./api/PaperlessAPI";
import { registerCorrespondentTools } from "./tools/correspondents";
import { registerDocumentTools } from "./tools/documents";
import { registerDocumentTypeTools } from "./tools/documentTypes";
import { registerTagTools } from "./tools/tags";

// Simple CLI argument parsing
const args = process.argv.slice(2);
const useHttp = args.includes("--http");
let port = 3000;
const portIndex = args.indexOf("--port");
if (portIndex !== -1 && args[portIndex + 1]) {
  const parsed = parseInt(args[portIndex + 1], 10);
  if (!isNaN(parsed)) port = parsed;
}

async function main() {
  // Parse command line arguments
  const baseUrl = args[0];
  const token = args[1];

  if (!baseUrl || !token) {
    console.error(
      "Usage: paperless-mcp <baseUrl> <token> [--http] [--port <port>]"
    );
    console.error(
      "Example: paperless-mcp http://localhost:8000 your-api-token --http --port 3000"
    );
    process.exit(1);
  }

  if (useHttp) {
    const app = express();
    app.use(express.json());

    app.post("/mcp", async (req, res) => {
      try {
        // Create new API and server for each request
        const api = new PaperlessAPI(baseUrl, token);
        const server = new McpServer({
          name: "paperless-ngx",
          version: "1.0.0",
        });
        registerDocumentTools(server, api);
        registerTagTools(server, api);
        registerCorrespondentTools(server, api);
        registerDocumentTypeTools(server, api);
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: undefined,
        });
        res.on("close", () => {
          transport.close();
          server.close && server.close();
        });
        await server.connect(transport);
        await transport.handleRequest(req, res, req.body);
      } catch (error) {
        console.error("Error handling MCP request:", error);
        if (!res.headersSent) {
          res.status(500).json({
            jsonrpc: "2.0",
            error: {
              code: -32603,
              message: "Internal server error",
            },
            id: null,
          });
        }
      }
    });

    app.get("/mcp", async (req, res) => {
      res.writeHead(405).end(
        JSON.stringify({
          jsonrpc: "2.0",
          error: {
            code: -32000,
            message: "Method not allowed.",
          },
          id: null,
        })
      );
    });

    app.delete("/mcp", async (req, res) => {
      res.writeHead(405).end(
        JSON.stringify({
          jsonrpc: "2.0",
          error: {
            code: -32000,
            message: "Method not allowed.",
          },
          id: null,
        })
      );
    });

    app.listen(port, () => {
      console.log(
        `MCP Stateless Streamable HTTP Server listening on port ${port}`
      );
    });
  } else {
    // Initialize API client
    const api = new PaperlessAPI(baseUrl, token);
    // Initialize server
    const server = new McpServer({ name: "paperless-ngx", version: "1.0.0" });
    // Register all tools
    registerDocumentTools(server, api);
    registerTagTools(server, api);
    registerCorrespondentTools(server, api);
    registerDocumentTypeTools(server, api);
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.log("MCP server running with stdio transport");
  }
}

main().catch((e) => console.error(e.message));
