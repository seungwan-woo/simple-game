import { MatchMode } from '../core/matchSimulator';

interface MatchControlsProps {
  matchMode: MatchMode;
  isFinished: boolean;
  onSelectMode: (mode: MatchMode) => void;
  onStart: () => void;
  onStep: () => void;
  onRunFull: () => void;
  onReset: () => void;
}

const modeLabels: Record<MatchMode, string> = {
  FIXED_TURN_REMAINING_HP: '기본 7턴: 남은 에너지 승리',
  UNTIL_ZERO_HP_WITH_TURN_CAP: 'KO 반복: 0 에너지까지, 최대 30턴',
  ENDURANCE_30_TURNS_REMAINING_HP: '30턴 장기전: 남은 에너지 승리',
};

export const MatchControls = ({
  matchMode,
  isFinished,
  onSelectMode,
  onStart,
  onStep,
  onRunFull,
  onReset,
}: MatchControlsProps) => (
  <section className="controls panel">
    <div className="control-grid match-mode-grid">
      <label>
        Match Mode
        <select value={matchMode} onChange={(event) => onSelectMode(event.target.value as MatchMode)}>
          {Object.entries(modeLabels).map(([mode, label]) => (
            <option key={mode} value={mode}>{label}</option>
          ))}
        </select>
      </label>
    </div>
    <div className="actions">
      <button onClick={onStart}>Start Match</button>
      <button onClick={onStep} disabled={isFinished}>Next Turn</button>
      <button onClick={onRunFull} disabled={isFinished}>Run Full Match</button>
      <button onClick={onReset}>Reset</button>
    </div>
  </section>
);
