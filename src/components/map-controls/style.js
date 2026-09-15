import { styled } from 'styled-components';
import { ROOM_DEFAULTS } from '../../constants/room';

export const MapControlWrapper = styled.div`
  width: 280px;
  min-width: 280px;
  overflow-y: auto;
  background: ${props => props.$theme?.backgroundColor || '#ffffff'};
  color: ${props => props.$theme?.textColor || '#222'};
  transition: transform 0.2s ease;

  @media (max-width: 768px) {
    position: fixed;
    top: 0;
    left: 0;
    height: 100%;
    z-index: 20;
    transform: ${props => props.$open ? 'translateX(0)' : 'translateX(-280px)'};
  }
`;

export const MapControlFormGroup = styled.div`
  width: 100%;
`;

export const MapControlLabel = styled.label`
  display: block;
  width: 90%;
  margin: 10px auto;
  font-size: 0.95rem;
  color: ${props => props.$theme?.textColor || '#222'};
`;

export const MapControlColorLabel = styled.label`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 90%;
  margin: 10px auto;
  font-size: 0.95rem;
  color: ${props => props.$theme?.textColor || '#222'};
  opacity: ${props => props.$disabled ? 0.45 : 1};
`;

export const MapControlSlider = styled.input`
  width: 100%;
  margin-top: 8px;
`;

export const MapButtonGroupExits = styled.div`
  display: flex;
  flex-wrap: wrap;
  width: 122px;
  margin: 0 auto 10px auto;
  gap: 4px;
  justify-content: center;
  box-shadow: 0 0 0 2px ${props => props.$quillActive ? '#7c3aed' : 'transparent'};
  border-radius: 8px;
  padding: 0;
  transition: box-shadow 0.15s ease;
`;

export const MapControlButtonExit = styled.button`
  width: 38px;
  height: 38px;
  border: 1px solid ${props => props.$theme?.borderColorLight || '#ccc'};
  border-radius: 8px;
  background: ${props => props.$active ? props.$theme?.accentColor || '#106ba3' : props.$theme?.backgroundColor || '#fff'};
  color: ${props => props.$active ? '#fff' : props.$theme?.textColor || '#111'};
  display: inline-flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 2px;
  cursor: pointer;
  padding: 0;
  font-size: 0.95rem;
`;

export const ColorPillWrapper = styled.div`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: ${props => props.$color};
  border: 1px solid rgba(0, 0, 0, 0.18);
  opacity: ${props => props.$disabled ? 0.45 : 1};
  border-radius: ${props => props.$size === 'mini' ? '5px' : '13px'};
  width: ${props => props.$size === 'mini' ? '18px' : 'auto'};
  height: ${props => props.$size === 'mini' ? '10px' : '22px'};
  min-width: ${props => props.$size === 'mini' ? '18px' : '56px'};
  padding: ${props => props.$size === 'mini' ? '0' : '0 8px'};
`;

export const ColorPillHex = styled.span`
  font-family: monospace;
  font-size: 0.72rem;
  line-height: 1;
  pointer-events: none;
  user-select: none;
`;

// A span (not a <button>) so it can nest inside the exit-cell buttons without invalid markup.
export const ColorPillButton = styled.span`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
`;

export const ColorPopover = styled.div`
  position: fixed;
  z-index: 50;
  width: 200px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: ${props => props.$theme?.panelBackground || '#fff'};
  color: ${props => props.$theme?.textColor || '#222'};
  border: 1px solid ${props => props.$theme?.borderColorLight || '#ccc'};
  border-radius: 8px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.35);

  .react-colorful { width: 100%; height: 130px; }
  .react-colorful__saturation { border-radius: 6px 6px 0 0; }
  .react-colorful__hue { height: 14px; border-radius: 0 0 6px 6px; }

  input {
    width: 100%;
    box-sizing: border-box;
    padding: 4px 6px;
    font-family: monospace;
    text-transform: uppercase;
    background: ${props => props.$theme?.inputBackground || '#fff'};
    color: ${props => props.$theme?.textColor || '#222'};
    border: 1px solid ${props => props.$theme?.inputBorder || '#ccc'};
    border-radius: 5px;
  }
`;

