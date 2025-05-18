import { ToolCallback } from "@modelcontextprotocol/sdk/server/mcp";
import { ZodRawShape } from "zod";

export const errorMiddleware = <Args extends ZodRawShape>(
  cb: ToolCallback<Args>
): ToolCallback<Args> => {
  return (async (args, extra) => {
    try {
      return await cb(args, extra);
    } catch (err) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: err instanceof Error ? err.message : String(err),
            }),
          },
        ],
      };
    }
  }) as ToolCallback<Args>;
};
