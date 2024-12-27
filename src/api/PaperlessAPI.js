export class PaperlessAPI {
  constructor(baseUrl, token) {
    this.baseUrl = baseUrl
    this.token = token
  }

  async request(path, options = {}) {
    const url = `${this.baseUrl}/api${path}`
    const headers = {
      Authorization: `Token ${this.token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return response.json()
  }

  // Document operations
  async bulkEditDocuments(documents, method, parameters = {}) {
    return this.request('/documents/bulk_edit/', {
      method: 'POST',
      body: JSON.stringify({
        documents,
        method,
        parameters
      })
    })
  }

  async postDocument(file, metadata = {}) {
    const formData = new FormData()
    formData.append('document', file)

    // Add optional metadata fields
    if (metadata.title) formData.append('title', metadata.title)
    if (metadata.created) formData.append('created', metadata.created)
    if (metadata.correspondent)
      formData.append('correspondent', metadata.correspondent)
    if (metadata.document_type)
      formData.append('document_type', metadata.document_type)
    if (metadata.storage_path)
      formData.append('storage_path', metadata.storage_path)
    if (metadata.tags) {
      metadata.tags.forEach(tag => formData.append('tags', tag))
    }
    if (metadata.archive_serial_number) {
      formData.append('archive_serial_number', metadata.archive_serial_number)
    }
    if (metadata.custom_fields) {
      metadata.custom_fields.forEach(field =>
        formData.append('custom_fields', field)
      )
    }

    const response = await fetch(
      `${this.baseUrl}/api/documents/post_document/`,
      {
        method: 'POST',
        headers: {
          Authorization: `Token ${this.token}`
        },
        body: formData
      }
    )

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return response.json()
  }

  async getDocuments(query = '') {
    return this.request(`/documents/${query}`)
  }

  async getDocument(id) {
    return this.request(`/documents/${id}/`)
  }

  async searchDocuments(query) {
    return this.request(`/documents/?query=${encodeURIComponent(query)}`)
  }

  async downloadDocument(id, asOriginal = false) {
    const query = asOriginal ? '?original=true' : ''
    const response = await fetch(
      `${this.baseUrl}/api/documents/${id}/download/${query}`,
      {
        headers: {
          Authorization: `Token ${this.token}`
        }
      }
    )
    return response
  }

  // Tag operations
  async getTags() {
    return this.request('/tags/')
  }

  async createTag(data) {
    return this.request('/tags/', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  // Correspondent operations
  async getCorrespondents() {
    return this.request('/correspondents/')
  }

  async createCorrespondent(data) {
    return this.request('/correspondents/', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  // Document type operations
  async getDocumentTypes() {
    return this.request('/document_types/')
  }

  async createDocumentType(data) {
    return this.request('/document_types/', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }
}
