import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { PaperlessAPI } from "./api/PaperlessAPI";
import { registerCorrespondentTools } from "./tools/correspondents";
import { registerDocumentTools } from "./tools/documents";
import { registerDocumentTypeTools } from "./tools/documentTypes";
import { registerTagTools } from "./tools/tags";

async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const baseUrl = args[0];
  const token = args[1];

  if (!baseUrl || !token) {
    console.error("Usage: paperless-mcp <baseUrl> <token>");
    console.error(
      "Example: paperless-mcp http://localhost:8000 your-api-token"
    );
    process.exit(1);
  }

  // Initialize API client
  const api = new PaperlessAPI(baseUrl, token);

  // Initialize server
  const server = new McpServer({ name: "paperless-ngx", version: "1.0.0" });

  // Register all tools
  registerDocumentTools(server, api);
  registerTagTools(server, api);
  registerCorrespondentTools(server, api);
  registerDocumentTypeTools(server, api);

  // Start server with stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((e) => console.error(e.message));
