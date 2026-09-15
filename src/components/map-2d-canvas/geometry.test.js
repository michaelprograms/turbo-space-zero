import {
  getRoomRectSize,
  getRoomOffset,
  getExitLineReach,
  resolveExitColor,
  getUpArrowPoints,
  getDownArrowPoints,
  getMaxBorderWidth,
  pointerToCell,
} from './geometry.js';

describe('pointerToCell', () => {
  it('floors pointer px to a cell', () => {
    expect(pointerToCell(85, 47, 40, 10, 10)).toEqual({ x: 2, y: 1 });
  });
  it('returns null when outside the grid bounds', () => {
    expect(pointerToCell(410, 0, 40, 10, 10)).toBeNull();
    expect(pointerToCell(-1, 0, 40, 10, 10)).toBeNull();
  });
});

describe('getMaxBorderWidth', () => {
  it('uses the (cellSize − roomSize) / 2 spec at defaults', () => {
    expect(getMaxBorderWidth(40, 25)).toBe(7); // floor(7.5)
  });
  it('caps at roomSize − 2 so the fill never collapses (spec alone would overflow)', () => {
    expect(getMaxBorderWidth(40, 12)).toBe(10); // spec would be 14
    expect(getMaxBorderWidth(80, 12)).toBe(10); // spec would be 34
  });
  it('never drops below 1, even when the room is larger than the cell', () => {
    expect(getMaxBorderWidth(20, 38)).toBe(1); // spec would be −9
    expect(getMaxBorderWidth(40, 38)).toBe(1);
  });
});

describe('getRoomRectSize', () => {
  it('subtracts borderWidth from roomSize so outer visual equals roomSize', () => {
    expect(getRoomRectSize(25, 4)).toBe(21);
  });

  it('works with other border widths', () => {
    expect(getRoomRectSize(25, 2)).toBe(23);
    expect(getRoomRectSize(30, 6)).toBe(24);
  });
});

describe('getRoomOffset', () => {
  it('centers the room rect within the cell', () => {
    // konvaRectSize = 25 - 4 = 21; offset = (40 - 21) / 2 = 9.5
    expect(getRoomOffset(40, 25, 4)).toBe(9.5);
  });

  it('updates correctly with different cellSize', () => {
    // konvaRectSize = 25 - 4 = 21; offset = (80 - 21) / 2 = 29.5
    expect(getRoomOffset(80, 25, 4)).toBe(29.5);
  });

  it('returns negative offset when room exceeds cellSize', () => {
    // konvaRectSize = 38 - 1 = 37; offset = (20 - 37) / 2 = -8.5
    expect(getRoomOffset(20, 38, 1)).toBe(-8.5);
  });
});

describe('getExitLineReach', () => {
  it('returns distance from center to line endpoint at default values', () => {
    // reach = roomSize/2 + cellSize * 0.175 = 12.5 + 7 = 19.5
    expect(getExitLineReach(25, 40)).toBe(19.5);
  });

  it('scales stub proportionally with cellSize', () => {
    // reach = 12.5 + 80 * 0.175 = 12.5 + 14 = 26.5
    expect(getExitLineReach(25, 80)).toBe(26.5);
  });

  it('accounts for different roomSize', () => {
    // reach = 15 + 40 * 0.175 = 15 + 7 = 22
    expect(getExitLineReach(30, 40)).toBe(22);
  });

  it('can exceed cellSize/2 at max roomSize with small cell', () => {
    // reach = 19 + 20*0.175 = 22.5 > cellSize/2 = 10
    expect(getExitLineReach(38, 20)).toBe(22.5);
  });
});

test('resolveExitColor returns custom color when set in exitColors', () => {
  const room = { exitColors: { north: '#ff0000' } };
  expect(resolveExitColor(room, 'north')).toBe('#ff0000');
});

test('resolveExitColor returns default when no exitColors entry', () => {
  const room = { exits: { north: true } };
  expect(resolveExitColor(room, 'north')).toBe('#666666');
});

test('resolveExitColor returns default when exitColors is absent', () => {
  expect(resolveExitColor({}, 'north')).toBe('#666666');
});

test('resolveExitColor returns default when room is null or undefined', () => {
  expect(resolveExitColor(null, 'north')).toBe('#666666');
  expect(resolveExitColor(undefined, 'north')).toBe('#666666');
});

test('getUpArrowPoints: apex at room top, base at cell center, symmetric', () => {
  // roomSize=20, cellSize=40, localCenterX=20
  // apexY = (40-20)/2 + 2 = 12, baseY = 20, baseHalfW = 10*0.55 = 5.5
  const pts = getUpArrowPoints(20, 40, 20);
  expect(pts).toEqual([20, 12, 14.5, 20, 25.5, 20]);
});

test('getDownArrowPoints: apex at room bottom, base at cell center, symmetric', () => {
  // roomSize=20, cellSize=40, localCenterX=20
  // apexY = (40+20)/2 - 2 = 28, baseY = 20, baseHalfW = 5.5
  const pts = getDownArrowPoints(20, 40, 20);
  expect(pts).toEqual([20, 28, 14.5, 20, 25.5, 20]);
});
