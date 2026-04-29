export default function Logo({ className = '', size = 'md' }) {
  const sizes = {
    sm: { icon: 32, title: 'text-lg', sub: 'text-xs' },
    md: { icon: 44, title: 'text-2xl', sub: 'text-sm' },
    lg: { icon: 64, title: 'text-4xl', sub: 'text-base' },
  }
  const s = sizes[size] || sizes.md

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Ícone estilizado (5 figuras coloridas inspirado no PDF) */}
      <svg
        width={s.icon}
        height={s.icon}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="32" cy="14" r="6" fill="#FB8B24" />
        <circle cx="14" cy="26" r="6" fill="#1C3BD7" />
        <circle cx="50" cy="26" r="6" fill="#7B2FBE" />
        <circle cx="20" cy="48" r="6" fill="#E91E63" />
        <circle cx="44" cy="48" r="6" fill="#2E7D32" />
      </svg>
      <div>
        <div className={`font-display font-bold text-alfa-blue leading-none ${s.title}`}>
          AGEBROKERS
        </div>
        <div className={`font-display text-alfa-orange leading-none mt-0.5 ${s.sub}`}>
          AGELegacy
        </div>
      </div>
    </div>
  )
}
