import { styled } from 'styled-components';

export const MenuBarWrapper = styled.div`
  position: sticky;
  top: 0;
  z-index: 10;
  background: ${props => props.$theme?.panelBackground || '#1a1a2e'};
`;

export const TabBar = styled.div`
  display: flex;
  border-bottom: 1px solid ${props => props.$theme?.borderColor || '#333'};
`;

export const Tab = styled.button`
  flex: 1;
  padding: 9px 4px;
  border: none;
  border-bottom: 2px solid ${props => props.$active ? props.$theme?.accentColor || '#106ba3' : 'transparent'};
  background: ${props => props.$active ? 'rgba(0, 0, 0, 0.12)' : 'none'};
  color: ${props => props.$active
    ? props.$theme?.accentColor || '#106ba3'
    : props.$theme?.textSecondary || '#888'};
  font-size: 10pt;
  font-family: inherit;
  cursor: pointer;
  text-align: center;
  transition: background 0.1s;

  &:hover {
    background: rgba(0, 0, 0, 0.08);
  }
`;

export const DropdownPanel = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  z-index: 50;
  background: ${props => props.$theme?.backgroundColor || '#141428'};
  border-bottom: 3px solid ${props => props.$theme?.borderColor || '#333'};
`;

export const MenuItem = styled.div`
  display: flex;
  align-items: center;
  padding: 8px 10px;
  gap: 8px;
  border-bottom: 1px solid ${props => props.$theme?.borderColor || '#1e1e38'};
  cursor: ${props => props.$todo ? 'not-allowed' : 'pointer'};

  &:last-child {
    border-bottom: none;
  }

  ${props => !props.$todo && `
    &:hover {
      background: ${props.$theme?.panelBackground || 'rgba(255, 255, 255, 0.05)'};
    }
  `}
`;

export const MenuItemLabel = styled.span`
  flex: 1;
  font-size: 10pt;
  color: ${props => props.$todo
    ? (props.$theme?.textSecondary ? props.$theme.textSecondary + '88' : '#555')
    : props.$theme?.textColor || '#eee'};
`;

export const MenuItemShortcut = styled.span`
  font-size: 9pt;
  white-space: nowrap;
  color: ${props => props.$todo
    ? (props.$theme?.borderColorLight ? props.$theme.borderColorLight + '99' : '#3a3a5a')
    : props.$theme?.textSecondary || '#888'};
`;

export const ToggleRow = styled.div`
  display: flex;
  align-items: center;
  padding: 8px 10px;
  gap: 8px;
  border-bottom: 1px solid ${props => props.$theme?.borderColor || '#1e1e38'};
`;

export const ToggleLabel = styled.span`
  flex: 1;
  font-size: 10pt;
  color: ${props => props.$theme?.textColor || '#eee'};
`;

export const ToggleSwitch = styled.div`
  width: 34px;
  height: 18px;
  background: ${props => props.$on ? '#4caf50' : props.$theme?.borderColorLight || '#555'};
  border-radius: 9px;
  position: relative;
  flex-shrink: 0;
  cursor: pointer;
  transition: background 0.15s;

  &::after {
    content: '';
    width: 14px;
    height: 14px;
    background: white;
    border-radius: 50%;
    position: absolute;
    top: 2px;
    left: ${props => props.$on ? '16px' : '2px'};
    transition: left 0.15s;
  }
`;

export const ZoomRow = styled.div`
  display: flex;
  flex-direction: column;
  padding: 8px 10px;
  gap: 6px;
`;

export const ZoomLabel = styled.span`
  flex: 1;
  font-size: 10pt;
  color: ${props => props.$theme?.textColor || '#eee'};
`;

export const ZoomValue = styled.span`
  font-size: 11px;
  color: ${props => props.$theme?.textSecondary || '#888'};
`;

