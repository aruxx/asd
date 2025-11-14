import { percent } from './utils.js';

const RESULT_LIMIT = 200;

const state = {
  counter: 0,
  programs: [],
  results: []
};

export function createProgram({ providerId, providerName, tickers, timeframes, outfits }) {
  state.counter += 1;
  const workload = tickers.length * timeframes.length;
  const program = {
    id: `PROG-${state.counter}`,
    providerId,
    providerName,
    tickers,
    timeframes,
    outfits,
    createdAt: new Date().toISOString(),
    status: 'running',
    progress: { completed: 0, total: workload, percent: workload ? 0 : 100 },
    logs: [],
    cancelToken: { cancelled: false }
  };
  state.programs = [program, ...state.programs];
  return program;
}

export function updateProgramStatus(id, updates = {}) {
  state.programs = state.programs.map((program) => {
    if (program.id !== id) return program;
    const next = { ...program, ...updates };
    if (updates.progress) {
      const { completed, total } = updates.progress;
      next.progress = {
        completed,
        total,
        percent: percent(completed, total)
      };
    }
    return next;
  });
}

export function appendLog(programId, message, level = 'info') {
  state.programs = state.programs.map((program) => {
    if (program.id !== programId) return program;
    const logEntry = {
      timestamp: new Date().toISOString(),
      message,
      level
    };
    return { ...program, logs: [logEntry, ...(program.logs ?? [])].slice(0, 50) };
  });
}

export function appendResult(programId, result) {
  state.results = [{ programId, ...result }, ...state.results].slice(0, RESULT_LIMIT);
}

export function clearResults() {
  state.results = [];
}

export function getState() {
  return {
    counter: state.counter,
    programs: [...state.programs],
    results: [...state.results]
  };
}

export function markCancelled(programId) {
  state.programs = state.programs.map((program) => {
    if (program.id !== programId) return program;
    program.cancelToken.cancelled = true;
    return { ...program, status: 'cancelled' };
  });
}
