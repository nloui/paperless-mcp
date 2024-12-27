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
      matching_algorithm: z
        .enum(['any', 'all', 'exact', 'regular expression', 'fuzzy'])
        .optional()
    }),
    execute: async args => {
      if (!api) throw new Error('Please configure API connection first')
      return api.createTag(args)
    }
  })
}
