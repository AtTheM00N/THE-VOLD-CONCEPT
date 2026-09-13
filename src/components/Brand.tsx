export function Bolt({ className = '' }: { className?: string }) {
  return <svg className={className} width="28" height="28" viewBox="0 0 40 40" fill="currentColor" aria-hidden="true"><path d="M22 1 5 23h13l-2 16 19-24H22z" /></svg>
}

export function Brand({ className = '' }: { className?: string }) {
  return <span className={`wordmark ${className}`} aria-label="VOLD">V<span className="wordmark-o">O<Bolt /></span>LD<span className="wordmark-reg">®</span></span>
}

export function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={diagonal ? { transform: 'rotate(-45deg)' } : undefined}><path d="M4 12h15M13 5l7 7-7 7" stroke="currentColor" strokeWidth="1.6" /></svg>
}
