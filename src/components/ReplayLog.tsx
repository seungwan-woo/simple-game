import { TurnEvent } from '../core/types';

interface ReplayLogProps {
  events: TurnEvent[];
}

export const ReplayLog = ({ events }: ReplayLogProps) => (
  <section className="panel">
    <h2>Replay Log</h2>
    {events.length === 0 ? (
      <p>No replay events yet.</p>
    ) : (
      <div className="replay-log">
        {events.map((event) => (
          <div key={event.turnIndex} className="replay-row">
            <strong>Turn {event.turnIndex + 1}</strong>
            <span>A: {event.commandA} / {event.outcomeA}</span>
            <span>B: {event.commandB} / {event.outcomeB}</span>
            <span>Damage A/B: {event.damageToA} / {event.damageToB}</span>
          </div>
        ))}
      </div>
    )}
  </section>
);
