import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { z } from "zod";

export function registerCustomFieldTools(server: McpServer, api) {
  server.tool(
    "list_custom_fields",
    "Retrieve all available custom fields for storing additional document metadata. Returns field definitions including name, data type, and configuration options. Custom fields enable storing structured data like invoice numbers, amounts, dates, or links to external systems.",
    {},
    async (args, extra) => {
      if (!api) throw new Error("Please configure API connection first");
      return api.getCustomFields();
    }
  );

  server.tool(
    "create_custom_field",
    "Create a new custom field for storing additional document metadata. Custom fields can store various data types including text, numbers, dates, booleans, URLs, monetary values, document links, and selection lists. Useful for integrating with external systems or tracking domain-specific information.",
    {
      name: z.string().describe("Unique name for the custom field (e.g., 'Invoice Number', 'Amount Due', 'External ID'). This name appears in the document detail view."),
      data_type: z.enum([
        "string",
        "url",
        "date",
        "boolean",
        "integer",
        "float",
        "monetary",
        "documentlink",
        "select"
      ]).describe("Data type for the field: 'string' (text), 'url' (web link), 'date' (ISO date), 'boolean' (true/false), 'integer' (whole number), 'float' (decimal number), 'monetary' (currency value with 2 decimals), 'documentlink' (reference to another document), 'select' (dropdown with predefined options)."),
      extra_data: z.object({
        select_options: z.array(z.string()).optional().describe("Options for 'select' type fields. Each string becomes a dropdown option."),
        default_currency: z.string().optional().describe("Default currency code for 'monetary' type fields (e.g., 'USD', 'EUR')."),
      }).optional().describe("Additional configuration depending on data_type. Required for 'select' type (provide select_options). Optional for 'monetary' type (provide default_currency)."),
    },
    async (args, extra) => {
      if (!api) throw new Error("Please configure API connection first");
      return api.createCustomField(args);
    }
  );

  server.tool(
    "update_custom_field",
    "Modify an existing custom field's name or configuration. Note: Changing data_type may cause data loss for existing values. Use with caution on fields that already have document values.",
    {
      id: z.number().describe("ID of the custom field to update. Use list_custom_fields to find existing field IDs."),
      name: z.string().optional().describe("New name for the custom field. Leave empty to keep current name."),
      extra_data: z.object({
        select_options: z.array(z.string()).optional().describe("Updated options for 'select' type fields. This replaces all existing options."),
        default_currency: z.string().optional().describe("Updated default currency for 'monetary' type fields."),
      }).optional().describe("Updated configuration for the field. Only applicable fields will be modified."),
    },
    async (args, extra) => {
      if (!api) throw new Error("Please configure API connection first");
      const { id, ...data } = args;
      return api.updateCustomField(id, data);
    }
  );

  server.tool(
    "delete_custom_field",
    "Permanently delete a custom field from the system. This removes the field definition AND all values stored in this field across all documents. Use with extreme caution as this action cannot be undone.",
    {
      id: z.number().describe("ID of the custom field to permanently delete. WARNING: This will delete the field and ALL its values from every document. Use list_custom_fields to find field IDs."),
    },
    async (args, extra) => {
      if (!api) throw new Error("Please configure API connection first");
      return api.deleteCustomField(args.id);
    }
  );
}
