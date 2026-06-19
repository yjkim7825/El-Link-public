import { useMutation, useQuery } from '@tanstack/react-query'
import { changePartnerPassword, getMyInfo } from '@/api/partnerAccount'
import type { ChangePasswordRequest } from '@/types/partnerAccount'

/** 내 정보. queryKey: ['partner-me']. */
export function useMyInfo() {
  return useQuery({
    queryKey: ['partner-me'],
    queryFn: getMyInfo,
  })
}

/** 비밀번호 변경. */
export function useChangePassword() {
  return useMutation({
    mutationFn: (req: ChangePasswordRequest) => changePartnerPassword(req),
  })
}
