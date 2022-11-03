import {
  createContext,
  Dispatch,
  useContext,
  useSyncExternalStore,
} from "react";

export type PayloadAction<P = any, T = string> = {
  payload?: P;
  type: T;
};
type Reducer<S = any, A = PayloadAction> = (state: S, action: A) => S;
type Slice<S = any> = {
  name: string;
  initialState: S;
  reducer: Reducer<S>;
  actions: CaseActionCreator<SliceCaseReducer<S>>;
};
type RootSlice<S> = {
  [K in keyof S]: Slice<S[K]>;
};
type ActionCreator = <P = any>(payload?: P) => PayloadAction<P>;
type CaseActionCreator<CR> = {
  [K in keyof CR]: ActionCreator;
};
type SliceCaseReducer<S> = {
  [K: string]: Reducer<S>;
};
type SliceOptions<
  S = any,
  CaseReducers extends SliceCaseReducer<S> = SliceCaseReducer<S>
> = {
  name: string;
  initialState: S;
  reducers: CaseReducers;
};
export type TypedUseAppSelector<S> = () => S;
export type Store<S = any> = {
  getState: () => S;
  dispatch: Dispatch<PayloadAction>;
  subscribe: (listener: () => void) => () => void;
  setState: (state: S) => void;
  getInitialState: () => S;
};
export function createStore<S>(
  rootSlice: RootSlice<S>
): Store<S> {
  let isDispatching = false;
  const slices = Object.entries(rootSlice) as [keyof S, RootSlice<S>[keyof S]][];
  const initialState = slices.reduce((prev, [key, value]) => {
    return { ...prev, [key]: value.initialState };
  }, {} as S);
  let currentState = initialState;
  const getState = () => currentState;
  const setState = (state: S) => {
    // set current state to the new state
    currentState = state;
  };
  const getInitialState = () => initialState;
  const reducers = (state: S, action: PayloadAction) => {
    const sliceKey = getSliceKey(action.type);
    const slice = rootSlice[sliceKey as keyof RootSlice<S>];
    let currentState = slice.reducer(state[sliceKey as keyof S], action);
    state = { ...state, [sliceKey]: { ...currentState } };
    return state;
  };
  const listeners = new Set<Function>();
  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };
  const dispatch: Dispatch<PayloadAction> = (action) => {
    try {
      isDispatching = true;
      currentState = reducers(currentState, action);
    } finally {
      isDispatching = false;
    }
    listeners.forEach((l) => l());
  };
  return {
    getState,
    dispatch,
    subscribe,
    setState,
    getInitialState,
  };
}
interface StateContext<S = any> {
  store: Store<S>;
}
export const StateContext = createContext<StateContext>(null as any);
export const useSelector = () => {
  const { store } = useContext(StateContext);
  return useSyncExternalStore(store.subscribe, store.getState, store.getState);
};
export const useDispatch = () => {
  const { store } = useContext(StateContext);
  return store.dispatch;
};
const getReducerType = (sliceName: string, reducerName: string) => {
  return `${sliceName}/${reducerName}`;
};
const getSliceKey = (type: string) => {
  return type.split("/")[0];
};
const createAction = <P = any>(type: string) => {
  return (payload?: P) => {
    return { type, payload };
  };
};
export function createSlice<S>(
  options: SliceOptions<S>
): Slice<S> {
  const { initialState, reducers, name } = options;
  if (!name) {
    throw new Error("`name` is a required option for createSlice");
  }
  const caseReducers: Record<string, Reducer<S>> = {};
  const actionCreators: Record<string, ActionCreator> = {};
  for (const reducerName in reducers) {
    const type = getReducerType(name, reducerName);
    caseReducers[type] = reducers[reducerName];
    actionCreators[reducerName] = createAction(type);
  }
  return {
    name,
    reducer: (state, action) => {
      const reducer = caseReducers[action.type];
      if (!reducer) {
        throw new Error(`Action ${action.type} not found`);
      }
      const newState = reducer(state, action);
      return newState;
    },
    initialState,
    actions: actionCreators as CaseActionCreator<SliceCaseReducer<S>>,
  };
}
