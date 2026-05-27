import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
  createConfigForMode,
  createGameStateForMatch,
  createMatchSummary,
  MATCH_MODE_CONFIGS,
  MatchMode,
  MatchSummary,
  runFullMatch,
} from '../core/matchSimulator';
import { GameState, NormalizedTeams, ParsedTeam, RawCsvRow, TunableGameConfig, TurnEvent } from '../core/types';
import { runSingleTurn } from '../core/gameEngine';
import { parseCsvProgressively } from '../core/csvParser';
import { GAME_SYSTEM_CONSTANTS } from '../core/constants';
import { AnimationEvent, buildAnimationTimeline } from '../core/simulationTimeline';
import { mergeNormalizedTeams, normalizeTeams, selectTeams } from '../core/teamNormalizer';
import { sampleTeams } from '../data/sampleTeams';

interface GameStore {
  gameState: GameState;
  config: TunableGameConfig;
  normalizedTeams: NormalizedTeams;
  teamsLoadedCount: number;
  totalTeamsCount: number;
  isStreamingLoading: boolean;
  latestTurnEvent: TurnEvent | null;
  latestTimeline: AnimationEvent[];
  matchMode: MatchMode;
  selectedTeamAIndex: number;
  selectedTeamBIndex: number;
  matchSummary: MatchSummary;
  importCsvData: (rawRows: RawCsvRow[]) => Promise<void>;
  getImportedTeams: () => ParsedTeam[];
  loadSampleTeams: () => void;
  selectTeamA: (index: number) => void;
  selectTeamB: (index: number) => void;
  selectMatchMode: (mode: MatchMode) => void;
  startMatch: () => void;
  stepNextTurn: () => void;
  runCurrentMatchToEnd: () => void;
  modifyConfig: <K extends keyof TunableGameConfig>(key: K, value: TunableGameConfig[K]) => void;
  resetArena: (teamA: ParsedTeam, teamB: ParsedTeam) => void;
}

const defaultMode: MatchMode = 'FIXED_TURN_REMAINING_HP';

const defaultConfig: TunableGameConfig = {
  MAX_HP: GAME_SYSTEM_CONSTANTS.DEFAULT_MAX_HP,
  TOTAL_COMMAND_SLOTS: GAME_SYSTEM_CONSTANTS.DEFAULT_TOTAL_COMMAND_SLOTS,
  BASE_ATTACK_DAMAGE: GAME_SYSTEM_CONSTANTS.DEFAULT_BASE_ATTACK_DAMAGE,
  COUNTER_DAMAGE: GAME_SYSTEM_CONSTANTS.DEFAULT_COUNTER_DAMAGE,
  THROW_DAMAGE: GAME_SYSTEM_CONSTANTS.DEFAULT_THROW_DAMAGE,
  MAX_CHARGE_STACK: GAME_SYSTEM_CONSTANTS.MAX_CHARGE_STACK,
  CHARGE_BONUS_CURVE: [...GAME_SYSTEM_CONSTANTS.CHARGE_BONUS_CURVE],
};

const emptyNormalizedTeams: NormalizedTeams = { teamIds: [], teamsById: {} };

const normalizeSampleTeams = (): NormalizedTeams => normalizeTeams(sampleTeams);

const createInitialGameState = (maxHp: number): GameState => ({
  playerA: { hp: maxHp, chargeCount: 0, commands: [] },
  playerB: { hp: maxHp, chargeCount: 0, commands: [] },
  turnIndex: 0,
  replay: { events: [] },
});

const createDefaultSummary = (state: GameState): MatchSummary =>
  createMatchSummary(state, MATCH_MODE_CONFIGS[defaultMode]);

const getSelectedTeams = (normalizedTeams: NormalizedTeams, teamAIndex: number, teamBIndex: number) => {
  const teams = selectTeams(normalizedTeams);
  return {
    teamA: teams[teamAIndex] ?? sampleTeams[0],
    teamB: teams[teamBIndex] ?? sampleTeams[1] ?? sampleTeams[0],
  };
};

const buildStartedState = (
  config: TunableGameConfig,
  normalizedTeams: NormalizedTeams,
  teamAIndex: number,
  teamBIndex: number,
  matchMode: MatchMode
) => {
  const modeConfig = MATCH_MODE_CONFIGS[matchMode];
  const { teamA, teamB } = getSelectedTeams(normalizedTeams, teamAIndex, teamBIndex);
  const gameState = createGameStateForMatch(teamA, teamB, modeConfig);

  return {
    config: createConfigForMode(config, modeConfig),
    gameState,
    latestTurnEvent: null,
    latestTimeline: [],
    matchSummary: createMatchSummary(gameState, modeConfig),
  };
};

