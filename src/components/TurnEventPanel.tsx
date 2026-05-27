import { TurnEvent } from '../core/types';

interface TurnEventPanelProps {
  event: TurnEvent | null;
}

export const TurnEventPanel = ({ event }: TurnEventPanelProps) => (
  <section className="panel">
    <h2>Latest Turn</h2>
    {event === null ? (
      <p>No turn has been played yet.</p>
    ) : (
      <div className="event-grid">
        <div><span>Turn</span><strong>{event.turnIndex + 1}</strong></div>
        <div><span>A Command</span><strong>{event.commandA}</strong></div>
        <div><span>B Command</span><strong>{event.commandB}</strong></div>
        <div><span>A Outcome</span><strong>{event.outcomeA}</strong></div>
        <div><span>B Outcome</span><strong>{event.outcomeB}</strong></div>
        <div><span>Damage to A</span><strong>{event.damageToA}</strong></div>
        <div><span>Damage to B</span><strong>{event.damageToB}</strong></div>
      </div>
    )}
  </section>
);
