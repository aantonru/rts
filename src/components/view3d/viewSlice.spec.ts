import viewReducer, {
    ViewState,
    play
} from './ViewSlice';

describe('view reducer', () => {
  const initialState: ViewState = {
    width: 0,
    height: 0,
    paused: false,
    ready: false
  };
  it('should handle initial state', () => {
    expect(viewReducer(undefined, { type: 'unknown' })).toEqual({
        width: 0,
        height: 0,
        paused: false,
        ready: false
    });
  });

    it('should handle play', () => {
        const actual = viewReducer(initialState, play());
    // expect(actual.value).toEqual(4);
    });
});