import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { CallToolResult } from "@modelcontextprotocol/sdk/types";
import { z } from "zod";
import { PaperlessAPI } from "../api/PaperlessAPI";
import { DocumentsResponse } from "../api/types";

export function registerDocumentTools(server: McpServer, api: PaperlessAPI) {
  server.tool(
    "bulk_edit_documents",
    {
      documents: z.array(z.number()),
      method: z.enum([
        "set_correspondent",
        "set_document_type",
        "set_storage_path",
        "add_tag",
        "remove_tag",
        "modify_tags",
        "delete",
        "reprocess",
        "set_permissions",
        "merge",
        "split",
        "rotate",
        "delete_pages",
      ]),
      correspondent: z.number().optional(),
      document_type: z.number().optional(),
      storage_path: z.number().optional(),
      tag: z.number().optional(),
      add_tags: z.array(z.number()).optional(),
      remove_tags: z.array(z.number()).optional(),
      permissions: z
        .object({
          owner: z.number().nullable().optional(),
          set_permissions: z
            .object({
              view: z.object({
                users: z.array(z.number()),
                groups: z.array(z.number()),
              }),
              change: z.object({
                users: z.array(z.number()),
                groups: z.array(z.number()),
              }),
            })
            .optional(),
          merge: z.boolean().optional(),
        })
        .optional(),
      metadata_document_id: z.number().optional(),
      delete_originals: z.boolean().optional(),
      pages: z.string().optional(),
      degrees: z.number().optional(),
    },
    async (args, extra) => {
      if (!api) throw new Error("Please configure API connection first");
      const { documents, method, ...parameters } = args;
      return api.bulkEditDocuments(documents, method, parameters);
    }
  );

  server.tool(
    "post_document",
    {
      file: z.string(),
      filename: z.string(),
      title: z.string().optional(),
      created: z.string().optional(),
      correspondent: z.number().optional(),
      document_type: z.number().optional(),
      storage_path: z.number().optional(),
      tags: z.array(z.number()).optional(),
      archive_serial_number: z.string().optional(),
      custom_fields: z.array(z.number()).optional(),
    },
    async (args, extra) => {
      if (!api) throw new Error("Please configure API connection first");
      const binaryData = Buffer.from(args.file, "base64");
      const blob = new Blob([binaryData]);
      const file = new File([blob], args.filename);
      const { file: _, filename: __, ...metadata } = args;
      return api.postDocument(file, metadata);
    }
  );

  server.tool(
    "list_documents",
    "List and filter documents by fields such as title, correspondent, document type, tag, storage path, creation date, and more. IMPORTANT: For queries like 'the last 3 contributions' or when searching by tag, correspondent, document type, or storage path, you should FIRST use the relevant tool (e.g., 'list_tags', 'list_correspondents', 'list_document_types', 'list_storage_paths') to find the correct ID, and then use that ID as a filter here. Only use the 'search' argument for free-text search when no specific field applies. Using the correct ID filter will yield much more accurate results.",
    {
      page: z.number().optional(),
      page_size: z.number().optional(),
      search: z.string().optional(),
      correspondent: z.number().optional(),
      document_type: z.number().optional(),
      tag: z.number().optional(),
      storage_path: z.number().optional(),
      created__gte: z.string().optional(),
      created__lte: z.string().optional(),
      ordering: z.string().optional(),
    },
    async (args, extra) => {
      if (!api) throw new Error("Please configure API connection first");
      const query = new URLSearchParams();
      if (args.page) query.set("page", args.page.toString());
      if (args.page_size) query.set("page_size", args.page_size.toString());
      if (args.search) query.set("search", args.search);
      if (args.correspondent)
        query.set("correspondent__id", args.correspondent.toString());
      if (args.document_type)
        query.set("document_type__id", args.document_type.toString());
      if (args.tag) query.set("tags__id", args.tag.toString());
      if (args.storage_path)
        query.set("storage_path__id", args.storage_path.toString());
      if (args.created__gte) query.set("created__gte", args.created__gte);
      if (args.created__lte) query.set("created__lte", args.created__lte);
      if (args.ordering) query.set("ordering", args.ordering);

      const docsResponse = await api.getDocuments(
        query.toString() ? `?${query.toString()}` : ""
      );
      return convertDocsWithTags(docsResponse, api);
    }
  );

  server.tool(
    "get_document",
    {
      id: z.number(),
    },
    async (args, extra) => {
      if (!api) throw new Error("Please configure API connection first");
      return api.getDocument(args.id);
    }
  );

  server.tool(
    "search_documents",
    "Full text search for documents. This tool is for searching document content, title, and metadata using a full text query. For general document listing or filtering by fields, use 'list_documents' instead.",
    {
      query: z.string(),
    },
    async (args, extra) => {
      if (!api) throw new Error("Please configure API connection first");
      const docsResponse = await api.searchDocuments(args.query);
      return convertDocsWithTags(docsResponse, api);
    }
  );

  server.tool(
    "download_document",
    {
      id: z.number(),
      original: z.boolean().optional(),
    },
    async (args, extra) => {
      if (!api) throw new Error("Please configure API connection first");
      const response = await api.downloadDocument(args.id, args.original);
      const filename =
        (typeof response.headers.get === "function"
          ? response.headers.get("content-disposition")
          : response.headers["content-disposition"]
        )
          ?.split("filename=")[1]
          ?.replace(/"/g, "") || `document-${args.id}`;
      return {
        content: [
          {
            type: "resource",
            resource: {
              uri: filename,
              blob: Buffer.from(response.data).toString("base64"),
              mimeType: "application/pdf",
            },
          },
        ],
      };
    }
  );
}

async function convertDocsWithTags(
  docsResponse: DocumentsResponse,
  api: PaperlessAPI
): Promise<CallToolResult> {
  const docs = docsResponse.results.map(
    ({
      id,
      title,
      correspondent,
      document_type,
      created,
      created_date,
      tags,
    }) => ({
      id,
      title,
      correspondent,
      document_type,
      created,
      created_date,
      tags,
    })
  );
  if (!docs?.length) {
    return {
      content: [
        {
          type: "text",
          text: "No documents found",
        },
      ],
    };
  }

  const tagsResponse = await api.getTags();
  const tagMap = new Map(tagsResponse.results.map((tag) => [tag.id, tag.name]));
  const docsWithTags = docs.map((doc) => ({
    ...doc,
    tags: Array.isArray(doc.tags)
      ? doc.tags.map((tagId) => ({
          id: tagId,
          name: tagMap.get(tagId) || String(tagId),
        }))
      : doc.tags,
  }));
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(docsWithTags),
      },
    ],
  };
}
