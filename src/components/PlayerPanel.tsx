import { PlayerState } from '../core/types';
import { HpBar } from './HpBar';

interface PlayerPanelProps {
  label: string;
  teamName: string;
  player: PlayerState;
  maxHp: number;
}

export const PlayerPanel = ({ label, teamName, player, maxHp }: PlayerPanelProps) => (
  <article className="player-card">
    <p className="eyebrow">{label}</p>
    <h2>{teamName}</h2>
    <HpBar hp={player.hp} maxHp={maxHp} />
    <strong>{player.hp} / {maxHp} Energy</strong>
    <p>Charge: {player.chargeCount}</p>
  </article>
);
