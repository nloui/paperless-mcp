import { z } from "zod";

export function registerTagTools(server, api) {
  server.tool(
    "list_tags",
    "Retrieve all available tags for labeling and organizing documents. Returns tag names, colors, and matching rules for automatic assignment.",
    {
    // No parameters - returns all available tags
  },
  {
    title: "List Tags",
    readOnlyHint: true,
  },
  async (args, extra) => {
    if (!api) throw new Error("Please configure API connection first");
    return api.getTags();
  });

  server.tool(
    "create_tag",
    "Create a new tag for labeling and organizing documents. Tags can have colors for visual identification and automatic matching rules for smart assignment.",
    {
      name: z.string().describe("Tag name for labeling and organizing documents (e.g., 'important', 'taxes', 'receipts'). Must be unique and descriptive."),
      color: z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/)
        .optional().describe("Hex color code for visual identification (e.g., '#FF0000' for red, '#00FF00' for green). If not provided, Paperless assigns a random color."),
      match: z.string().optional().describe("Text pattern to automatically assign this tag to matching documents. Use keywords, phrases, or regular expressions depending on matching_algorithm."),
      matching_algorithm: z.number().int().min(0).max(4).optional().describe("How to match text patterns: 0=any word, 1=all words, 2=exact phrase, 3=regular expression, 4=fuzzy matching. Default is 0 (any word)."),
    },
    {
      title: "Create Tag",
      destructiveHint: true,
    },
    async (args, extra) => {
      if (!api) throw new Error("Please configure API connection first");
      return api.createTag(args);
    }
  );

  server.tool(
    "update_tag",
    "Modify an existing tag's name, color, or automatic matching rules. Useful for refining tag organization and improving automatic document classification.",
    {
      id: z.number().describe("ID of the tag to update. Use list_tags to find existing tag IDs."),
      name: z.string().describe("New tag name. Must be unique among all tags."),
      color: z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/)
        .optional().describe("New hex color code for visual identification (e.g., '#FF0000' for red). Leave empty to keep current color."),
      match: z.string().optional().describe("Text pattern for automatic tag assignment. Empty string removes auto-matching. Use keywords, phrases, or regex depending on matching_algorithm."),
      matching_algorithm: z.number().int().min(0).max(4).optional().describe("Algorithm for pattern matching: 0=any word, 1=all words, 2=exact phrase, 3=regular expression, 4=fuzzy matching."),
    },
    {
      title: "Update Tag",
      destructiveHint: true,
    },
    async (args, extra) => {
      if (!api) throw new Error("Please configure API connection first");
      return api.updateTag(args.id, args);
    }
  );

  server.tool(
    "delete_tag",
    "Permanently delete a tag from the system. This removes the tag from all documents that currently use it. Use with caution as this action cannot be undone.",
    {
      id: z.number().describe("ID of the tag to permanently delete. This will remove the tag from all documents that currently use it. Use list_tags to find tag IDs."),
    },
    {
      title: "Delete Tag",
      destructiveHint: true,
    },
    async (args, extra) => {
      if (!api) throw new Error("Please configure API connection first");
      return api.deleteTag(args.id);
    }
  );

  server.tool(
    "bulk_edit_tags",
    "Perform bulk operations on multiple tags: set permissions to control access or permanently delete multiple tags at once. Efficient for managing large tag collections.",
    {
      tag_ids: z.array(z.number()).describe("Array of tag IDs to perform bulk operations on. Use list_tags to get valid tag IDs."),
      operation: z.enum(["set_permissions", "delete"]).describe("Bulk operation: 'set_permissions' to control who can use these tags, 'delete' to permanently remove all specified tags from the system."),
      owner: z.number().optional().describe("User ID to set as owner when operation is 'set_permissions'. Owner has full control over the tags."),
      permissions: z
        .object({
          view: z.object({
            users: z.array(z.number()).optional().describe("User IDs who can see and use these tags"),
            groups: z.array(z.number()).optional().describe("Group IDs who can see and use these tags"),
          }).describe("Users and groups with view/use permissions for these tags"),
          change: z.object({
            users: z.array(z.number()).optional().describe("User IDs who can modify these tags (name, color, matching rules)"),
            groups: z.array(z.number()).optional().describe("Group IDs who can modify these tags"),
          }).describe("Users and groups with edit permissions for these tags"),
        })
        .optional().describe("Permission settings when operation is 'set_permissions'. Defines who can view/use and modify these tags."),
      merge: z.boolean().optional().describe("Whether to merge with existing permissions (true) or replace them entirely (false). Default is false."),
    },
    {
      title: "Bulk Edit Tags",
      destructiveHint: true,
    },
    async (args, extra) => {
      if (!api) throw new Error("Please configure API connection first");
      return api.bulkEditObjects(
        args.tag_ids,
        "tags",
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
