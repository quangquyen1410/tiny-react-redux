import {
  createContext,
  Dispatch,
  useContext,
  useSyncExternalStore,
} from "react";
export type PayloadAction<P = any, T = string> = {
  payload: P;
  type: T;
};
type Reducer<S = any, A = PayloadAction> = (state: S, action: A) => void | S;
type Slice<S, CR> = {
  name: string;
  initialState: S;
  reducer: Reducer<S>;
  actions: CaseActionCreator<SliceCaseReducers<CR>>;
};
type RootSlice<S, CR> = {
  [K in keyof S]: Slice<S[K], CR>;
};
type ActionCreator<P = any> = (payload: P) => PayloadAction<P>;
type ActionCreatorWithoutPayload = () => PayloadAction;
type ActionCreatorReducer<CR> = CR extends (
  state: any,
  action: infer Action
) => void
  ? Action extends { payload: infer P }
    ? ActionCreator<P>
    : ActionCreatorWithoutPayload
  : ActionCreatorWithoutPayload;
type CaseActionCreator<CR> = {
  [K in keyof CR]: ActionCreatorReducer<CR[K]>;
};
type SliceCaseReducers<CR> = {
  [K in keyof CR]: CR[K];
};
type SliceOptions<S, CR> = {
  name: string;
  initialState: S;
  reducers: SliceCaseReducers<CR>;
};
export type TypedUseAppSelector<S> = <R>(selector: (state: S) => R) => R;
export type Store<S = any> = {
  getState: () => S;
  dispatch: Dispatch<PayloadAction>;
  subscribe: (listener: () => void) => () => void;
  setState: (state: S) => void;
  getInitialState: () => S;
  getStateBySelector: <R>(selector: (state: S) => R) => R;
};
export function createStore<S, CR>(rootSlice: RootSlice<S, CR>): Store<S> {
  let isDispatching = false;
  const slices = Object.entries(rootSlice) as [
    keyof S,
    RootSlice<S, CR>[keyof S]
  ][];
  const initialState = slices.reduce((prev, [key, value]) => {
    return { ...prev, [key]: value.initialState };
  }, {} as S);
  let currentState = initialState;
  const getState = () => currentState;
  const getStateBySelector = <R>(selector: (state: S) => R) => {
    return selector(currentState);
  };
  const setState = (state: S) => {
    // set current state to the new state
    currentState = deepCopy(state);
  };
  const getInitialState = () => initialState;
  const reducers = (state: S, action: PayloadAction) => {
    const sliceKey = getSliceKey(action.type);
    const slice = rootSlice[sliceKey as keyof RootSlice<S, CR>];
    const stateByKey = state[sliceKey as keyof S];
    const newState = slice.reducer(stateByKey, action);
    return deepCopy({
      ...state,
      [sliceKey]: newState || stateByKey,
    });
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
    getStateBySelector,
  };
}
interface StateContext<S = any> {
  store: Store<S>;
}
export const StateContext = createContext<StateContext>(null as any);
export const useSelector: TypedUseAppSelector<any> = (selector) => {
  const { store } = useContext(StateContext);
  const getState = () => store.getStateBySelector(selector);
  return useSyncExternalStore(store.subscribe, getState, getState);
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
  return (payload: P) => {
    return { type, payload };
  };
};
export function createSlice<S, CR extends Record<string, Reducer<S>>>(
  options: SliceOptions<S, CR>
): Slice<S, CR> {
  const { initialState, reducers, name } = options;
  if (!name) {
    throw new Error("`name` is a required option for createSlice");
  }
  const caseReducers: CR = {} as CR;
  const actionCreators: CaseActionCreator<CR> = {} as CaseActionCreator<CR>;
  for (const reducerName in reducers) {
    const type = getReducerType(name, reducerName);
    caseReducers[type as keyof CR] = reducers[reducerName];
    actionCreators[reducerName] = createAction(type) as any;
  }
  return {
    name,
    reducer: (state, action) => {
      const reducer = caseReducers[action.type];
      if (!reducer) {
        throw new Error(`Action ${action.type} not found`);
      }
      return reducer(state, action);
    },
    initialState,
    actions: actionCreators,
  };
}
/**
 * Deep copy object
 *
 * Example:
 *
 * ```javascript
 * const originalObject = { a: 1, b: { c: 2 } };
 * const deepCopy = deepCopy(originalObject);
 * console.log(deepCopy); // Output: { a: 1, b: { c: 2 } }
 * ```
 * @param  {T} obj
 * @returns T
 */
const deepCopy = <T>(obj: T): T => {
  if (typeof obj !== "object" || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(deepCopy) as any;
  }

  const copy = {} as T;
  for (const key in obj) {
    copy[key] = deepCopy(obj[key]);
  }

  return copy;
};
