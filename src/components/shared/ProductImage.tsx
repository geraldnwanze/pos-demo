import { cn } from '@/lib/utils'

const COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-violet-100 text-violet-700',
  'bg-cyan-100 text-cyan-700',
  'bg-orange-100 text-orange-700',
]

function hash(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0
  return h
}

interface ProductImageProps {
  name: string
  image?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const SIZES = {
  sm: 'h-9 w-9 text-lg rounded-md',
  md: 'h-11 w-11 text-xl rounded-md',
  lg: 'h-16 w-16 text-3xl rounded-lg',
  xl: 'h-28 w-28 text-6xl rounded-xl',
}

export function ProductImage({ name, image, size = 'md', className }: ProductImageProps) {
  const color = COLORS[hash(name) % COLORS.length]
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center font-semibold',
        color,
        SIZES[size],
        className,
      )}
      aria-hidden
    >
      {image || name.charAt(0)}
    </div>
  )
}
