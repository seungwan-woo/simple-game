import { useEffect, useState } from 'react';
import { CommandQueue } from './components/CommandQueue';
import { CsvImportPanel } from './components/CsvImportPanel';
import { MatchControls } from './components/MatchControls';
import { PlayerPanel } from './components/PlayerPanel';
import { ReplayLog } from './components/ReplayLog';
import { SecretCommandEntryPanel } from './components/SecretCommandEntryPanel';
import { TimelinePlaybackPanel } from './components/TimelinePlaybackPanel';
import { TurnEventPanel } from './components/TurnEventPanel';
import { GAME_SYSTEM_CONSTANTS } from './core/constants';
import { MATCH_MODE_CONFIGS, MatchWinner } from './core/matchSimulator';
import { sampleTeams } from './data/sampleTeams';
import { useGameStore } from './store/gameStore';

const AUTO_PLAY_INTERVAL_MS = 2000;
const INPUT_SLOT_COUNT = GAME_SYSTEM_CONSTANTS.DEFAULT_TOTAL_COMMAND_SLOTS;

const winnerLabel = (winner: MatchWinner): string => {
  switch (winner) {
    case 'A':
      return '🏆 Player A Wins';
    case 'B':
      return '🏆 Player B Wins';
    case 'DRAW':
      return '🤝 Draw';
    case 'UNDECIDED':
      return 'Battle in progress';
  }
};

export const App = () => {
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const {
    gameState,
    normalizedTeams,
    teamsLoadedCount,
    totalTeamsCount,
    isStreamingLoading,
    selectedTeamAIndex,
    selectedTeamBIndex,
    activeTeamA,
    activeTeamB,
    matchMode,
    matchSummary,
    latestTurnEvent,
    latestTimeline,
    secretEntryPhase,
    secretDraftCommands,
    secretPlayerA,
    secretPlayerB,
    importCsvData,
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
  const modeConfig = MATCH_MODE_CONFIGS[matchMode];
  const displayWinner = matchSummary.isFinished ? winnerLabel(matchSummary.winner) : winnerLabel('UNDECIDED');

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

  const handleImportCsv = async (...args: Parameters<typeof importCsvData>) => {
    setIsAutoPlaying(false);
    await importCsvData(...args);
  };

  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">Code Striker</p>
        <h1>Playable command battle MVP</h1>
        <p>
          Choose preset teams, import CSV teams, or use local 2-player secret entry. Then step manually, run full match, or auto play every two seconds.
        </p>
      </section>

      <CsvImportPanel
        isLoading={isStreamingLoading}
        loadedCount={teamsLoadedCount}
        totalCount={totalTeamsCount}
        onImportRows={handleImportCsv}
      />

      <SecretCommandEntryPanel
        phase={secretEntryPhase}
        slotCount={INPUT_SLOT_COUNT}
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

      <TimelinePlaybackPanel timeline={latestTimeline} />

      <section className={`winner-banner ${matchSummary.isFinished ? 'finished' : ''}`}>
        <p className="eyebrow">Match Result</p>
        <h2>{displayWinner}</h2>
        <p>
          Player A {matchSummary.finalHpA} energy / Player B {matchSummary.finalHpB} energy · {matchSummary.totalTurns} turns played
        </p>
      </section>

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
          <strong>{displayWinner}</strong>
        </div>
        <div>
          <span>Loaded Teams</span>
          <strong>{normalizedTeams.teamIds.length}</strong>
        </div>
      </section>

      <section className="arena">
        <PlayerPanel label="Player A" teamName={activeTeamA.teamName} player={gameState.playerA} maxHp={modeConfig.initialHp} />
        <PlayerPanel label="Player B" teamName={activeTeamB.teamName} player={gameState.playerB} maxHp={modeConfig.initialHp} />
      </section>

      <section className="queues">
        <div className="panel">
          <h2>{activeTeamA.teamName} Base 7-Command Queue</h2>
          <CommandQueue commands={activeTeamA.commands.slice(0, INPUT_SLOT_COUNT)} activeTurn={gameState.turnIndex % INPUT_SLOT_COUNT} />
        </div>
        <div className="panel">
          <h2>{activeTeamB.teamName} Base 7-Command Queue</h2>
          <CommandQueue commands={activeTeamB.commands.slice(0, INPUT_SLOT_COUNT)} activeTurn={gameState.turnIndex % INPUT_SLOT_COUNT} />
        </div>
      </section>

      <TurnEventPanel event={latestTurnEvent} />
      <ReplayLog events={gameState.replay.events} />
    </main>
  );
};
