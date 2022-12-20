import React, { useMemo } from "react";
import { StateContext, Store } from "./handle";

type ProviderProps = {
  children: React.ReactNode;
  initialStateProvider?: any;
  store: Store;
};
const Provider = ({
  children,
  initialStateProvider,
  store,
}: ProviderProps) => {
  const contextValue = useMemo(() => {
    if (initialStateProvider) {
      store.setState(initialStateProvider);
    }
    return { store };
  }, []);
  return (
    <StateContext.Provider value={contextValue}>
      {children}
    </StateContext.Provider>
  );
};
export default Provider;
