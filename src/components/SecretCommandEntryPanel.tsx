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
  PLAYER_A_INPUT: 'Player A chooses exactly 7 commands first. After confirmation, commands will be hidden.',
  PLAYER_B_INPUT: 'Player B now chooses exactly 7 commands. Player A commands are hidden.',
  READY: 'Both 7-command queues are locked. Start the local match when ready.',
};

const commandLabel = (command: Command): string =>
  COMMAND_OPTIONS.find((option) => option.command === command)?.label ?? command;

const DraftSummary = ({ commands }: { commands: Command[] }) => (
  <ol className="draft-summary">
    {commands.map((command, index) => (
      <li key={`${command}-${index}`}>
        <span>{index + 1}</span>
        <strong>{commandLabel(command)}</strong>
        <small>{command}</small>
      </li>
    ))}
  </ol>
);

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
            <ol className="masked-queue compact-seven">
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
            <ol className="masked-queue compact-seven">
              {maskSubmittedCommands(playerB.commands).map((maskedCommand, index) => (
                <li key={`b-${index}`}><span>{index + 1}</span>{maskedCommand}</li>
              ))}
            </ol>
          )}
        </div>
      </div>

      {!isReady && (
        <>
          <div className="draft-preview-panel">
            <h3>Current 7-command plan</h3>
            <DraftSummary commands={draftCommands.slice(0, slotCount)} />
          </div>
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
        </>
      )}

      <div className="actions">
        {!isReady && <button onClick={onConfirmCurrentPlayer}>Confirm and Hide Commands</button>}
        {isReady && <button onClick={onStartLocalMatch}>Start Local Match</button>}
      </div>
    </section>
  );
};
