import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { z } from "zod";

export function registerStoragePathTools(server: McpServer, api) {
  server.tool(
    "list_storage_paths",
    "Retrieve all available storage paths for organizing documents into folder hierarchies. Storage paths define where documents are stored and can use template variables like {{correspondent}}, {{document_type}}, {{created_year}}, etc.",
    {},
    async (args, extra) => {
      if (!api) throw new Error("Please configure API connection first");
      return api.getStoragePaths();
    }
  );

  server.tool(
    "create_storage_path",
    "Create a new storage path for organizing documents into folder structures. Storage paths support template variables for dynamic organization based on document metadata.",
    {
      name: z.string().describe("Display name for the storage path (e.g., 'Invoices by Year', 'Contracts by Vendor'). This name appears in the document detail view."),
      path: z.string().describe("Folder path template using Paperless variables. Available variables: {{correspondent}}, {{document_type}}, {{created}}, {{created_year}}, {{created_month}}, {{created_day}}, {{added}}, {{added_year}}, {{added_month}}, {{added_day}}, {{asn}}, {{tags}}, {{tag_list}}, {{owner_username}}. Example: '{{created_year}}/{{correspondent}}/{{document_type}}'"),
      match: z.string().optional().describe("Text pattern to automatically assign this storage path to matching documents. Use keywords that appear in documents that should use this path."),
      matching_algorithm: z.number().int().min(0).max(4).optional().describe("How to match text patterns: 0=any word, 1=all words, 2=exact phrase, 3=regular expression, 4=fuzzy matching. Default is 0 (any word)."),
    },
    async (args, extra) => {
      if (!api) throw new Error("Please configure API connection first");
      return api.createStoragePath(args);
    }
  );

  server.tool(
    "update_storage_path",
    "Modify an existing storage path's name, path template, or matching rules. Changes to path template will affect where NEW documents are stored; existing documents are not automatically moved.",
    {
      id: z.number().describe("ID of the storage path to update. Use list_storage_paths to find existing storage path IDs."),
      name: z.string().optional().describe("New display name for the storage path. Leave empty to keep current name."),
      path: z.string().optional().describe("New folder path template. Changes only affect newly assigned documents, not existing ones."),
      match: z.string().optional().describe("Text pattern for automatic assignment. Empty string removes auto-matching."),
      matching_algorithm: z.number().int().min(0).max(4).optional().describe("Algorithm for pattern matching: 0=any word, 1=all words, 2=exact phrase, 3=regular expression, 4=fuzzy matching."),
    },
    async (args, extra) => {
      if (!api) throw new Error("Please configure API connection first");
      const { id, ...data } = args;
      return api.updateStoragePath(id, data);
    }
  );

  server.tool(
    "delete_storage_path",
    "Permanently delete a storage path from the system. Documents using this path will have their storage_path set to null but will NOT be moved or deleted. Use with caution.",
    {
      id: z.number().describe("ID of the storage path to permanently delete. Documents using this path will lose their storage path assignment but files remain intact. Use list_storage_paths to find storage path IDs."),
    },
    async (args, extra) => {
      if (!api) throw new Error("Please configure API connection first");
      return api.deleteStoragePath(args.id);
    }
  );

  server.tool(
    "bulk_edit_storage_paths",
    "Perform bulk operations on multiple storage paths: set permissions to control who can assign them to documents, or permanently delete multiple storage paths. Use with caution as deletion affects document organization.",
    {
      storage_path_ids: z.array(z.number()).describe("Array of storage path IDs to perform bulk operations on. Use list_storage_paths to get valid IDs."),
      operation: z.enum(["set_permissions", "delete"]).describe("Bulk operation: 'set_permissions' to control who can assign these storage paths, 'delete' to permanently remove them from the system."),
      owner: z.number().optional().describe("User ID to set as owner when operation is 'set_permissions'. The owner has full control over these storage paths."),
      permissions: z
        .object({
          view: z.object({
            users: z.array(z.number()).optional().describe("User IDs who can see and assign these storage paths to documents"),
            groups: z.array(z.number()).optional().describe("Group IDs who can see and assign these storage paths to documents"),
          }).describe("Users and groups with permission to view and use these storage paths"),
          change: z.object({
            users: z.array(z.number()).optional().describe("User IDs who can modify storage path settings (name, path template, matching rules)"),
            groups: z.array(z.number()).optional().describe("Group IDs who can modify storage path settings"),
          }).describe("Users and groups with permission to edit these storage path configurations"),
        })
        .optional().describe("Permission settings when operation is 'set_permissions'. Defines who can view/assign and modify these storage paths."),
      merge: z.boolean().optional().describe("Whether to merge with existing permissions (true) or replace them entirely (false). Default is false."),
    },
    async (args, extra) => {
      if (!api) throw new Error("Please configure API connection first");
      return api.bulkEditObjects(
        args.storage_path_ids,
        "storage_paths",
        args.operation,
        args.operation === "set_permissions"
          ? {
              owner: args.owner,
              permissions: args.permissions,
              merge: args.merge,
            }
          : {}
      );
    }
  );
}
