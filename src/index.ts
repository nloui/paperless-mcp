import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
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
  let baseUrl: string | undefined;
  let token: string | undefined;

  if (useHttp) {
    baseUrl = process.env.PAPERLESS_URL;
    token = process.env.API_KEY;
    if (!baseUrl || !token) {
      console.error(
        "When using --http, PAPERLESS_URL and API_KEY environment variables must be set."
      );
      process.exit(1);
    }
  } else {
    baseUrl = args[0];
    token = args[1];
    if (!baseUrl || !token) {
      console.error(
        "Usage: paperless-mcp <baseUrl> <token> [--http] [--port <port>]"
      );
      console.error(
        "Example: paperless-mcp http://localhost:8000 your-api-token --http --port 3000"
      );
      console.error(
        "When using --http, PAPERLESS_URL and API_KEY environment variables must be set."
      );
      process.exit(1);
    }
  }

  // Initialize API client once; each session gets its own McpServer instance
  // since the SDK's Protocol.connect() rejects a second transport on a server
  // that's already connected to one.
  const api = new PaperlessAPI(baseUrl, token);

  function createServer(): McpServer {
    const server = new McpServer({ name: "paperless-ngx", version: "1.0.0" });
    registerDocumentTools(server, api);
    registerTagTools(server, api);
    registerCorrespondentTools(server, api);
    registerDocumentTypeTools(server, api);
    return server;
  }

  if (useHttp) {
    const app = express();
    app.use(express.json());

    // Store transports for each session
    const sseTransports: Record<string, SSEServerTransport> = {};
    const mcpTransports: Record<string, StreamableHTTPServerTransport> = {};

    app.post("/mcp", async (req, res) => {
      try {
        const sessionId = req.headers["mcp-session-id"] as string | undefined;
        let transport: StreamableHTTPServerTransport;

        if (sessionId && mcpTransports[sessionId]) {
          transport = mcpTransports[sessionId];
        } else if (!sessionId && isInitializeRequest(req.body)) {
          transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: () => randomUUID(),
            onsessioninitialized: (newSessionId) => {
              mcpTransports[newSessionId] = transport;
            },
          });
          transport.onclose = () => {
            if (transport.sessionId) {
              delete mcpTransports[transport.sessionId];
            }
          };
          const server = createServer();
          await server.connect(transport);
        } else {
          res.status(400).json({
            jsonrpc: "2.0",
            error: {
              code: -32000,
              message: "Bad Request: No valid session ID provided",
            },
            id: null,
          });
          return;
        }

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

    const handleSessionRequest = async (
      req: express.Request,
      res: express.Response
    ) => {
      const sessionId = req.headers["mcp-session-id"] as string | undefined;
      if (!sessionId || !mcpTransports[sessionId]) {
        res.status(400).send("Invalid or missing session ID");
        return;
      }
      const transport = mcpTransports[sessionId];
      await transport.handleRequest(req, res);
    };

    app.get("/mcp", handleSessionRequest);
    app.delete("/mcp", handleSessionRequest);

    app.get("/sse", async (req, res) => {
      console.log("SSE request received");
      try {
        const transport = new SSEServerTransport("/messages", res);
        sseTransports[transport.sessionId] = transport;
        res.on("close", () => {
          delete sseTransports[transport.sessionId];
          transport.close();
        });
        const server = createServer();
        await server.connect(transport);
      } catch (error) {
        console.error("Error handling SSE request:", error);
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

    app.post("/messages", async (req, res) => {
      const sessionId = req.query.sessionId as string;
      const transport = sseTransports[sessionId];
      if (transport) {
        await transport.handlePostMessage(req, res, req.body);
      } else {
        res.status(400).send("No transport found for sessionId");
      }
    });

    app.listen(port, () => {
      console.log(
        `MCP Stateful Streamable HTTP Server listening on port ${port}`
      );
    });
  } else {
    const server = createServer();
    const transport = new StdioServerTransport();
    await server.connect(transport);
  }
}

main().catch((e) => console.error(e.message));
