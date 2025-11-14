const state = {
  activePrograms: [],
  results: [],
  notifications: [],
  programCounter: 0
};

const bus = new EventTarget();

const emit = (event, detail) => {
  bus.dispatchEvent(new CustomEvent(event, { detail }));
};

export const subscribe = (event, handler) => {
  bus.addEventListener(event, handler);
  return () => bus.removeEventListener(event, handler);
};

export const getState = () => structuredClone(state);

export const addNotification = (message, variant = 'info') => {
  const entry = { id: crypto.randomUUID(), message, variant, timestamp: Date.now() };
  state.notifications.unshift(entry);
  emit('notification', entry);
  return entry;
};

export const clearNotification = (id) => {
  state.notifications = state.notifications.filter((note) => note.id !== id);
  emit('notification:remove', id);
};

export const createProgram = ({ name, providerId, apiKey, tickers, timeframes, outfits, notes }) => {
  const program = {
    id: `program-${++state.programCounter}`,
    name,
    providerId,
    apiKey: apiKey || null,
    tickers,
    timeframes,
    outfits,
    notes,
    status: 'queued',
    createdAt: Date.now(),
    startedAt: null,
    completedAt: null,
    logs: [],
    summary: {}
  };
  state.activePrograms.unshift(program);
  emit('program:create', structuredClone(program));
  return program;
};

export const updateProgram = (programId, updates) => {
  const idx = state.activePrograms.findIndex((p) => p.id === programId);
  if (idx === -1) return null;
  state.activePrograms[idx] = { ...state.activePrograms[idx], ...updates };
  emit('program:update', structuredClone(state.activePrograms[idx]));
  return state.activePrograms[idx];
};

export const completeProgram = (programId, status = 'completed', summary = {}) => {
  return updateProgram(programId, {
    status,
    completedAt: Date.now(),
    summary
  });
};

export const addProgramLog = (programId, message, level = 'info') => {
  const program = state.activePrograms.find((p) => p.id === programId);
  if (!program) return;
  const entry = { timestamp: Date.now(), message, level };
  program.logs.push(entry);
  emit('program:log', { programId, entry });
  return entry;
};

export const addResult = (result) => {
  state.results.unshift(result);
  emit('results:update', result);
  return result;
};

export const purgeResults = () => {
  state.results = [];
  emit('results:reset', null);
};
