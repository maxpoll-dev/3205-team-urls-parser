const PREFIX_URL = '/api'

export interface ApiErrorBody {
  statusCode: number
  message: string | string[]
  error: string
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: ApiErrorBody | null,
  ) {
    super(`HTTP ${status}`)
    this.name = 'ApiError'
  }

  get messages(): string[] {
    const message = this.body?.message

    if (Array.isArray(message)) return message
    if (typeof message === 'string') return [message]

    return []
  }
}

export async function http<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${PREFIX_URL}${url}`, {
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  })

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as ApiErrorBody | null
    throw new ApiError(res.status, body)
  }

  if (res.status === 204) {
    return undefined as T
  }

  return (await res.json()) as Promise<T>
}
