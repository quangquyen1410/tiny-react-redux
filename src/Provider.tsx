import { useMemo } from "react";
import { StateContext } from "src/stores/base";
import { Store } from "./handle";

type ProviderProps = {
  children: React.ReactNode;
  initialStateProvider: any;
  store: Store;
};
const StoreProvider = ({
  children,
  initialStateProvider,
  store,
}: ProviderProps) => {
  const contextValue = useMemo(() => {
    store.setState(initialStateProvider);
    return { store };
  }, [initialStateProvider, store]);
  return (
    <StateContext.Provider value={contextValue}>
      {children}
    </StateContext.Provider>
  );
};
export default StoreProvider;
