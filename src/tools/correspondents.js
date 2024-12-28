import { z } from 'zod'

export function registerCorrespondentTools(server, api) {
  server.addTool({
    name: 'list_correspondents',
    description: 'List all correspondents',
    parameters: z.object({}),
    execute: async () => {
      if (!api) throw new Error('Please configure API connection first')
      return api.getCorrespondents()
    }
  })

  server.addTool({
    name: 'create_correspondent',
    description: 'Create a new correspondent',
    parameters: z.object({
      name: z.string(),
      match: z.string().optional(),
      matching_algorithm: z
        .enum(['any', 'all', 'exact', 'regular expression', 'fuzzy'])
        .optional()
    }),
    execute: async args => {
      if (!api) throw new Error('Please configure API connection first')
      return api.createCorrespondent(args)
    }
  })

  server.addTool({
    name: 'bulk_edit_correspondents',
    description: 'Bulk edit correspondents (set permissions or delete)',
    parameters: z.object({
      correspondent_ids: z.array(z.number()),
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
        args.correspondent_ids,
        'correspondents',
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
