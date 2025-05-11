import { z } from 'zod'

export function registerTagTools(server, api) {
  server.addTool({
    name: 'list_tags',
    description: 'List all tags',
    parameters: z.object({}),
    execute: async () => {
      if (!api) throw new Error('Please configure API connection first')
      return api.getTags()
    }
  })

  server.addTool({
    name: 'create_tag',
    description: 'Create a new tag',
    parameters: z.object({
      name: z.string(),
      color: z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/)
        .optional(),
      match: z.string().optional(),
      matching_algorithm: z.number().int().min(0).max(4).optional()
    }),
    execute: async args => {
      if (!api) throw new Error('Please configure API connection first')
      return api.createTag(args)
    }
  })

  server.addTool({
    name: 'update_tag',
    description: 'Update an existing tag',
    parameters: z.object({
      id: z.number(),
      name: z.string(),
      color: z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/)
        .optional(),
      match: z.string().optional(),
      matching_algorithm: z.number().int().min(0).max(4).optional()
    }),
    execute: async args => {
      if (!api) throw new Error('Please configure API connection first')
      return api.updateTag(args.id, args)
    }
  })

  server.addTool({
    name: 'delete_tag',
    description: 'Delete a tag',
    parameters: z.object({
      id: z.number()
    }),
    execute: async args => {
      if (!api) throw new Error('Please configure API connection first')
      return api.deleteTag(args.id)
    }
  })

  server.addTool({
    name: 'bulk_edit_tags',
    description: 'Bulk edit tags (set permissions or delete)',
    parameters: z.object({
      tag_ids: z.array(z.number()),
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
        args.tag_ids,
        'tags',
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
