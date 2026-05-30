import { useEffect, useState } from 'react';
import {
  COMMAND_OPTIONS,
  SecretEntryPhase,
  getCommandOption,
  maskSubmittedCommands,
} from '../core/localCommandEntry';
import { Command, ParsedTeam } from '../core/types';
import './SecretCommandEntryPanel.css';

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
  PLAYER_A_INPUT: 'Pick 7 moves. Tap a slot, then tap a command card. Fast, private, and easy to scan.',
  PLAYER_B_INPUT: 'Player A is hidden. Player B now picks the same 7-slot strategy.',
  READY: 'Both 7-command queues are locked. Start the local match when ready.',
};

const SubmittedQueue = ({ label, team }: { label: string; team: ParsedTeam | null }) => (
  <div className="secret-entry-card">
    <h3>{label}</h3>
    {team === null ? (
      <p className="muted-copy">Not submitted yet.</p>
    ) : (
      <ol className="masked-queue compact-seven">
        {maskSubmittedCommands(team.commands).map((maskedCommand, index) => (
          <li key={`${label}-${index}`}><span>{index + 1}</span>{maskedCommand}</li>
        ))}
      </ol>
    )}
  </div>
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
  const [selectedSlot, setSelectedSlot] = useState(0);
  const visibleSlotCount = Math.max(0, Math.min(slotCount, draftCommands.length));
  const lastEditableSlot = visibleSlotCount - 1;
  const selectedSlotIndex = visibleSlotCount === 0 ? 0 : Math.min(Math.max(selectedSlot, 0), lastEditableSlot);
  const selectedCommand = visibleSlotCount === 0 ? null : draftCommands[selectedSlotIndex] ?? null;

  useEffect(() => {
    setSelectedSlot((current) => {
      if (visibleSlotCount === 0) return 0;
      return Math.min(Math.max(current, 0), lastEditableSlot);
    });
  }, [lastEditableSlot, visibleSlotCount]);

  const handleCommandPick = (command: Command) => {
    if (visibleSlotCount === 0) return;

    onChangeDraftCommand(selectedSlotIndex, command);
    setSelectedSlot(Math.min(selectedSlotIndex + 1, lastEditableSlot));
  };

  return (
    <section className="panel secret-entry-panel lovable-card">
      <div className="secret-entry-header">
        <div>
          <p className="eyebrow">Local 2P Secret Entry</p>
          <h2>{phaseTitle[phase]}</h2>
          <p>{phaseDescription[phase]}</p>
        </div>
        <button className="ghost-button" onClick={onResetLocalEntry}>Reset Entry</button>
      </div>

      <div className="secret-entry-grid">
        <SubmittedQueue label="Player A" team={playerA} />
        <SubmittedQueue label="Player B" team={playerB} />
      </div>

      {!isReady && (
        <div className="fast-entry-shell">
          <div className="slot-strip" aria-label="7 command slots">
            {draftCommands.slice(0, visibleSlotCount).map((command, index) => {
              const option = getCommandOption(command);
              return (
                <button
                  key={`${command}-${index}`}
                  className={`slot-chip ${selectedSlotIndex === index ? 'selected' : ''}`}
                  onClick={() => setSelectedSlot(index)}
                  type="button"
                >
                  <span className="slot-index">{index + 1}</span>
                  <span className="slot-emoji">{option.emoji}</span>
                  <strong>{option.shortLabel}</strong>
                </button>
              );
            })}
          </div>

          <div className="command-pad" aria-label="command picker">
            {COMMAND_OPTIONS.map((option) => (
              <button
                key={option.command}
                className={`command-card ${selectedCommand === option.command ? 'active' : ''}`}
                disabled={visibleSlotCount === 0}
                onClick={() => handleCommandPick(option.command)}
                type="button"
              >
                <span className="command-emoji">{option.emoji}</span>
                <strong>{option.label}</strong>
                <small>{option.hint}</small>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="actions">
        {!isReady && <button className="primary-button" onClick={onConfirmCurrentPlayer}>Confirm and Hide Commands</button>}
        {isReady && <button className="primary-button" onClick={onStartLocalMatch}>Start Local Match</button>}
      </div>
    </section>
  );
};
