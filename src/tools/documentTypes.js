import { z } from 'zod'

export function registerDocumentTypeTools(server, api) {
  server.addTool({
    name: 'list_document_types',
    description: 'List all document types',
    parameters: z.object({}),
    execute: async () => {
      if (!api) throw new Error('Please configure API connection first')
      return api.getDocumentTypes()
    }
  })

  server.addTool({
    name: 'create_document_type',
    description: 'Create a new document type',
    parameters: z.object({
      name: z.string(),
      match: z.string().optional(),
      matching_algorithm: z
        .enum(['any', 'all', 'exact', 'regular expression', 'fuzzy'])
        .optional()
    }),
    execute: async args => {
      if (!api) throw new Error('Please configure API connection first')
      return api.createDocumentType(args)
    }
  })

  server.addTool({
    name: 'bulk_edit_document_types',
    description: 'Bulk edit document types (set permissions or delete)',
    parameters: z.object({
      document_type_ids: z.array(z.number()),
      operation: z.enum(['set_permissions', 'delete']),
      owner: z.number().optional(),
      permissions: z
        .object({
          view: z.object({
            users: z.array(z.number()).optional(),
            groups: z.array(z.number()).optional()
          }),
          change: z.object({
            users: z.array(z.number()).optional(),
            groups: z.array(z.number()).optional()
          })
        })
        .optional(),
      merge: z.boolean().optional()
    }),
    execute: async args => {
      if (!api) throw new Error('Please configure API connection first')
      return api.bulkEditObjects(
        args.document_type_ids,
        'document_types',
        args.operation,
        args.operation === 'set_permissions'
          ? {
              owner: args.owner,
              permissions: args.permissions,
              merge: args.merge
            }
          : {}
      )
    }
  })
}
