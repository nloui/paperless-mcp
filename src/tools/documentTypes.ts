import { z } from "zod";

export function registerDocumentTypeTools(server, api) {
  server.tool("list_document_types", {}, async (args, extra) => {
    if (!api) throw new Error("Please configure API connection first");
    return api.getDocumentTypes();
  });

  server.tool(
    "create_document_type",
    {
      name: z.string(),
      match: z.string().optional(),
      matching_algorithm: z
        .enum(["any", "all", "exact", "regular expression", "fuzzy"])
        .optional(),
    },
    async (args, extra) => {
      if (!api) throw new Error("Please configure API connection first");
      return api.createDocumentType(args);
    }
  );

  server.tool(
    "bulk_edit_document_types",
    {
      document_type_ids: z.array(z.number()),
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
        args.document_type_ids,
        "document_types",
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
