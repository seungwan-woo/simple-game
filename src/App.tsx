import { CommandQueue } from './components/CommandQueue';
import { MatchControls } from './components/MatchControls';
import { PlayerPanel } from './components/PlayerPanel';
import { ReplayLog } from './components/ReplayLog';
import { TurnEventPanel } from './components/TurnEventPanel';
import { MATCH_MODE_CONFIGS } from './core/matchSimulator';
import { useGameStore } from './store/gameStore';

export const App = () => {
  const {
    gameState,
    normalizedTeams,
    selectedTeamAIndex,
    selectedTeamBIndex,
    matchMode,
    matchSummary,
    latestTurnEvent,
    getImportedTeams,
    selectTeamA,
    selectTeamB,
    selectMatchMode,
    startMatch,
    stepNextTurn,
    runCurrentMatchToEnd,
  } = useGameStore();

  const teams = getImportedTeams();
  const selectedTeamA = teams[selectedTeamAIndex] ?? teams[0];
  const selectedTeamB = teams[selectedTeamBIndex] ?? teams[1] ?? teams[0];
  const modeConfig = MATCH_MODE_CONFIGS[matchMode];

  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">Code Striker</p>
        <h1>Playable command battle MVP</h1>
        <p>
          Choose two teams, select one of three match modes, and run a deterministic turn-based battle with replay events.
        </p>
      </section>

      <MatchControls
        teams={teams}
        selectedTeamAIndex={selectedTeamAIndex}
        selectedTeamBIndex={selectedTeamBIndex}
        matchMode={matchMode}
        isFinished={matchSummary.isFinished}
        onSelectTeamA={selectTeamA}
        onSelectTeamB={selectTeamB}
        onSelectMode={selectMatchMode}
        onStart={startMatch}
        onStep={stepNextTurn}
        onRunFull={runCurrentMatchToEnd}
        onReset={startMatch}
      />

      <section className="status panel">
        <div>
          <span>Mode</span>
          <strong>{matchMode}</strong>
        </div>
        <div>
          <span>Turn</span>
          <strong>{gameState.turnIndex} / {modeConfig.maxTurns}</strong>
        </div>
        <div>
          <span>Winner</span>
          <strong>{matchSummary.winner}</strong>
        </div>
        <div>
          <span>Loaded Teams</span>
          <strong>{normalizedTeams.teamIds.length}</strong>
        </div>
      </section>

      <section className="arena">
        <PlayerPanel label="Player A" teamName={selectedTeamA.teamName} player={gameState.playerA} maxHp={modeConfig.initialHp} />
        <PlayerPanel label="Player B" teamName={selectedTeamB.teamName} player={gameState.playerB} maxHp={modeConfig.initialHp} />
      </section>

      <section className="queues">
        <div className="panel">
          <h2>{selectedTeamA.teamName} Queue</h2>
          <CommandQueue commands={gameState.playerA.commands.slice(0, modeConfig.maxTurns)} activeTurn={gameState.turnIndex} />
        </div>
        <div className="panel">
          <h2>{selectedTeamB.teamName} Queue</h2>
          <CommandQueue commands={gameState.playerB.commands.slice(0, modeConfig.maxTurns)} activeTurn={gameState.turnIndex} />
        </div>
      </section>

      <TurnEventPanel event={latestTurnEvent} />
      <ReplayLog events={gameState.replay.events} />
    </main>
  );
};