export const SwatchGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 4px;
`;

export const Swatch = styled.button`
  width: 100%;
  aspect-ratio: 1;
  padding: 0;
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  background: ${props => props.$color};
  cursor: pointer;
  &:hover { outline: 2px solid ${props => props.$theme?.accentColor || '#106ba3'}; }
`;

export const PopoverLabel = styled.span`
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  opacity: 0.6;
`;

export const MapRoomSymbol = styled.div`
  width: 19px;
  height: 19px;
  box-sizing: border-box;

  border-style: solid;
  background-color: ${props => props.$fillColor !== undefined ? props.$fillColor : ROOM_DEFAULTS.fillColor };
  border-radius: ${props => props.$borderRadius !== undefined ? props.$borderRadius + '%' : '50%'};
  border-width: ${props => props.$borderWidth !== undefined ? props.$borderWidth + 'px' : '2px'};
  border-color: ${props => props.$borderColor !== undefined ? props.$borderColor : ROOM_DEFAULTS.borderColor};
`;

export const MapControlTextInput = styled.input`
  display: block;
  width: calc(90% - 12px);
  margin: 6px auto 0 auto;
  padding: 5px 6px;
  font-size: 0.9rem;
  font-family: inherit;
  border: 1px solid ${props => props.$theme?.borderColorLight || '#ccc'};
  border-radius: 4px;
  background: ${props => props.$theme?.panelBackground || '#f9f9f9'};
  color: ${props => props.$theme?.textSecondary || '#333'};

  &:focus {
    outline: none;
    border-color: ${props => props.$theme?.accentColor || '#106ba3'};
    background: ${props => props.$theme?.inputBackground || '#fff'};
  }
`;

export const SliderLabelRow = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  margin-top: 2px;

  span {
    font-size: 0.7rem;
    color: ${props => props.$theme?.textColor || '#222'};
    opacity: ${props => props.$disabled ? 0.4 : 0.6};
    line-height: 1;
  }
`;

export const MapSelectionCount = styled.div`
  text-align: center;
  font-size: 0.8rem;
  color: ${props => props.$theme?.textSecondary || '#333'};
  margin: 4px auto 8px;
  opacity: 0.8;
`;

export const NudgeCenterPlaceholder = styled.div`
  width: 38px;
  height: 38px;
`;

export const EdgeControlToggleButton = styled.button`
  width: 35px;
  height: 35px;
  border: 2px solid ${props => props.$active ? props.$theme?.accentColor || '#106ba3' : props.$theme?.borderColorLight || '#ccc'};
  border-radius: 8px;
  background: ${props => props.$active ? props.$theme?.accentColor || '#106ba3' : props.$theme?.backgroundColor || '#fff'};
  color: ${props => props.$active ? '#fff' : props.$theme?.textColor || '#111'};
  display: inline-flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  padding: 0;
  font-size: 1.1rem;
  font-weight: bold;
`;

export const LayerNavStrip = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 10px;
  border-bottom: 1px solid ${props => props.$theme?.borderColorLight || '#ccc'};
`;

export const LayerNavRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

export const LayerNavInfo = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.95rem;
  color: ${props => props.$theme?.textColor || '#222'};
  overflow: hidden;
`;

export const LayerNavName = styled.span`
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const LayerNavPosition = styled.span`
  font-size: 0.8rem;
  color: ${props => props.$theme?.textSecondary || '#666'};
  flex-shrink: 0;
`;

export const LayerNavButtons = styled.div`
  display: flex;
  gap: 4px;
  flex-shrink: 0;
`;

export const LayerNavButton = styled.button`
  width: 28px;
  height: 28px;
  border: 1px solid ${props => props.$theme?.borderColorLight || '#ccc'};
  border-radius: 6px;
  background: ${props => props.$theme?.backgroundColor || '#fff'};
  color: ${props => props.$theme?.textColor || '#222'};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 0.85rem;
  padding: 0;
  &:disabled { opacity: 0.3; cursor: default; }
  &:hover:not(:disabled) {
    background: ${props => props.$theme?.panelBackground || '#f9f9f9'};
    border-color: ${props => props.$theme?.accentColor || '#106ba3'};
  }
