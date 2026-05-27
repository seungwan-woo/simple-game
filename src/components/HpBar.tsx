interface HpBarProps {
  hp: number;
  maxHp: number;
}

export const HpBar = ({ hp, maxHp }: HpBarProps) => {
  const percent = Math.max(0, Math.min(100, (hp / maxHp) * 100));

  return (
    <div className="hp-bar" aria-label={`HP ${hp} of ${maxHp}`}>
      <div className="hp-ghost" style={{ width: `${percent}%` }} />
      <div className="hp-current" style={{ width: `${percent}%` }} />
    </div>
  );
};