const initialGameState = createInitialGameState(GAME_SYSTEM_CONSTANTS.DEFAULT_MAX_HP);

export const useGameStore = create<GameStore>()(
  devtools(
    (set, get) => ({
      gameState: initialGameState,
      config: defaultConfig,
      normalizedTeams: normalizeSampleTeams(),
      teamsLoadedCount: sampleTeams.length,
      totalTeamsCount: sampleTeams.length,
      isStreamingLoading: false,
      latestTurnEvent: null,
      latestTimeline: [],
      matchMode: defaultMode,
      selectedTeamAIndex: 0,
      selectedTeamBIndex: 1,
      matchSummary: createDefaultSummary(initialGameState),
      importCsvData: async (rawRows) => {
        set({ totalTeamsCount: rawRows.length, isStreamingLoading: true, normalizedTeams: emptyNormalizedTeams, teamsLoadedCount: 0 }, false, 'csv/start');
        const pipeline = parseCsvProgressively(rawRows, (chunkTeams) =>
          set((state) => {
            const nextNormalizedTeams = normalizeTeams(chunkTeams, state.teamsLoadedCount);
            return {
              normalizedTeams: mergeNormalizedTeams(state.normalizedTeams, nextNormalizedTeams),
              teamsLoadedCount: state.teamsLoadedCount + chunkTeams.length,
            };
          }, false, 'csv/chunk')
        );
        const result = await pipeline();
        set({ isStreamingLoading: false }, false, result._tag === 'Left' ? 'csv/error' : 'csv/complete');
      },
      getImportedTeams: () => selectTeams(get().normalizedTeams),
      loadSampleTeams: () =>
        set({ normalizedTeams: normalizeSampleTeams(), teamsLoadedCount: sampleTeams.length, totalTeamsCount: sampleTeams.length }, false, 'teams/load_sample'),
      selectTeamA: (index) => set({ selectedTeamAIndex: index }, false, 'match/select_team_a'),
      selectTeamB: (index) => set({ selectedTeamBIndex: index }, false, 'match/select_team_b'),
      selectMatchMode: (mode) =>
        set((store) => ({
          matchMode: mode,
          ...buildStartedState(store.config, store.normalizedTeams, store.selectedTeamAIndex, store.selectedTeamBIndex, mode),
        }), false, 'match/select_mode'),
      startMatch: () =>
        set((store) => buildStartedState(store.config, store.normalizedTeams, store.selectedTeamAIndex, store.selectedTeamBIndex, store.matchMode), false, 'match/start'),
      stepNextTurn: () =>
        set((store) => {
          const modeConfig = MATCH_MODE_CONFIGS[store.matchMode];
          if (store.matchSummary.isFinished) {
            return {};
          }

          const result = runSingleTurn(store.config)(store.gameState);
          return {
            gameState: result.nextState,
            latestTurnEvent: result.event,
            latestTimeline: result.event === null ? [] : buildAnimationTimeline(result.event),
            matchSummary: createMatchSummary(result.nextState, modeConfig),
          };
        }, false, 'arena/step'),
      runCurrentMatchToEnd: () =>
        set((store) => {
          const modeConfig = MATCH_MODE_CONFIGS[store.matchMode];
          const nextState = runFullMatch(store.config, modeConfig)(store.gameState);
          const latestEvent = nextState.replay.events[nextState.replay.events.length - 1] ?? null;
          return {
            gameState: nextState,
            latestTurnEvent: latestEvent,
            latestTimeline: latestEvent === null ? [] : buildAnimationTimeline(latestEvent),
            matchSummary: createMatchSummary(nextState, modeConfig),
          };
        }, false, 'match/run_full'),
      modifyConfig: (key, value) =>
        set((store) => ({ config: { ...store.config, [key]: value } }), false, `config/modify_${String(key)}`),
      resetArena: (teamA, teamB) =>
        set((store) => {
          const modeConfig = MATCH_MODE_CONFIGS[store.matchMode];
          const gameState = createGameStateForMatch(teamA, teamB, modeConfig);
          return {
            gameState,
            config: createConfigForMode(store.config, modeConfig),
            latestTurnEvent: null,
            latestTimeline: [],
            matchSummary: createMatchSummary(gameState, modeConfig),
          };
        }, false, 'arena/reset'),
    }),
    { name: 'CodeStrikerContext' }
  )
);
