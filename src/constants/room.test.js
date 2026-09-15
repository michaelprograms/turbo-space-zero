// src/constants/room.test.js
import { ROOM_DEFAULTS, EXIT_DEFAULT_COLOR, EXIT_ARROW_COLORS } from './room';

describe('room constants', () => {
  it('ROOM_DEFAULTS matches the historical inline defaults', () => {
    expect(ROOM_DEFAULTS).toEqual({
      roomSize: 25,
      borderWidth: 4,
      borderRadius: 50,
      borderColor: '#666666',
      fillColor: '#999999',
    });
  });

  it('exit color constants match the historical literals', () => {
    expect(EXIT_DEFAULT_COLOR).toBe('#666666');
    expect(EXIT_ARROW_COLORS).toEqual({ up: '#f0c040', down: '#40a0f0' });
  });
});
