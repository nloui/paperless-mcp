import { z } from "zod";

export function registerDocumentTools(server, api) {
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
    {
      page: z.number().optional(),
      page_size: z.number().optional(),
    },
    async (args, extra) => {
      if (!api) throw new Error("Please configure API connection first");
      const query = new URLSearchParams();
      if (args.page) query.set("page", args.page);
      if (args.page_size) query.set("page_size", args.page_size);
      return api.getDocuments(query.toString() ? `?${query.toString()}` : "");
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
    {
      query: z.string(),
    },
    async (args, extra) => {
      if (!api) throw new Error("Please configure API connection first");
      return api.searchDocuments(args.query);
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
      return {
        blob: Buffer.from(await response.arrayBuffer()).toString("base64"),
        filename:
          response.headers
            .get("content-disposition")
            ?.split("filename=")[1]
            ?.replace(/"/g, "") || `document-${args.id}`,
      };
    }
  );
}
