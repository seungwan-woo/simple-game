import { getCommandOption } from '../core/localCommandEntry';
import { Command } from '../core/types';

interface CommandQueueProps {
  commands: Command[];
  activeTurn: number;
}

export const CommandQueue = ({ commands, activeTurn }: CommandQueueProps) => (
  <ol className="command-queue">
    {commands.map((command, index) => {
      const option = getCommandOption(command);
      return (
        <li key={`${command}-${index}`} className={index === activeTurn ? 'active' : ''}>
          <span className="queue-index">{index + 1}</span>
          <span className="queue-emoji">{option.emoji}</span>
          <strong>{option.shortLabel}</strong>
          <small>{option.label}</small>
        </li>
      );
    })}
  </ol>
);
