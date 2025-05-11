import { z } from "zod";

export function registerTagTools(server, api) {
  server.tool("list_tags", {}, async (args, extra) => {
    if (!api) throw new Error("Please configure API connection first");
    return api.getTags();
  });

  server.tool(
    "create_tag",
    {
      name: z.string(),
      color: z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/)
        .optional(),
      match: z.string().optional(),
      matching_algorithm: z.number().int().min(0).max(4).optional(),
    },
    async (args, extra) => {
      if (!api) throw new Error("Please configure API connection first");
      return api.createTag(args);
    }
  );

  server.tool(
    "update_tag",
    {
      id: z.number(),
      name: z.string(),
      color: z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/)
        .optional(),
      match: z.string().optional(),
      matching_algorithm: z.number().int().min(0).max(4).optional(),
    },
    async (args, extra) => {
      if (!api) throw new Error("Please configure API connection first");
      return api.updateTag(args.id, args);
    }
  );

  server.tool(
    "delete_tag",
    {
      id: z.number(),
    },
    async (args, extra) => {
      if (!api) throw new Error("Please configure API connection first");
      return api.deleteTag(args.id);
    }
  );

  server.tool(
    "bulk_edit_tags",
    {
      tag_ids: z.array(z.number()),
      operation: z.enum(["set_permissions", "delete"]),
      owner: z.number().optional(),
      permissions: z
        .object({
          view: z.object({
            users: z.array(z.number()).optional(),
            groups: z.array(z.number()).optional(),
          }),
          change: z.object({
            users: z.array(z.number()).optional(),
            groups: z.array(z.number()).optional(),
          }),
        })
        .optional(),
      merge: z.boolean().optional(),
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
