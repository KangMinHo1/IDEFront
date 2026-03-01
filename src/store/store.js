import { configureStore } from '@reduxjs/toolkit';
import fileSystemReducer from './slices/fileSystemSlice';
import uiReducer from './slices/uiSlice';
import problemReducer from './slices/problemSlice'; // [필수]

export const store = configureStore({
  reducer: {
    fileSystem: fileSystemReducer,
    ui: uiReducer,
    problems: problemReducer, // [필수] 여기에 등록되어야 에러 없이 작동함
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Monaco Editor 객체 에러 방지
    }),
});