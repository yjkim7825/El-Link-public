import { useRef, useState, type DragEvent } from 'react'
import { cn } from '@/lib/cn'
import { formatNumber } from '@/lib/formatters'

interface DropZoneProps {
  file: File | null
  onFile: (file: File | null) => void
  accept?: string
  /** 최대 바이트(초과 시 onError). */
  maxBytes?: number
  onError?: (message: string) => void
  hint?: string
}

/** legacy .drop-zone — 2px 점선, dragover 시 브랜드 컬러 + 옅은 블루 배경, 파일명 표시. */
export function DropZone({ file, onFile, accept, maxBytes, onError, hint }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragover, setDragover] = useState(false)

  function accepted(f: File | undefined | null) {
    if (!f) return
    if (maxBytes && f.size > maxBytes) {
      onError?.(`파일이 너무 큽니다. 최대 ${formatNumber(Math.round(maxBytes / 1024 / 1024))}MB까지 가능합니다.`)
      return
    }
    onFile(f)
  }

  function onDrop(e: DragEvent) {
    e.preventDefault()
    setDragover(false)
    accepted(e.dataTransfer.files?.[0])
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault()
        setDragover(true)
      }}
      onDragLeave={() => setDragover(false)}
      onDrop={onDrop}
      className={cn(
        'flex min-h-[120px] cursor-pointer flex-col items-center justify-center gap-2 rounded-[10px] border-2 border-dashed px-5 py-6 text-center transition-colors',
        dragover ? 'border-brand-500 bg-tint' : 'border-ink-200 bg-white hover:border-brand-300',
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => accepted(e.target.files?.[0])}
      />
      {file ? (
        <>
          <span className="text-3xl text-brand-500">✓</span>
          <span className="break-all text-sm font-semibold text-brand-600">{file.name}</span>
          <span className="text-xs text-ink-500">{formatNumber(Math.round(file.size / 1024))} KB · 클릭하여 변경</span>
        </>
      ) : (
        <>
          <span className="text-4xl text-ink-400">☁️</span>
          <span className="text-[15px] font-medium text-ink-600">
            파일을 드래그하거나 클릭하여 업로드
          </span>
          {hint && <span className="text-xs text-ink-400">{hint}</span>}
        </>
      )}
    </div>
  )
}