`;

export const LayerList = styled.div`
  max-height: 120px;
  overflow-y: auto;
  padding: 4px 0;
`;

export const LayerListRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 10px;
  cursor: pointer;
  font-size: 0.85rem;
  color: ${props => props.$active
    ? (props.$theme?.accentColor || '#106ba3')
    : (props.$theme?.textColor || '#222')};
  background: ${props => props.$active
    ? (props.$theme?.focusHighlight || '#D4E8F5')
    : 'transparent'};
  &:hover {
    background: ${props => props.$theme?.panelBackground || '#f9f9f9'};
  }
`;

export const LayerListDot = styled.span`
  font-size: 0.7rem;
  flex-shrink: 0;
`;

export const LayerListStar = styled.span`
  font-size: 0.75rem;
  flex-shrink: 0;
  cursor: pointer;
  color: ${props => props.$default
    ? '#f0c040'
    : (props.$theme?.textSecondary || '#888')};
  opacity: ${props => props.$default ? 1 : 0.4};
  &:hover { opacity: 1; color: #f0c040; }
`;

export const LayerListName = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const LayerRenameInput = styled.input`
  flex: 1;
  font-size: 0.85rem;
  font-family: inherit;
  background: ${props => props.$theme?.inputBackground || '#fff'};
  border: 1px solid ${props => props.$theme?.accentColor || '#106ba3'};
  border-radius: 4px;
  color: ${props => props.$theme?.textColor || '#222'};
  padding: 2px 6px;
  &:focus { outline: none; }
`;

export const LayerAddButton = styled.button`
  width: calc(100% - 20px);
  margin: 6px 10px;
  padding: 6px;
  background: none;
  border: 1px dashed ${props => props.$theme?.borderColorLight || '#ccc'};
  border-radius: 6px;
  color: ${props => props.$theme?.textSecondary || '#666'};
  font-size: 0.85rem;
  cursor: pointer;
  &:hover { border-color: ${props => props.$theme?.accentColor || '#106ba3'}; color: ${props => props.$theme?.textColor || '#222'}; }
`;

export const LayoutToggleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
`;

export const LayoutToggleLabel = styled.span`
  font-size: 0.75rem;
  color: ${props => props.$theme?.textSecondary || '#666'};
  margin-right: auto;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 700;
`;

export const LayoutToggleButton = styled.button`
  width: 28px;
  height: 28px;
  border: 1px solid ${props => props.$active
    ? (props.$theme?.accentColor || '#106ba3')
    : (props.$theme?.borderColorLight || '#ccc')};
  border-radius: 6px;
  background: ${props => props.$active
    ? (props.$theme?.accentColor || '#106ba3')
    : (props.$theme?.backgroundColor || '#fff')};
  color: ${props => props.$active ? '#fff' : (props.$theme?.textColor || '#222')};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 0.75rem;
  padding: 0;
  &:hover:not([disabled]) {
    border-color: ${props => props.$theme?.accentColor || '#106ba3'};
  }
`;

export const ClearBgButton = styled.button`
  border: none;
  background: none;
  cursor: pointer;
  font-size: 0.8rem;
  color: ${props => props.$theme?.accentColor || '#106ba3'};
  padding: 0 6px 0 0;
  &:hover { text-decoration: underline; }
`;

export const CollapsibleHeader = styled.button`
  display: flex;
  align-items: center;
  width: 100%;
  padding: 10px 12px;
  gap: 6px;
  background: ${props => props.$theme?.panelBackground || '#f5f5f5'};
  border: none;
  border-top: 1px solid ${props => props.$theme?.borderColor || '#e5e5e5'};
  cursor: pointer;
  text-align: left;
  color: inherit;
  &:hover { background: rgba(0, 0, 0, 0.06); }
`;

export const CollapsibleArrow = styled.span`
  font-size: 8px;
  color: ${props => props.$theme?.textSecondary || '#888'};
  display: inline-block;
  transform: ${props => props.$open ? 'rotate(90deg)' : 'rotate(0deg)'};
  transition: transform 0.15s ease;
  line-height: 1;
  flex-shrink: 0;
