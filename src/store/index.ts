import { configureStore } from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import orderbooksReducer from "./orderbooksSlice";
import simulationsReducer from "./simulationsSlice";
import uiReducer from "./uiSlice";
import { wsMiddleware } from "./wsMiddleware";

export const store = configureStore({
  reducer: {
    orderbooks: orderbooksReducer,
    sims: simulationsReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [],
      },
    }).concat(wsMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch: () => AppDispatch = () =>
  useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
