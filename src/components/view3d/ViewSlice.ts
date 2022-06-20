import { createSlice } from '@reduxjs/toolkit';

export interface ViewState {
  width: number;
  height: number;
  paused: boolean;
  ready: boolean;
}

const initialState: ViewState = {
  width: 0,
  height: 0,
  paused: false,
  ready: false
};

export const viewSlice = createSlice({
   // width: 0,
    name: 'view3d',
  //  height: 0,
    initialState,
  // The `reducers` field lets us define reducers and generate associated actions
    reducers: {
        play: (state) => {

        }
    }
  });

export const { play } = viewSlice.actions;

export default viewSlice.reducer;