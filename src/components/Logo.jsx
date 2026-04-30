export default function Logo({ className = '', size = 'md' }) {
  const sizes = {
    sm: { height: 32, sub: 'text-xs' },
    md: { height: 44, sub: 'text-sm' },
    lg: { height: 64, sub: 'text-base' },
  }
  const s = sizes[size] || sizes.md

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img
        src="/agebrokers-logo.png"
        alt="AgeBrokers"
        style={{ height: s.height, width: 'auto' }}
      />
      <div className={`font-display text-alfa-orange leading-none ${s.sub}`}>
        New Generation
      </div>
    </div>
  )
}
