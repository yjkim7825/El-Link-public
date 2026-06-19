/** 백엔드 auth DTO 미러. */
export type Role = 'ADMIN' | 'PARTNER'

/** UserSummary: 역할에 따라 일부 필드만 채워진다(ADMIN: name / PARTNER: companyName, contactName). */
export interface UserSummary {
  id: number
  role: Role
  name?: string | null
  companyName?: string | null
  contactName?: string | null
}

export interface LoginResponse {
  accessToken: string
  tokenType: string
  expiresIn: number
  mustChangePassword: boolean
  user: UserSummary
}

export interface RefreshResponse {
  accessToken: string
  tokenType: string
  expiresIn: number
}

export interface LoginRequest {
  email: string
  password: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}
