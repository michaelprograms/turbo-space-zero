import { styled } from 'styled-components';

export const DockWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 10px;
  background: ${props => props.$theme?.backgroundColor || '#ffffff'};
  border-top: 1px solid ${props => props.$theme?.borderColor || '#e5e5e5'};
`;

export const DockGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 40px);
  grid-template-rows: repeat(3, 40px);
  gap: 4px;
`;

export const DockButton = styled.button`
  width: 40px;
  height: 40px;
  border: 1px solid ${props => props.$theme?.borderColorLight || '#ccc'};
  border-radius: 8px;
  background: ${props => props.$theme?.panelBackground || '#f9f9f9'};
  color: ${props => props.$theme?.textColor || '#111'};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1rem;
  padding: 0;

  &:active {
    background: ${props => props.$theme?.accentColor || '#106ba3'};
    color: #fff;
  }
`;

export const DockCenter = styled.div`
  width: 40px;
  height: 40px;
`;

export const DockToggleButton = styled.button`
  padding: 8px 16px;
  border: 1px solid #7c3aed;
  border-radius: 8px;
  background: transparent;
  color: #7c3aed;
  cursor: pointer;
  font-size: 0.85rem;
  white-space: nowrap;

  &:hover {
    background: #7c3aed;
    color: #fff;
  }
`;
