import logoRipipsaPng from './logo.png';

export function Logo({ size = 32, className = '' }) {
  return <img src={logoRipipsaPng} alt="Ripipsa" height={size} className={className} style={{ display: 'block' }} />;
}