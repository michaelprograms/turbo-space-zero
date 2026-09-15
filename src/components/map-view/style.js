import { styled } from 'styled-components';

export const MapWrapper = styled.div`
    display: flex;
    height: 100%;
    background: ${props => props.$theme?.canvasBackground || '#ffffff'};
    color: ${props => props.$theme?.textColor || '#222'};
`;

export const CanvasArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
`;

// Side-by-side 2D | 3D panes. min-*: 0 lets each pane shrink so both fit.
export const SplitContainer = styled.div`
  flex: 1;
  display: flex;
  min-height: 0;
`;

export const SplitPane = styled.div`
  flex: 1;
  min-width: 0;
  position: relative;
  overflow: hidden;
  /* Column flex so the 2D scroll area / 3D canvas get a bounded height to fill. */
  display: flex;
  flex-direction: column;

  & + & {
    border-left: 1px solid ${props => props.$theme?.borderColorLight || '#ccc'};
  }
`;

// display: flex by default (not none) so jsdom tests can find the element.
// Hidden on desktop via min-width media query — visually equivalent to the
// spec's max-width approach.
export const HamburgerButton = styled.button`
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 20;
  width: 36px;
  height: 36px;
  border: 1px solid ${props => props.$theme?.borderColorLight || '#ccc'};
  border-radius: 6px;
  background: ${props => props.$theme?.backgroundColor || '#fff'};
  color: ${props => props.$theme?.textColor || '#222'};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1rem;
  padding: 0;

  @media (min-width: 769px) {
    display: none;
  }
`;

export const DrawerBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 15;
`;

export const QuillBadge = styled.div`
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  background: #7c3aed;
  color: #fff;
  font-size: 0.75rem;
  padding: 3px 12px;
  border-radius: 12px;
  white-space: nowrap;
  pointer-events: none;
  z-index: 10;
`;