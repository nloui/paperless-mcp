# Paperless-NGX MCP Server

[![smithery badge](https://smithery.ai/badge/@nloui/paperless-mcp)](https://smithery.ai/server/@nloui/paperless-mcp)

An MCP (Model Context Protocol) server for interacting with a Paperless-NGX API server. This server provides tools for managing documents, tags, correspondents, and document types in your Paperless-NGX instance.

## Quick Start

### Installing via Smithery

To install Paperless NGX MCP Server for Claude Desktop automatically via [Smithery](https://smithery.ai/server/@nloui/paperless-mcp):

```bash
npx -y @smithery/cli install @nloui/paperless-mcp --client claude
```

### Manual Installation
1. Install the MCP server:
```bash
npm install -g paperless-mcp
```

2. Add it to your Claude's MCP configuration:

For VSCode extension, edit `~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`:
```json
{
  "mcpServers": {
    "paperless": {
      "command": "npx",
      "args": ["paperless-mcp", "http://your-paperless-instance:8000", "your-api-token"]
    }
  }
}
```

For Claude desktop app, edit `~/Library/Application Support/Claude/claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "paperless": {
      "command": "npx",
      "args": ["paperless-mcp", "http://your-paperless-instance:8000", "your-api-token"]
    }
  }
}
```

3. Get your API token:
   1. Log into your Paperless-NGX instance
   2. Click your username in the top right
   3. Select "My Profile"
   4. Click the circular arrow button to generate a new token

4. Replace the placeholders in your MCP config:
   - `http://your-paperless-instance:8000` with your Paperless-NGX URL
   - `your-api-token` with the token you just generated

That's it! Now you can ask Claude to help you manage your Paperless-NGX documents.

## Example Usage

Here are some things you can ask Claude to do:

- "Show me all documents tagged as 'Invoice'"
- "Search for documents containing 'tax return'"
- "Create a new tag called 'Receipts' with color #FF0000"
- "Download document #123"
- "List all correspondents"
- "Create a new document type called 'Bank Statement'"

## Available Tools

### Document Operations

#### list_documents
Get a paginated list of all documents.

Parameters:
- page (optional): Page number
- page_size (optional): Number of documents per page

```typescript
list_documents({
  page: 1,
  page_size: 25
})
```

#### get_document
Get a specific document by ID.

Parameters:
- id: Document ID

```typescript
get_document({
  id: 123
})
```

#### search_documents
Full-text search across documents.

Parameters:
- query: Search query string

```typescript
search_documents({
  query: "invoice 2024"
})
```

#### download_document
Download a document file by ID.

Parameters:
- id: Document ID
- original (optional): If true, downloads original file instead of archived version

```typescript
download_document({
  id: 123,
  original: false
})
```

#### bulk_edit_documents
Perform bulk operations on multiple documents.

Parameters:
- documents: Array of document IDs
- method: One of:
  - set_correspondent: Set correspondent for documents
  - set_document_type: Set document type for documents
  - set_storage_path: Set storage path for documents
  - add_tag: Add a tag to documents
  - remove_tag: Remove a tag from documents
  - modify_tags: Add and/or remove multiple tags
  - delete: Delete documents
  - reprocess: Reprocess documents
  - set_permissions: Set document permissions
  - merge: Merge multiple documents
  - split: Split a document into multiple documents
  - rotate: Rotate document pages
  - delete_pages: Delete specific pages from a document
- Additional parameters based on method:
  - correspondent: ID for set_correspondent
  - document_type: ID for set_document_type
  - storage_path: ID for set_storage_path
  - tag: ID for add_tag/remove_tag
  - add_tags: Array of tag IDs for modify_tags
  - remove_tags: Array of tag IDs for modify_tags
  - permissions: Object for set_permissions with owner, permissions, merge flag
  - metadata_document_id: ID for merge to specify metadata source
  - delete_originals: Boolean for merge/split
  - pages: String for split "[1,2-3,4,5-7]" or delete_pages "[2,3,4]"
  - degrees: Number for rotate (90, 180, or 270)

Examples:
```typescript
// Add a tag to multiple documents
bulk_edit_documents({
  documents: [1, 2, 3],
  method: "add_tag",
  tag: 5
})

// Set correspondent and document type
bulk_edit_documents({
  documents: [4, 5],
  method: "set_correspondent",
  correspondent: 2
})

// Merge documents
bulk_edit_documents({
  documents: [6, 7, 8],
  method: "merge",
  metadata_document_id: 6,
  delete_originals: true
})

// Split document into parts
bulk_edit_documents({
  documents: [9],
  method: "split",
  pages: "[1-2,3-4,5]"
})

// Modify multiple tags at once
bulk_edit_documents({
  documents: [10, 11],
  method: "modify_tags",
  add_tags: [1, 2],
  remove_tags: [3, 4]
})
```

#### post_document
Upload a new document to Paperless-NGX.

Parameters:
- file: Base64 encoded file content
- filename: Name of the file
- title (optional): Title for the document
- created (optional): DateTime when the document was created (e.g. "2024-01-19" or "2024-01-19 06:15:00+02:00")
- correspondent (optional): ID of a correspondent
- document_type (optional): ID of a document type
- storage_path (optional): ID of a storage path
- tags (optional): Array of tag IDs
- archive_serial_number (optional): Archive serial number
- custom_fields (optional): Array of custom field IDs

```typescript
post_document({
  file: "base64_encoded_content",
  filename: "invoice.pdf",
  title: "January Invoice",
  created: "2024-01-19",
  correspondent: 1,
  document_type: 2,
  tags: [1, 3],
  archive_serial_number: "2024-001"
})
```

### Tag Operations

#### list_tags
Get all tags.

```typescript
list_tags()
```

#### create_tag
Create a new tag.

Parameters:
- name: Tag name
- color (optional): Hex color code (e.g. "#ff0000")
- match (optional): Text pattern to match
- matching_algorithm (optional): One of "any", "all", "exact", "regular expression", "fuzzy"

```typescript
create_tag({
  name: "Invoice",
  color: "#ff0000",
  match: "invoice",
  matching_algorithm: "fuzzy"
})
```

### Correspondent Operations

#### list_correspondents
Get all correspondents.

```typescript
list_correspondents()
```

#### create_correspondent
Create a new correspondent.

Parameters:
- name: Correspondent name
- match (optional): Text pattern to match
- matching_algorithm (optional): One of "any", "all", "exact", "regular expression", "fuzzy"

```typescript
create_correspondent({
  name: "ACME Corp",
  match: "ACME",
  matching_algorithm: "fuzzy"
})
```

### Document Type Operations

#### list_document_types
Get all document types.

```typescript
list_document_types()
```

#### create_document_type
Create a new document type.

Parameters:
- name: Document type name
- match (optional): Text pattern to match
- matching_algorithm (optional): One of "any", "all", "exact", "regular expression", "fuzzy"

```typescript
create_document_type({
  name: "Invoice",
  match: "invoice total amount due",
  matching_algorithm: "any"
})
```

## Error Handling

The server will show clear error messages if:
- The Paperless-NGX URL or API token is incorrect
- The Paperless-NGX server is unreachable
- The requested operation fails
- The provided parameters are invalid

## Development

Want to contribute or modify the server? Here's what you need to know:

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Make your changes to server.js
4. Test locally:
```bash
node server.js http://localhost:8000 your-test-token
```

The server is built with:
- [litemcp](https://github.com/wong2/litemcp): A TypeScript framework for building MCP servers
- [zod](https://github.com/colinhacks/zod): TypeScript-first schema validation

## API Documentation

This MCP server implements endpoints from the Paperless-NGX REST API. For more details about the underlying API, see the [official documentation](https://docs.paperless-ngx.com/api/).
