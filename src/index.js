#!/usr/bin/env node
import { LiteMCP } from 'litemcp'
import { PaperlessAPI } from './api/PaperlessAPI.js'
import { registerDocumentTools } from './tools/documents.js'
import { registerTagTools } from './tools/tags.js'
import { registerCorrespondentTools } from './tools/correspondents.js'
import { registerDocumentTypeTools } from './tools/documentTypes.js'

// Parse command line arguments
const args = process.argv.slice(2)
const baseUrl = args[0]
const token = args[1]

if (!baseUrl || !token) {
  console.error('Usage: paperless-mcp <baseUrl> <token>')
  console.error('Example: paperless-mcp http://localhost:8000 your-api-token')
  process.exit(1)
}

// Initialize API client
const api = new PaperlessAPI(baseUrl, token)

// Initialize server
const server = new LiteMCP('paperless-ngx', '1.0.0')

// Register all tools
registerDocumentTools(server, api)
registerTagTools(server, api)
registerCorrespondentTools(server, api)
registerDocumentTypeTools(server, api)

// Start server
server.start()
