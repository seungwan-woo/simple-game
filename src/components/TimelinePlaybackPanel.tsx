import { useEffect, useMemo, useState } from 'react';
import { getCommandOption } from '../core/localCommandEntry';
import { AnimationEvent } from '../core/simulationTimeline';
import { Command } from '../core/types';
import './TimelinePlaybackPanel.css';

interface TimelinePlaybackPanelProps {
  timeline: AnimationEvent[];
}

const commandLabel = (command: string): string => {
  const option = getCommandOption(command as Command);
  return `${option.emoji} ${option.label}`;
};

const describeAnimationEvent = (event: AnimationEvent): { title: string; body: string } => {
  switch (event.type) {
    case 'COMMAND_REVEAL':
      return {
        title: `Turn ${event.turnIndex + 1}: Command Reveal`,
        body: `A ${commandLabel(event.commandA)} vs B ${commandLabel(event.commandB)}`,
      };
    case 'OUTCOME_LABEL':
      return {
        title: 'Outcome',
        body: event.label,
      };
    case 'DAMAGE_APPLY':
      return {
        title: `Damage to Player ${event.target}`,
        body: `${event.damage} damage · HP becomes ${event.hpAfter}`,
      };
    case 'HP_GHOST_CHASE':
      return {
        title: `HP Ghost Chase: Player ${event.target}`,
        body: `Damage trail settles at ${event.hpAfter} HP`,
      };
  }
};

export const TimelinePlaybackPanel = ({ timeline }: TimelinePlaybackPanelProps) => {
  const [activeStepIndex, setActiveStepIndex] = useState(-1);
  const timelineKey = useMemo(() => JSON.stringify(timeline), [timeline]);

  useEffect(() => {
    if (timeline.length === 0) {
      setActiveStepIndex(-1);
      return undefined;
    }

    setActiveStepIndex(0);
    let elapsedMs = 0;
    const timers = timeline.slice(1).map((event, index) => {
      elapsedMs += event.delayMs;
      return window.setTimeout(() => setActiveStepIndex(index + 1), elapsedMs);
    });

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [timelineKey, timeline]);

  const activeEvent = activeStepIndex >= 0 ? timeline[activeStepIndex] ?? null : null;
  const activeDescription = activeEvent === null ? null : describeAnimationEvent(activeEvent);

  return (
    <section className="panel timeline-playback-panel">
      <div className="timeline-stage">
        <p className="eyebrow">Broadcast Timeline</p>
        {activeDescription === null ? (
          <>
            <h2>Waiting for next turn</h2>
            <p>Press Next Turn or start Auto Play to see the turn sequence.</p>
          </>
        ) : (
          <>
            <h2>{activeDescription.title}</h2>
            <p>{activeDescription.body}</p>
          </>
        )}
      </div>

      <ol className="timeline-steps">
        {timeline.map((event, index) => {
          const description = describeAnimationEvent(event);
          const state = index === activeStepIndex ? 'active' : index < activeStepIndex ? 'done' : 'pending';
          return (
            <li key={`${event.type}-${index}`} className={state}>
              <span>{index + 1}</span>
              <div>
                <strong>{description.title}</strong>
                <small>{description.body}</small>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
};
