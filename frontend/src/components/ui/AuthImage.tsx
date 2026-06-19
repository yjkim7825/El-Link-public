import { useEffect, useState, type ReactNode } from 'react'
import { api } from '@/api/client'

interface AuthImageProps {
  /** 이미지 API 경로(인증 필요). null이면 fallback 렌더. */
  src: string | null | undefined
  alt?: string
  className?: string
  /** 로드 실패/미지정 시 보여줄 대체 노드(예: 카테고리 placeholder). */
  fallback?: ReactNode
}

/**
 * 토큰이 메모리에만 있어 <img src="/api/..."> 로는 인증이 안 되므로,
 * axios(인터셉터 Bearer)로 blob을 받아 object URL로 렌더한다. 실패 시 fallback.
 */
export function AuthImage({ src, alt, className, fallback }: AuthImageProps) {
  const [url, setUrl] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!src) {
      setFailed(true)
      return
    }
    let active = true
    let obj: string | null = null
    setFailed(false)
    setUrl(null)
    api
      .get(src, { responseType: 'blob' })
      .then((res) => {
        if (!active) return
        obj = URL.createObjectURL(res.data as Blob)
        setUrl(obj)
      })
      .catch(() => {
        if (active) setFailed(true)
      })
    return () => {
      active = false
      if (obj) URL.revokeObjectURL(obj)
    }
  }, [src])

  if (!src || failed) return <>{fallback ?? null}</>
  if (!url) return <div className={`animate-pulse bg-ink-100 ${className ?? ''}`} />
  return <img src={url} alt={alt} className={className} />
}
