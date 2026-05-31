import { PlayerState } from '../core/types';
import { HpBar } from './HpBar';

interface PlayerPanelProps {
  label: string;
  player: PlayerState;
  maxHp: number;
  damageTaken?: number;
  isWinner?: boolean;
}

export const PlayerPanel = ({
  label,
  player,
  maxHp,
  damageTaken = 0,
  isWinner = false,
}: PlayerPanelProps) => (
  <article className={`player-card battle-card ${damageTaken > 0 ? 'hit-shake' : ''} ${isWinner ? 'winner-glow' : ''}`}>
    <p className="eyebrow">Player Status</p>
    <h2>{label}</h2>
    <div className="hp-stage">
      <HpBar hp={player.hp} maxHp={maxHp} />
      {damageTaken > 0 && <span key={`${label}-${player.hp}-${damageTaken}`} className="damage-pop">-{damageTaken}</span>}
    </div>
    <strong>{player.hp} / {maxHp} Energy</strong>
    <p>Charge: {player.chargeCount}</p>
  </article>
);
