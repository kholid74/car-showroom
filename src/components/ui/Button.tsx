import { type ButtonHTMLAttributes, type ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md'

const VARIANT: Record<Variant, string> = {
  // aksen hanya untuk satu aksi primer per area
  primary: 'bg-accent text-white hover:bg-accent-hover active:bg-accent-hover disabled:bg-accent/40',
  secondary: 'bg-panel text-ink border border-hairline-strong hover:bg-sunken active:bg-sunken-2 disabled:text-ink-3',
  ghost: 'bg-transparent text-ink-2 hover:bg-sunken hover:text-ink active:bg-sunken-2',
  danger: 'bg-danger text-white hover:brightness-95 active:brightness-90',
}

const SIZE: Record<Size, string> = {
  sm: 'h-8 px-3 text-2xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
}

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  ikon?: ReactNode
}

export function Button({ variant = 'secondary', size = 'md', ikon, className = '', children, ...rest }: Props) {
  return (
    <button
      {...rest}
      className={[
        'inline-flex items-center justify-center rounded-control font-medium tracking-wide',
        'transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)]',
        'disabled:cursor-not-allowed disabled:opacity-70',
        VARIANT[variant],
        SIZE[size],
        className,
      ].join(' ')}
    >
      {ikon}
      {children}
    </button>
  )
}
