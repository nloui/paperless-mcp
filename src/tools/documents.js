import { z } from 'zod'

export function registerDocumentTools(server, api) {
  server.addTool({
    name: 'bulk_edit_documents',
    description: 'Perform bulk operations on documents',
    parameters: z.object({
      documents: z.array(z.number()),
      method: z.enum([
        'set_correspondent',
        'set_document_type',
        'set_storage_path',
        'add_tag',
        'remove_tag',
        'modify_tags',
        'delete',
        'reprocess',
        'set_permissions',
        'merge',
        'split',
        'rotate',
        'delete_pages'
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
                groups: z.array(z.number())
              }),
              change: z.object({
                users: z.array(z.number()),
                groups: z.array(z.number())
              })
            })
            .optional(),
          merge: z.boolean().optional()
        })
        .optional(),
      metadata_document_id: z.number().optional(),
      delete_originals: z.boolean().optional(),
      pages: z.string().optional(),
      degrees: z.number().optional()
    }),
    execute: async args => {
      if (!api) throw new Error('Please configure API connection first')
      const { documents, method, ...parameters } = args
      return api.bulkEditDocuments(documents, method, parameters)
    }
  })

  server.addTool({
    name: 'post_document',
    description: 'Upload a new document to Paperless-NGX',
    parameters: z.object({
      file: z.string(),
      filename: z.string(),
      title: z.string().optional(),
      created: z.string().optional(),
      correspondent: z.number().optional(),
      document_type: z.number().optional(),
      storage_path: z.number().optional(),
      tags: z.array(z.number()).optional(),
      archive_serial_number: z.string().optional(),
      custom_fields: z.array(z.number()).optional()
    }),
    execute: async args => {
      if (!api) throw new Error('Please configure API connection first')
      const binaryData = Buffer.from(args.file, 'base64')
      const blob = new Blob([binaryData])
      const file = new File([blob], args.filename)
      const { file: _, filename: __, ...metadata } = args
      return api.postDocument(file, metadata)
    }
  })

  server.addTool({
    name: 'list_documents',
    description: 'List all documents',
    parameters: z.object({
      page: z.number().optional(),
      page_size: z.number().optional()
    }),
    execute: async args => {
      if (!api) throw new Error('Please configure API connection first')
      const query = new URLSearchParams()
      if (args.page) query.set('page', args.page)
      if (args.page_size) query.set('page_size', args.page_size)
      return api.getDocuments(query.toString() ? `?${query.toString()}` : '')
    }
  })

  server.addTool({
    name: 'get_document',
    description: 'Get a specific document by ID',
    parameters: z.object({
      id: z.number()
    }),
    execute: async args => {
      if (!api) throw new Error('Please configure API connection first')
      return api.getDocument(args.id)
    }
  })

  server.addTool({
    name: 'search_documents',
    description: 'Search documents using full-text query',
    parameters: z.object({
      query: z.string()
    }),
    execute: async args => {
      if (!api) throw new Error('Please configure API connection first')
      return api.searchDocuments(args.query)
    }
  })

  server.addTool({
    name: 'download_document',
    description: 'Download a document by ID',
    parameters: z.object({
      id: z.number(),
      original: z.boolean().optional()
    }),
    execute: async args => {
      if (!api) throw new Error('Please configure API connection first')
      const response = await api.downloadDocument(args.id, args.original)
      return {
        blob: Buffer.from(await response.arrayBuffer()).toString('base64'),
        filename:
          response.headers
            .get('content-disposition')
            ?.split('filename=')[1]
            ?.replace(/"/g, '') || `document-${args.id}`
      }
    }
  })
}
