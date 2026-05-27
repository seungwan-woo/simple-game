import { useEffect, useState } from 'react';
import { CommandQueue } from './components/CommandQueue';
import { MatchControls } from './components/MatchControls';
import { PlayerPanel } from './components/PlayerPanel';
import { ReplayLog } from './components/ReplayLog';
import { SecretCommandEntryPanel } from './components/SecretCommandEntryPanel';
import { TurnEventPanel } from './components/TurnEventPanel';
import { MATCH_MODE_CONFIGS } from './core/matchSimulator';
import { sampleTeams } from './data/sampleTeams';
import { useGameStore } from './store/gameStore';

const AUTO_PLAY_INTERVAL_MS = 2000;

export const App = () => {
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const {
    gameState,
    normalizedTeams,
    selectedTeamAIndex,
    selectedTeamBIndex,
    matchMode,
    matchSummary,
    latestTurnEvent,
    secretEntryPhase,
    secretDraftCommands,
    secretPlayerA,
    secretPlayerB,
    getImportedTeams,
    selectTeamA,
    selectTeamB,
    selectMatchMode,
    updateSecretDraftCommand,
    confirmSecretEntryPlayer,
    startSecretEntryMatch,
    resetSecretEntry,
    startMatch,
    stepNextTurn,
    runCurrentMatchToEnd,
  } = useGameStore();

  useEffect(() => {
    if (!isAutoPlaying || matchSummary.isFinished) {
      return undefined;
    }

    const timerId = window.setInterval(() => {
      stepNextTurn();
    }, AUTO_PLAY_INTERVAL_MS);

    return () => window.clearInterval(timerId);
  }, [isAutoPlaying, matchSummary.isFinished, stepNextTurn]);

  useEffect(() => {
    if (matchSummary.isFinished) {
      setIsAutoPlaying(false);
    }
  }, [matchSummary.isFinished]);

  const teams = getImportedTeams().length > 0 ? getImportedTeams() : sampleTeams;
  const selectedTeamA = teams[selectedTeamAIndex] ?? sampleTeams[0];
  const selectedTeamB = teams[selectedTeamBIndex] ?? sampleTeams[1] ?? sampleTeams[0];
  const modeConfig = MATCH_MODE_CONFIGS[matchMode];

  const handleRunFullMatch = () => {
    setIsAutoPlaying(false);
    runCurrentMatchToEnd();
  };

  const handleStartLocalMatch = () => {
    setIsAutoPlaying(false);
    startSecretEntryMatch();
  };

  const handleStartPresetMatch = () => {
    setIsAutoPlaying(false);
    startMatch();
  };

  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">Code Striker</p>
        <h1>Playable command battle MVP</h1>
        <p>
          Choose preset teams or use local 2-player secret entry. Then step manually, run full match, or auto play every two seconds.
        </p>
      </section>

      <SecretCommandEntryPanel
        phase={secretEntryPhase}
        slotCount={modeConfig.maxTurns}
        draftCommands={secretDraftCommands}
        playerA={secretPlayerA}
        playerB={secretPlayerB}
        onChangeDraftCommand={updateSecretDraftCommand}
        onConfirmCurrentPlayer={confirmSecretEntryPlayer}
        onStartLocalMatch={handleStartLocalMatch}
        onResetLocalEntry={resetSecretEntry}
      />

      <MatchControls
        teams={teams}
        selectedTeamAIndex={selectedTeamAIndex}
        selectedTeamBIndex={selectedTeamBIndex}
        matchMode={matchMode}
        isFinished={matchSummary.isFinished}
        onSelectTeamA={selectTeamA}
        onSelectTeamB={selectTeamB}
        onSelectMode={selectMatchMode}
        onStart={handleStartPresetMatch}
        onStep={stepNextTurn}
        onRunFull={handleRunFullMatch}
        onReset={handleStartPresetMatch}
      />

      <section className="panel auto-play-panel">
        <div>
          <p className="eyebrow">Auto Play</p>
          <h2>2-second turn runner</h2>
          <p>Automatically advances one turn every {AUTO_PLAY_INTERVAL_MS / 1000} seconds until the match ends.</p>
        </div>
        <button disabled={matchSummary.isFinished} onClick={() => setIsAutoPlaying((current) => !current)}>
          {isAutoPlaying ? 'Stop Auto Play' : 'Start Auto Play'}
        </button>
      </section>

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
