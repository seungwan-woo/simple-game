import { Command } from '../core/types';

interface CommandQueueProps {
  commands: Command[];
  activeTurn: number;
}

export const CommandQueue = ({ commands, activeTurn }: CommandQueueProps) => (
  <ol className="command-queue">
    {commands.map((command, index) => (
      <li key={`${command}-${index}`} className={index === activeTurn ? 'active' : ''}>
        <span>{index + 1}</span>
        {command}
      </li>
    ))}
  </ol>
);
