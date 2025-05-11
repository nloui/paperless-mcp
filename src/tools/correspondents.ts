import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { z } from "zod";

export function registerCorrespondentTools(server: McpServer, api) {
  server.tool("list_correspondents", {}, async (args, extra) => {
    if (!api) throw new Error("Please configure API connection first");
    return api.getCorrespondents();
  });

  server.tool(
    "create_correspondent",
    {
      name: z.string(),
      match: z.string().optional(),
      matching_algorithm: z
        .enum(["any", "all", "exact", "regular expression", "fuzzy"])
        .optional(),
    },
    async (args, extra) => {
      if (!api) throw new Error("Please configure API connection first");
      return api.createCorrespondent(args);
    }
  );

  server.tool(
    "bulk_edit_correspondents",
    {
      correspondent_ids: z.array(z.number()),
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
        args.correspondent_ids,
        "correspondents",
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
