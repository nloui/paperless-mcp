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
}
