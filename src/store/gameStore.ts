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
import {
  createDefaultCommandDraft,
  createLocalPlayerTeam,
  getNextSecretEntryPhase,
  SecretEntryPhase,
  setDraftCommand,
} from '../core/localCommandEntry';
import { Command, GameState, NormalizedTeams, ParsedTeam, RawCsvRow, TunableGameConfig, TurnEvent } from '../core/types';
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
  activeTeamA: ParsedTeam;
  activeTeamB: ParsedTeam;
  matchSummary: MatchSummary;
  secretEntryPhase: SecretEntryPhase;
  secretDraftCommands: Command[];
  secretPlayerA: ParsedTeam | null;
  secretPlayerB: ParsedTeam | null;
  importCsvData: (rawRows: RawCsvRow[]) => Promise<void>;
  selectMatchMode: (mode: MatchMode) => void;
  updateSecretDraftCommand: (index: number, command: Command) => void;
  confirmSecretEntryPlayer: () => void;
  startSecretEntryMatch: () => void;
  resetSecretEntry: () => void;
  startMatch: () => void;
  stepNextTurn: () => void;
  runCurrentMatchToEnd: () => void;
  modifyConfig: <K extends keyof TunableGameConfig>(key: K, value: TunableGameConfig[K]) => void;
}

const defaultMode: MatchMode = 'FIXED_TURN_REMAINING_HP';
const fallbackTeam: ParsedTeam = {
  teamName: 'Fallback Team',
  commands: createDefaultCommandDraft(),
};
const defaultTeamA = sampleTeams[0] ?? fallbackTeam;
const defaultTeamB = sampleTeams[1] ?? defaultTeamA;

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

const getDefaultMatchTeams = (normalizedTeams: NormalizedTeams) => {
  const teams = selectTeams(normalizedTeams);
  return {
    teamA: teams[0] ?? defaultTeamA,
    teamB: teams[1] ?? teams[0] ?? defaultTeamB,
  };
};

const buildStartedState = (
  config: TunableGameConfig,
  normalizedTeams: NormalizedTeams,
  matchMode: MatchMode
) => {
  const modeConfig = MATCH_MODE_CONFIGS[matchMode];
  const { teamA, teamB } = getDefaultMatchTeams(normalizedTeams);
  const gameState = createGameStateForMatch(teamA, teamB, modeConfig);

  return {
    config: createConfigForMode(config, modeConfig),
    gameState,
    activeTeamA: teamA,
    activeTeamB: teamB,
    latestTurnEvent: null,
    latestTimeline: [],
    matchSummary: createMatchSummary(gameState, modeConfig),
  };
};

const buildLocalStartedState = (
  config: TunableGameConfig,
  teamA: ParsedTeam,
  teamB: ParsedTeam,
  matchMode: MatchMode
) => {
  const modeConfig = MATCH_MODE_CONFIGS[matchMode];
  const gameState = createGameStateForMatch(teamA, teamB, modeConfig);

  return {
    config: createConfigForMode(config, modeConfig),
    gameState,
    activeTeamA: teamA,
    activeTeamB: teamB,
    latestTurnEvent: null,
    latestTimeline: [],
    matchSummary: createMatchSummary(gameState, modeConfig),
  };
};

const initialGameState = createInitialGameState(GAME_SYSTEM_CONSTANTS.DEFAULT_MAX_HP);

export const useGameStore = create<GameStore>()(
  devtools(
    (set) => ({
      gameState: initialGameState,
      config: defaultConfig,
      normalizedTeams: normalizeSampleTeams(),
      teamsLoadedCount: sampleTeams.length,
      totalTeamsCount: sampleTeams.length,
      isStreamingLoading: false,
      latestTurnEvent: null,
      latestTimeline: [],
      matchMode: defaultMode,
      activeTeamA: defaultTeamA,
      activeTeamB: defaultTeamB,
      matchSummary: createDefaultSummary(initialGameState),
      secretEntryPhase: 'PLAYER_A_INPUT',
      secretDraftCommands: createDefaultCommandDraft(),
      secretPlayerA: null,
      secretPlayerB: null,
      importCsvData: async (rawRows) => {
        set({
          totalTeamsCount: rawRows.length,
          isStreamingLoading: true,
          normalizedTeams: emptyNormalizedTeams,
          teamsLoadedCount: 0,
        }, false, 'csv/start');
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
        if (result._tag === 'Left') {
          set({ isStreamingLoading: false }, false, 'csv/error');
          return;
        }

        set((store) => ({
          isStreamingLoading: false,
          ...buildStartedState(store.config, store.normalizedTeams, store.matchMode),
        }), false, 'csv/complete');
      },
      selectMatchMode: (mode) =>
        set((store) => ({
          matchMode: mode,
          secretDraftCommands: createDefaultCommandDraft(),
          ...buildStartedState(store.config, store.normalizedTeams, mode),
        }), false, 'match/select_mode'),
      updateSecretDraftCommand: (index, command) =>
        set((store) => ({ secretDraftCommands: setDraftCommand(store.secretDraftCommands, index, command) }), false, 'secret_entry/update_command'),
      confirmSecretEntryPlayer: () =>
        set((store) => {
          const teamName = store.secretEntryPhase === 'PLAYER_A_INPUT' ? 'Local Player A' : 'Local Player B';
          const submittedTeam = createLocalPlayerTeam(teamName, store.secretDraftCommands);

          return {
            secretEntryPhase: getNextSecretEntryPhase(store.secretEntryPhase),
            secretDraftCommands: createDefaultCommandDraft(),
            secretPlayerA: store.secretEntryPhase === 'PLAYER_A_INPUT' ? submittedTeam : store.secretPlayerA,
            secretPlayerB: store.secretEntryPhase === 'PLAYER_B_INPUT' ? submittedTeam : store.secretPlayerB,
          };
        }, false, 'secret_entry/confirm_player'),
      startSecretEntryMatch: () =>
        set((store) => {
          if (store.secretPlayerA === null || store.secretPlayerB === null) {
            return {};
          }

          return buildLocalStartedState(store.config, store.secretPlayerA, store.secretPlayerB, store.matchMode);
        }, false, 'secret_entry/start_match'),
      resetSecretEntry: () =>
        set({
          secretEntryPhase: 'PLAYER_A_INPUT',
          secretDraftCommands: createDefaultCommandDraft(),
          secretPlayerA: null,
          secretPlayerB: null,
        }, false, 'secret_entry/reset'),
      startMatch: () =>
        set((store) => buildStartedState(store.config, store.normalizedTeams, store.matchMode), false, 'match/start'),
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
    }),
    { name: 'CodeStrikerContext' }
  )
);
