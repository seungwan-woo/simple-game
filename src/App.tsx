import { useGameStore } from './store/gameStore';
import { ParsedTeam } from './core/types';

const sampleA: ParsedTeam = {
  teamName: 'Alpha',
  commands: ['CHARGE', 'MID_ATTACK', 'THROW', 'LOW_BLOCK', 'LOW_ATTACK', 'CHARGE', 'MID_ATTACK'],
};

const sampleB: ParsedTeam = {
  teamName: 'Beta',
  commands: ['LOW_BLOCK', 'LOW_BLOCK', 'MID_BLOCK', 'LOW_ATTACK', 'CHARGE', 'THROW', 'MID_BLOCK'],
};

export const App = () => {
  const { gameState, latestTurnEvent, latestTimeline, resetArena, stepNextTurn } = useGameStore();

  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">Code Striker</p>
        <h1>Turn-based command battle simulator</h1>
        <p>
          Pure TypeScript engine, semantic battle outcomes, replay events, and a UI animation timeline designed for GitHub Pages.
        </p>
      </section>

      <section className="arena">
        <article className="player-card">
          <h2>Player A</h2>
          <div className="hp"><span style={{ width: `${gameState.playerA.hp}%` }} /></div>
          <strong>{gameState.playerA.hp} HP</strong>
          <p>Charge: {gameState.playerA.chargeCount}</p>
        </article>
        <article className="player-card">
          <h2>Player B</h2>
          <div className="hp"><span style={{ width: `${gameState.playerB.hp}%` }} /></div>
          <strong>{gameState.playerB.hp} HP</strong>
          <p>Charge: {gameState.playerB.chargeCount}</p>
        </article>
      </section>

      <section className="actions">
        <button onClick={() => resetArena(sampleA, sampleB)}>Load sample match</button>
        <button onClick={stepNextTurn}>Step next turn</button>
      </section>

      <section className="panel">
        <h2>Latest Turn Event</h2>
        <pre>{JSON.stringify(latestTurnEvent, null, 2)}</pre>
      </section>

      <section className="panel">
        <h2>Animation Timeline</h2>
        <pre>{JSON.stringify(latestTimeline, null, 2)}</pre>
      </section>
    </main>
  );
};
