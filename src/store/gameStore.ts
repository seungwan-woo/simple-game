import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { GameState, NormalizedTeams, ParsedTeam, RawCsvRow, TunableGameConfig, TurnEvent } from '../core/types';
import { runSingleTurn } from '../core/gameEngine';
import { parseCsvProgressively } from '../core/csvParser';
import { GAME_SYSTEM_CONSTANTS } from '../core/constants';
import { AnimationEvent, buildAnimationTimeline } from '../core/simulationTimeline';
import { mergeNormalizedTeams, normalizeTeams, selectTeams } from '../core/teamNormalizer';

interface GameStore {
  gameState: GameState;
  config: TunableGameConfig;
  normalizedTeams: NormalizedTeams;
  teamsLoadedCount: number;
  totalTeamsCount: number;
  isStreamingLoading: boolean;
  latestTurnEvent: TurnEvent | null;
  latestTimeline: AnimationEvent[];
  importCsvData: (rawRows: RawCsvRow[]) => Promise<void>;
  getImportedTeams: () => ParsedTeam[];
  stepNextTurn: () => void;
  modifyConfig: <K extends keyof TunableGameConfig>(key: K, value: TunableGameConfig[K]) => void;
  resetArena: (teamA: ParsedTeam, teamB: ParsedTeam) => void;
}

const createInitialGameState = (maxHp: number): GameState => ({
  playerA: { hp: maxHp, chargeCount: 0, commands: [] },
  playerB: { hp: maxHp, chargeCount: 0, commands: [] },
  turnIndex: 0,
  replay: { events: [] },
});

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

export const useGameStore = create<GameStore>()(
  devtools(
    (set, get) => ({
      gameState: createInitialGameState(GAME_SYSTEM_CONSTANTS.DEFAULT_MAX_HP),
      config: defaultConfig,
      normalizedTeams: emptyNormalizedTeams,
      teamsLoadedCount: 0,
      totalTeamsCount: 0,
      isStreamingLoading: false,
      latestTurnEvent: null,
      latestTimeline: [],
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
      stepNextTurn: () =>
        set((store) => {
          const result = runSingleTurn(store.config)(store.gameState);
          return {
            gameState: result.nextState,
            latestTurnEvent: result.event,
            latestTimeline: result.event === null ? [] : buildAnimationTimeline(result.event),
          };
        }, false, 'arena/step'),
      modifyConfig: (key, value) =>
        set((store) => ({ config: { ...store.config, [key]: value } }), false, `config/modify_${String(key)}`),
      resetArena: (teamA, teamB) =>
        set((store) => ({
          gameState: {
            playerA: { hp: store.config.MAX_HP, chargeCount: 0, commands: teamA.commands },
            playerB: { hp: store.config.MAX_HP, chargeCount: 0, commands: teamB.commands },
            turnIndex: 0,
            replay: { events: [] },
          },
          latestTurnEvent: null,
          latestTimeline: [],
        }), false, 'arena/reset'),
    }),
    { name: 'CodeStrikerContext' }
  )
);
