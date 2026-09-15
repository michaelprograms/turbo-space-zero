// src/components/map-2d-canvas/style.js
import { styled } from 'styled-components';

export const CanvasScrollArea = styled.div`
  overflow: scroll;
  flex: 1;
  background: ${({ $background }) => $background || '#ffffff'};
`;

// Full-map-sized spacer that drives the native scrollbars. The Konva Stage is
// only viewport-sized and pinned (sticky) to the scrollport corner, so the
// canvas stays small no matter how large the map is (viewport virtualization).
export const CanvasSpacer = styled.div`
  position: relative;
  width: ${({ $w }) => $w}px;
  height: ${({ $h }) => $h}px;
`;

// Zero-size so it always fits inside the spacer (in both axes) and therefore
// sticks reliably to the scrollport corner; the Stage overflows from here.
export const StagePin = styled.div`
  position: sticky;
  top: 0;
  left: 0;
  width: 0;
  height: 0;
  overflow: visible;
`;