`;

export const CollapsibleTitle = styled.span`
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: ${props => props.$theme?.textSecondary || '#666'};
`;

export const CollapsibleBody = styled.div`
  padding: 2px 0 8px 0;
`;

export const PlaceholderRow = styled.div`
  display: flex;
  gap: 4px;
  margin: 3px 10px;
  padding: 5px 8px;
  border: 1px dashed ${props => props.$theme?.borderColorLight || '#ccc'};
  border-radius: 4px;
  opacity: 0.35;
  pointer-events: none;
  font-size: 0.8rem;
  color: ${props => props.$theme?.textSecondary || '#888'};
  font-style: italic;
`;

export const SidebarToggleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 90%;
  margin: 6px auto;
  font-size: 0.9rem;
  color: ${props => props.$theme?.textColor || '#222'};
`;

export const SidebarToggleSwitch = styled.button`
  width: 36px;
  height: 20px;
  border-radius: 10px;
  border: none;
  background: ${props => props.$on
    ? (props.$theme?.accentColor || '#106ba3')
    : (props.$theme?.borderColorLight || '#ccc')};
  position: relative;
  cursor: pointer;
  transition: background 0.2s;
  flex-shrink: 0;
  &::after {
    content: '';
    position: absolute;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: white;
    top: 3px;
    left: ${props => props.$on ? '19px' : '3px'};
    transition: left 0.2s;
  }
`;

export const MapNameStrip = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  border-bottom: 1px solid ${props => props.$theme?.borderColorLight || '#ccc'};
`;

export const MapNameDisplay = styled.span`
  flex: 1;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.95rem;
  color: ${props => props.$theme?.textColor || '#222'};
`;

export const MapNameEditInput = styled.input`
  flex: 1;
  font-size: 0.85rem;
  font-family: inherit;
  background: ${props => props.$theme?.inputBackground || '#fff'};
  border: 1px solid ${props => props.$theme?.accentColor || '#106ba3'};
  border-radius: 4px;
  color: ${props => props.$theme?.textColor || '#222'};
  padding: 2px 6px;
  &:focus { outline: none; }
`;

export const MapNameButton = styled.button`
  width: 28px;
  height: 28px;
  border: 1px solid ${props => props.$theme?.borderColorLight || '#ccc'};
  border-radius: 6px;
  background: ${props => props.$theme?.backgroundColor || '#fff'};
  color: ${props => props.$theme?.textColor || '#222'};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 0.85rem;
  padding: 0;
  flex-shrink: 0;
  &:disabled { opacity: 0.3; cursor: default; }
  &:hover:not(:disabled) {
    background: ${props => props.$theme?.panelBackground || '#f9f9f9'};
    border-color: ${props => props.$theme?.accentColor || '#106ba3'};
  }
`;

export const MapMetaTable = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 3px 10px;
  padding: 6px 10px;
`;

export const MapMetaLabel = styled.span`
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${props => props.$theme?.textSecondary || '#666'};
  line-height: 1.6;
`;

export const MapMetaValue = styled.span`
  font-size: 0.78rem;
  color: ${props => props.$theme?.textColor || '#222'};
  line-height: 1.6;
`;

export const ResizeHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 10px 2px;

  button {
    width: auto;
    min-width: 72px;
    padding: 0 8px;
  }
`;

export const GenerateSeedRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  width: 90%;
  margin: 6px auto 0 auto;

  input { flex: 1; margin: 0; }
  button {
    flex: 0 0 auto;
    padding: 5px 8px;
    font-size: 0.95rem;
    line-height: 1;
    border: 1px solid ${props => props.$theme?.borderColorLight || '#ccc'};
    border-radius: 4px;
    background: ${props => props.$theme?.backgroundColor || '#fff'};
    color: ${props => props.$theme?.textColor || '#111'};
    cursor: pointer;
  }
`;

export const GenerateButton = styled.button`
  display: block;
  width: 90%;
  margin: 12px auto 4px auto;
  padding: 8px;
  font-size: 0.9rem;
  font-family: inherit;
  border: 1px solid ${props => props.$theme?.accentColor || '#106ba3'};
  border-radius: 6px;
  background: ${props => props.$theme?.accentColor || '#106ba3'};
  color: #fff;
  cursor: pointer;

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;
