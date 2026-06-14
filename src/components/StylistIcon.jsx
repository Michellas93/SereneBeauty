export default function StylistIcon({ specialty, size = 28 }) {
  const s = specialty?.toLowerCase() || '';

  if (s.includes('barv')) return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 5 C20 5 7 13 7 24 C7 31.18 12.82 37 20 37 C27.18 37 33 31.18 33 24 C33 13 20 5 20 5Z"/>
      <path d="M13 27 C13 27 13 32 20 32"/>
    </svg>
  );

  if (s.includes('majitel')) return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 5 L23.5 15 L34 15 L25.5 21.5 L28.5 32 L20 26 L11.5 32 L14.5 21.5 L6 15 L16.5 15 Z"/>
    </svg>
  );

  if (s.includes('mistr')) return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13" cy="29" r="5"/>
      <circle cx="13" cy="11" r="5"/>
      <line x1="17.5" y1="14.5" x2="36" y2="33"/>
      <line x1="17.5" y1="25.5" x2="36" y2="7"/>
    </svg>
  );

  if (s.includes('stylistka')) return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="13" width="20" height="13" rx="4"/>
      <path d="M25 18.5 L35 18.5"/>
      <path d="M13 26 L13 35"/>
      <path d="M9 10 L11 13"/>
      <path d="M15 9 L15 13"/>
      <path d="M21 10 L19 13"/>
    </svg>
  );

  if (s.includes('stylista')) return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="9" width="30" height="8" rx="2"/>
      <line x1="9" y1="17" x2="9" y2="25"/>
      <line x1="14" y1="17" x2="14" y2="29"/>
      <line x1="20" y1="17" x2="20" y2="25"/>
      <line x1="26" y1="17" x2="26" y2="29"/>
      <line x1="31" y1="17" x2="31" y2="25"/>
    </svg>
  );

  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="20" cy="14" r="7"/>
      <path d="M6 36 C6 28.268 12.268 22 20 22 C27.732 22 34 28.268 34 36"/>
    </svg>
  );
}
