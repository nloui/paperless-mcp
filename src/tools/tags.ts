import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { CallToolResult } from "@modelcontextprotocol/sdk/types";
import { z } from "zod";
import { PaperlessAPI } from "../api/PaperlessAPI";
import { buildQueryString } from "./queryString";

export function registerTagTools(server: McpServer, api: PaperlessAPI) {
  server.tool(
    "list_tags",
    "List all tags",
    {
      page: z.number().optional(),
      page_size: z.number().optional(),
      name__icontains: z.string().optional(),
      name__iendswith: z.string().optional(),
      name__iexact: z.string().optional(),
      name__istartswith: z.string().optional(),
      ordering: z.string().optional(),
    },
    async (args = {}): Promise<CallToolResult> => {
      if (!api) throw new Error("Please configure API connection first");
      const queryString = buildQueryString(args);
      const tagsResponse = await api.request(
        `/tags/${queryString ? `?${queryString}` : ""}`
      );
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(tagsResponse),
          },
        ],
      };
    }
  );

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
      const tag = await api.createTag(args);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(tag),
          },
        ],
      };
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
      const tag = await api.updateTag(args.id, args);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(tag),
          },
        ],
      };
    }
  );

  server.tool(
    "delete_tag",
    {
      id: z.number(),
    },
    async (args, extra) => {
      if (!api) throw new Error("Please configure API connection first");
      await api.deleteTag(args.id);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ status: "deleted" }),
          },
        ],
      };
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
