import { LoadingLogo } from "./loading-logo"

export function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] space-y-4">
      <LoadingLogo />
      <div className="w-full max-w-xs mx-auto">
        <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-violet-500 to-blue-600 rounded-full animate-shimmer bg-[length:200%_auto]" />
      </div>
    </div>
  )
} 