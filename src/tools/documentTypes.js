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
}
