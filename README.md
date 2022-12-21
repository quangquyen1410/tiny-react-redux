# Tiny React Redux

![GitHub Workflow Status](https://img.shields.io/github/workflow/status/reduxjs/redux-toolkit/CI?style=flat-square)
[![npm version](https://img.shields.io/npm/v/tiny-react-redux.svg?style=flat-square)](https://www.npmjs.com/package/tiny-react-redux)
[![npm downloads](https://img.shields.io/npm/dm/tiny-react-redux.svg?style=flat-square&label=RTK+downloads)](https://www.npmjs.com/package/tiny-react-redux)

**The simple store like redux + react-redux + @redux/toolkit but smaller**

## Installation


Tiny React Redux is available as a package on NPM for use with a module bundler or in a Node application:
# NPM
```bash
npm install tiny-react-redux
```
# Yarn
```bash
yarn add tiny-react-redux
```

## Purpose

The **Tiny React Redux** package is a package like `redux`. But it allow you using them like `react redux` and `@redux/toolkit`.

## What's Included

Tiny React Redux includes these APIs:

- `createStore()`: It can automatically combine your slice reducers.
- `createSlice()`: Accepts an object of reducer functions, a slice name, and an initial state value, and automatically generates a slice reducer with corresponding action creators and action types

## How to use

Create file `store/cart.ts`:

```ts
import { toast } from "react-toastify";
import axios from "axios";
import { store } from ".";
import { createSlice, PayloadAction } from "tiny-react-redux";
interface CartItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}
export type CartState = {
  miniCart: CartItem[];
};
const cartState: CartState = {
  miniCart: [],
};

const cartSlice = createSlice({
  name: "cart",
  initialState: cartState,
  reducers: {
    addToCart(state, action: PayloadAction<CartItem>) {
      state.miniCart = [...state.miniCart, action.payload]
      return state;
    },
  },
});
const { addToCart } = cartSlice.actions;
const CART_API = "api/cart";
export const addToCartToApi = async (cartItem: CartItem) => {
  try {
    const { data } = await axios.post<CartItem>(CART_API, { cartItem });
    store.dispatch(addToCart(data));
  } catch (error) {
    console.error(error);
  }
};
export default cartSlice;
```

Create file `store/index.ts`:

```ts
import {
  createStore,
  TypedUseAppSelector,
  useSelector,
} from "tiny-react-redux";
import cartSlice from "./cart";

const rootSlice = {
  cart: cartSlice,
};
export const store = createStore(rootSlice);
export const useAppSelector: TypedUseAppSelector<
  ReturnType<typeof store.getState>
> = useSelector;
```

and in the file `App.tsx`:

```tsx
import { Provider as StoreProvider } from "tiny-react-redux";
function MyApp() {
  return (
    <StoreProvider store={store}>
      <Component />
    </StoreProvider>
  );
}
export default MyApp;
```

Server side rendering with `Nextjs`, in the file `_app.tsx`:

```tsx
import type { AppProps } from "next/app";
function MyApp({ Component, pageProps }: AppProps) {
  const initState = useMemo(() => {
    const initialState = store.getInitialState();
    return {
    ...initialState,
    ...{
      cart: {
        miniCart: pageProps.miniCart || initialState.cart.miniCart,
      },
    },
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <StoreProvider initialStateProvider={initState} store={store}>
      <Component {...pageProps} />
    </StoreProvider>
  );
}

export default MyApp;
```

in the `component`;

```tsx
import { useAppSelector } from "src/store";
import { useDispatch } from "tiny-react-redux";
import { addToCartToApi, addToCart } from "src/store/cart";
const Component = () => {
  const miniCart = useAppSelector(state => state.cart.miniCart);
  const dispatch = useDispatch();
  const onDispatchMiniCart = () => {
    dispatch(addToCart(/*cartItem*/));
  };
  const callApiAndDispatch = () => {
    addToCartToApi(/*cartItem*/);
  };
  return <div>{miniCart.map((item) => item.name)}</div>;
};
```
