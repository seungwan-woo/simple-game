import { COMMAND_OPTIONS, SecretEntryPhase, maskSubmittedCommands } from '../core/localCommandEntry';
import { Command, ParsedTeam } from '../core/types';

interface SecretCommandEntryPanelProps {
  phase: SecretEntryPhase;
  slotCount: number;
  draftCommands: Command[];
  playerA: ParsedTeam | null;
  playerB: ParsedTeam | null;
  onChangeDraftCommand: (index: number, command: Command) => void;
  onConfirmCurrentPlayer: () => void;
  onStartLocalMatch: () => void;
  onResetLocalEntry: () => void;
}

const phaseTitle: Record<SecretEntryPhase, string> = {
  PLAYER_A_INPUT: 'Player A command entry',
  PLAYER_B_INPUT: 'Player B command entry',
  READY: 'Both players are ready',
};

const phaseDescription: Record<SecretEntryPhase, string> = {
  PLAYER_A_INPUT: 'Player A chooses all commands first. After confirmation, commands will be hidden.',
  PLAYER_B_INPUT: 'Player B now chooses commands. Player A commands are hidden.',
  READY: 'Both command queues are locked. Start the local match when ready.',
};

export const SecretCommandEntryPanel = ({
  phase,
  slotCount,
  draftCommands,
  playerA,
  playerB,
  onChangeDraftCommand,
  onConfirmCurrentPlayer,
  onStartLocalMatch,
  onResetLocalEntry,
}: SecretCommandEntryPanelProps) => {
  const isReady = phase === 'READY';

  return (
    <section className="panel secret-entry-panel">
      <div className="secret-entry-header">
        <div>
          <p className="eyebrow">Local 2P Secret Entry</p>
          <h2>{phaseTitle[phase]}</h2>
          <p>{phaseDescription[phase]}</p>
        </div>
        <button onClick={onResetLocalEntry}>Reset Entry</button>
      </div>

      <div className="secret-entry-grid">
        <div className="secret-entry-card">
          <h3>Player A</h3>
          {playerA === null ? (
            <p>Not submitted yet.</p>
          ) : (
            <ol className="masked-queue">
              {maskSubmittedCommands(playerA.commands).map((maskedCommand, index) => (
                <li key={`a-${index}`}><span>{index + 1}</span>{maskedCommand}</li>
              ))}
            </ol>
          )}
        </div>

        <div className="secret-entry-card">
          <h3>Player B</h3>
          {playerB === null ? (
            <p>Not submitted yet.</p>
          ) : (
            <ol className="masked-queue">
              {maskSubmittedCommands(playerB.commands).map((maskedCommand, index) => (
                <li key={`b-${index}`}><span>{index + 1}</span>{maskedCommand}</li>
              ))}
            </ol>
          )}
        </div>
      </div>

      {!isReady && (
        <div className="command-entry-list">
          {Array.from({ length: slotCount }, (_, index) => (
            <label key={index}>
              Slot {index + 1}
              <select
                value={draftCommands[index]}
                onChange={(event) => onChangeDraftCommand(index, event.target.value as Command)}
              >
                {COMMAND_OPTIONS.map(({ command, label }) => (
                  <option key={command} value={command}>{label}</option>
                ))}
              </select>
            </label>
          ))}
        </div>
      )}

      <div className="actions">
        {!isReady && <button onClick={onConfirmCurrentPlayer}>Confirm and Hide Commands</button>}
        {isReady && <button onClick={onStartLocalMatch}>Start Local Match</button>}
      </div>
    </section>
  );
};
