import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { z } from "zod";
import { errorMiddleware } from "./utils/middlewares";
import { buildQueryString } from "./utils/queryString";

export function registerCorrespondentTools(server: McpServer, api) {
  server.tool(
    "list_correspondents",
    {
      page: z.number().optional(),
      page_size: z.number().optional(),
      name__icontains: z.string().optional(),
      name__iendswith: z.string().optional(),
      name__iexact: z.string().optional(),
      name__istartswith: z.string().optional(),
      ordering: z.string().optional(),
    },
    errorMiddleware(async (args, extra) => {
      if (!api) throw new Error("Please configure API connection first");
      const queryString = buildQueryString(args);
      const response = await api.request(
        `/correspondents/${queryString ? `?${queryString}` : ""}`
      );
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(response),
          },
        ],
      };
    })
  );

  server.tool(
    "get_correspondent",
    { id: z.number() },
    errorMiddleware(async (args, extra) => {
      if (!api) throw new Error("Please configure API connection first");
      const response = await api.request(`/correspondents/${args.id}/`);
      return {
        content: [{ type: "text", text: JSON.stringify(response) }],
      };
    })
  );

  server.tool(
    "create_correspondent",
    {
      name: z.string(),
      match: z.string().optional(),
      matching_algorithm: z
        .enum(["any", "all", "exact", "regular expression", "fuzzy"])
        .optional(),
    },
    errorMiddleware(async (args, extra) => {
      if (!api) throw new Error("Please configure API connection first");
      const response = await api.createCorrespondent(args);
      return {
        content: [{ type: "text", text: JSON.stringify(response) }],
      };
    })
  );

  server.tool(
    "update_correspondent",
    {
      id: z.number(),
      name: z.string(),
      match: z.string().optional(),
      matching_algorithm: z
        .enum(["any", "all", "exact", "regular expression", "fuzzy"])
        .optional(),
    },
    errorMiddleware(async (args, extra) => {
      if (!api) throw new Error("Please configure API connection first");
      const response = await api.request(`/correspondents/${args.id}/`, {
        method: "PUT",
        body: JSON.stringify(args),
      });
      return {
        content: [{ type: "text", text: JSON.stringify(response) }],
      };
    })
  );

  server.tool(
    "delete_correspondent",
    { id: z.number() },
    errorMiddleware(async (args, extra) => {
      if (!api) throw new Error("Please configure API connection first");
      await api.request(`/correspondents/${args.id}/`, { method: "DELETE" });
      return {
        content: [
          { type: "text", text: JSON.stringify({ status: "deleted" }) },
        ],
      };
    })
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
    errorMiddleware(async (args, extra) => {
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
    })
  );
}
