import { styled } from 'styled-components';

export const TilingGrid = styled.div`
  display: grid;
  flex: 1;
  overflow: auto;
  gap: 4px;
  padding: 4px;
  background: ${props => props.$theme?.canvasOutOfBounds || '#dddddd'};
  grid-template-columns: ${props => props.$columns || '1fr'};
`;

export const TileWrapper = styled.div`
  position: relative;
  border: 2px solid ${props => props.$focused
    ? (props.$theme?.accentColor || '#106ba3')
    : 'transparent'};
  border-radius: 4px;
  overflow: hidden;
`;

export const TileLabel = styled.div`
  position: absolute;
  top: 4px;
  left: 6px;
  font-size: 0.7rem;
  font-weight: 600;
  color: ${props => props.$theme?.textSecondary || '#666'};
  background: ${props => props.$theme?.backgroundColor || '#fff'};
  padding: 1px 6px;
  border-radius: 3px;
  opacity: 0.85;
  z-index: 1;
  pointer-events: none;
`;
