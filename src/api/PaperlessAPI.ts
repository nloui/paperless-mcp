/**
 * Normalize the Paperless base URL so that API paths can be appended safely.
 * Trailing slashes are removed: "https://host/" -> "https://host",
 * "https://host/paperless//" -> "https://host/paperless".
 * A base URL with a trailing slash would otherwise produce requests like
 * "https://host//api/documents/", which reverse proxies and auth layers
 * (e.g. Cloudflare Access) may route differently and answer with an HTML
 * page instead of JSON.
 */
export function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.trim().replace(/\/+$/, "");
}

/**
 * Parse a fetch Response as JSON, but fail with a descriptive error when the
 * server did not answer with JSON (for example an HTML login page from a
 * reverse proxy). Without this check callers only see
 * "Unexpected token '<'" and cannot tell what went wrong.
 */
export async function parseJsonResponse(response: Response, url: string) {
  const contentType = response.headers.get("content-type") ?? "";
  const text = await response.text();

  // e.g. 204 No Content after DELETE
  if (response.status === 204 || text.trim() === "") {
    return null;
  }

  if (!contentType.toLowerCase().includes("json")) {
    const titleMatch = text.match(/<title>([^<]*)<\/title>/i);
    const hint = titleMatch
      ? ` (page title: "${titleMatch[1].trim()}")`
      : "";
    throw new Error(
      `Non-JSON response from ${url}: HTTP ${response.status}, ` +
        `content-type "${contentType || "unknown"}"${hint}. ` +
        "Check the Paperless base URL and that the request is not being " +
        "intercepted by a proxy or login page."
    );
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(
      `Invalid JSON response from ${url}: HTTP ${response.status}: ${text.slice(0, 200)}`
    );
  }
}

export class PaperlessAPI {
  private readonly baseUrl: string;
  private readonly token: string;

  constructor(baseUrl: string, token: string) {
    this.baseUrl = normalizeBaseUrl(baseUrl);
    this.token = token;
  }

  async request(path: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}/api${path}`;
    const headers = {
      Authorization: `Token ${this.token}`,
      Accept: "application/json; version=5",
      "Content-Type": "application/json",
      "Accept-Language": "en-US,en;q=0.9",
    };

    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const body = await response.text();
      console.error({
        error: "Error executing request",
        url,
        options,
        status: response.status,
        response: body.slice(0, 500),
      });
      throw new Error(
        `HTTP error! status: ${response.status} for ${url}: ${body.slice(0, 200)}`
      );
    }

    return parseJsonResponse(response, url);
  }

  // Document operations
  async bulkEditDocuments(documents, method, parameters = {}) {
    return this.request("/documents/bulk_edit/", {
      method: "POST",
      body: JSON.stringify({
        documents,
        method,
        parameters,
      }),
    });
  }

  async postDocument(
    file: File,
    metadata: Record<string, string | string[]> = {}
  ) {
    const formData = new FormData();
    formData.append("document", file);

    // Add optional metadata fields
    if (metadata.title) formData.append("title", metadata.title);
    if (metadata.created) formData.append("created", metadata.created);
    if (metadata.correspondent)
      formData.append("correspondent", metadata.correspondent);
    if (metadata.document_type)
      formData.append("document_type", metadata.document_type);
    if (metadata.storage_path)
      formData.append("storage_path", metadata.storage_path);
    if (metadata.tags) {
      (metadata.tags as string[]).forEach((tag) =>
        formData.append("tags", tag)
      );
    }
    if (metadata.archive_serial_number) {
      formData.append("archive_serial_number", metadata.archive_serial_number);
    }
    if (metadata.custom_fields) {
      (metadata.custom_fields as string[]).forEach((field) =>
        formData.append("custom_fields", field)
      );
    }

    const response = await fetch(
      `${this.baseUrl}/api/documents/post_document/`,
      {
        method: "POST",
        headers: {
          Authorization: `Token ${this.token}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async getDocuments(query = "") {
    return this.request(`/documents/${query}`);
  }

  async getDocument(id) {
    return this.request(`/documents/${id}/`);
  }

  async searchDocuments(query, page?, pageSize?) {
    const params = new URLSearchParams();
    params.set("query", query);
    if (page) params.set("page", page.toString());
    if (pageSize) params.set("page_size", pageSize.toString());
    
    const response: any = await this.request(`/documents/?${params.toString()}`);
    
    // Filter out content field and long URLs to reduce token usage
    if (response.results) {
      response.results = response.results.map((doc: any) => {
        const { content, download_url, thumbnail_url, ...rest } = doc;
        return {
          ...rest,
          // Include only document ID for constructing URLs if needed
          id: doc.id,
        };
      });
    }
    
    return response;
  }

  async downloadDocument(id, asOriginal = false) {
    const query = asOriginal ? "?original=true" : "";
    const response = await fetch(
      `${this.baseUrl}/api/documents/${id}/download/${query}`,
      {
        headers: {
          Authorization: `Token ${this.token}`,
        },
      }
    );
    return response;
  }

  // Tag operations
  async getTags() {
    return this.request("/tags/");
  }

  async createTag(data) {
    return this.request("/tags/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateTag(id, data) {
    return this.request(`/tags/${id}/`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteTag(id) {
    return this.request(`/tags/${id}/`, {
      method: "DELETE",
    });
  }

  // Correspondent operations
  async getCorrespondents() {
    return this.request("/correspondents/");
  }

  async createCorrespondent(data) {
    return this.request("/correspondents/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Document type operations
  async getDocumentTypes() {
    return this.request("/document_types/");
  }

  async createDocumentType(data) {
    return this.request("/document_types/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Bulk object operations
  async bulkEditObjects(objects, objectType, operation, parameters = {}) {
    return this.request("/bulk_edit_objects/", {
      method: "POST",
      body: JSON.stringify({
        objects,
        object_type: objectType,
        operation,
        ...parameters,
      }),
    });
  }
}
