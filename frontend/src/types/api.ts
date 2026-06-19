/** 백엔드 공통 응답 envelope { success, data, error } 미러. */
export interface ApiError {
  code: string
  message: string
  fields?: Record<string, string> | null
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  error: ApiError | null
}
