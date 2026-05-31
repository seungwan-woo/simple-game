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
import { useGameStore } from './store/gameStore';

const AUTO_PLAY_INTERVAL_MS = 2000;
const INPUT_SLOT_COUNT = GAME_SYSTEM_CONSTANTS.DEFAULT_TOTAL_COMMAND_SLOTS;

type AppView = 'INPUT' | 'BATTLE' | 'RESULT';

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

const viewLabel: Record<AppView, string> = {
  INPUT: '1. Input',
  BATTLE: '2. Battle',
  RESULT: '3. Result',
};

export const App = () => {
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [currentView, setCurrentView] = useState<AppView>('INPUT');
  const {
    gameState,
    teamsLoadedCount,
    totalTeamsCount,
    isStreamingLoading,
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

  const modeConfig = MATCH_MODE_CONFIGS[matchMode];
  const displayWinner = matchSummary.isFinished ? winnerLabel(matchSummary.winner) : winnerLabel('UNDECIDED');
  const damageToA = latestTurnEvent?.damageToA ?? 0;
  const damageToB = latestTurnEvent?.damageToB ?? 0;

  const goHome = () => {
    setIsAutoPlaying(false);
    setCurrentView('INPUT');
  };

  const goBattle = () => setCurrentView('BATTLE');
  const goResult = () => {
    setIsAutoPlaying(false);
    setCurrentView('RESULT');
  };

  const handleRunFullMatch = () => {
    setIsAutoPlaying(false);
    runCurrentMatchToEnd();
  };

  const handleStartLocalMatch = () => {
    setIsAutoPlaying(false);
    startSecretEntryMatch();
    setCurrentView('BATTLE');
  };

  const handleStartPresetMatch = () => {
    setIsAutoPlaying(false);
    startMatch();
    setCurrentView('BATTLE');
  };

  const handleImportCsv = async (...args: Parameters<typeof importCsvData>) => {
    setIsAutoPlaying(false);
    await importCsvData(...args);
  };

  const renderNavigation = () => (
    <nav className="app-nav" aria-label="Page navigation">
      {(Object.keys(viewLabel) as AppView[]).map((view) => (
        <button
          key={view}
          className={`nav-pill ${currentView === view ? 'active' : ''}`}
          onClick={() => {
            if (view !== 'BATTLE') setIsAutoPlaying(false);
            setCurrentView(view);
          }}
          type="button"
        >
          {viewLabel[view]}
        </button>
      ))}
    </nav>
  );

  const renderInputPage = () => (
    <>
      <section className="hero page-hero">
        <p className="eyebrow">Code Striker</p>
        <h1>Set up the match</h1>
        <p>Choose a match mode, enter both players' secret commands, then start the match when both players are ready.</p>
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
        matchMode={matchMode}
        isFinished={false}
        onSelectMode={selectMatchMode}
        onStart={handleStartPresetMatch}
        onStep={stepNextTurn}
        onRunFull={handleRunFullMatch}
        onReset={handleStartPresetMatch}
      />
    </>
  );

  const renderBattlePage = () => (
    <>
      <section className="hero page-hero compact-hero">
        <p className="eyebrow">Battle Page</p>
        <h1>Battle in progress</h1>
        <p>Play turn by turn, run auto play, or jump to the result page when you want to review the outcome.</p>
        <div className="page-actions">
          <button className="ghost-button" onClick={goHome}>Back to Input</button>
          <button onClick={goResult}>View Result</button>
        </div>
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
      </section>

      <section className="arena">
        <PlayerPanel
          label="Player A"
          player={gameState.playerA}
          maxHp={modeConfig.initialHp}
          damageTaken={damageToA}
          isWinner={matchSummary.isFinished && matchSummary.winner === 'A'}
        />
        <PlayerPanel
          label="Player B"
          player={gameState.playerB}
          maxHp={modeConfig.initialHp}
          damageTaken={damageToB}
          isWinner={matchSummary.isFinished && matchSummary.winner === 'B'}
        />
      </section>

      <MatchControls
        matchMode={matchMode}
        isFinished={matchSummary.isFinished}
        onSelectMode={selectMatchMode}
        onStart={handleStartPresetMatch}
        onStep={stepNextTurn}
        onRunFull={handleRunFullMatch}
        onReset={handleStartPresetMatch}
      />

      <TimelinePlaybackPanel timeline={latestTimeline} />

      <section className="queues">
        <div className="panel">
          <h2>Player A Base 7-Command Queue</h2>
          <CommandQueue commands={activeTeamA.commands.slice(0, INPUT_SLOT_COUNT)} activeTurn={gameState.turnIndex % INPUT_SLOT_COUNT} />
        </div>
        <div className="panel">
          <h2>Player B Base 7-Command Queue</h2>
          <CommandQueue commands={activeTeamB.commands.slice(0, INPUT_SLOT_COUNT)} activeTurn={gameState.turnIndex % INPUT_SLOT_COUNT} />
        </div>
      </section>

      <TurnEventPanel event={latestTurnEvent} />
    </>
  );

  const renderResultPage = () => (
    <>
      <section className={`winner-banner result-page-result ${matchSummary.isFinished ? 'finished celebration-pop' : ''}`}>
        <p className="eyebrow">Result Page</p>
        <h2>{displayWinner}</h2>
        <p>
          Player A {matchSummary.finalHpA} energy / Player B {matchSummary.finalHpB} energy · {matchSummary.totalTurns} turns played
        </p>
        <div className="page-actions centered">
          <button className="ghost-button" onClick={goHome}>Back to Input</button>
          <button onClick={goBattle}>Back to Battle</button>
        </div>
      </section>

      <section className="arena">
        <PlayerPanel
          label="Player A"
          player={gameState.playerA}
          maxHp={modeConfig.initialHp}
          isWinner={matchSummary.isFinished && matchSummary.winner === 'A'}
        />
        <PlayerPanel
          label="Player B"
          player={gameState.playerB}
          maxHp={modeConfig.initialHp}
          isWinner={matchSummary.isFinished && matchSummary.winner === 'B'}
        />
      </section>

      <ReplayLog events={gameState.replay.events} />
    </>
  );

  return (
    <main className="shell">
      {renderNavigation()}
      {currentView === 'INPUT' && renderInputPage()}
      {currentView === 'BATTLE' && renderBattlePage()}
      {currentView === 'RESULT' && renderResultPage()}
    </main>
  );
};
