import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { AnimationEvent } from '../../core/simulationTimeline';
import { TimelinePlaybackPanel } from '../TimelinePlaybackPanel';

afterEach(() => {
  cleanup();
});

const timeline: AnimationEvent[] = [
  { type: 'COMMAND_REVEAL', turnIndex: 0, commandA: 'MID_ATTACK', commandB: 'MID_BLOCK', delayMs: 0 },
  { type: 'OUTCOME_LABEL', label: 'BLOCKED / COUNTER', delayMs: 150 },
];

describe('TimelinePlaybackPanel', () => {
  it('falls back to the waiting state when a new match clears the timeline', async () => {
    const { rerender } = render(<TimelinePlaybackPanel timeline={timeline} />);

    expect(await screen.findByText('Turn 1: Command Reveal')).not.toBeNull();

    expect(() => rerender(<TimelinePlaybackPanel timeline={[]} />)).not.toThrow();
    expect(screen.getByText('Waiting for next turn')).not.toBeNull();
  });
});
