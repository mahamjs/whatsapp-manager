const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

export const apiUrl = (path: string) => `${API_BASE_URL}${path}`
