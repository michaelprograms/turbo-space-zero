import { styled } from 'styled-components';

export const ModalBackdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 200;
`;

export const ModalContent = styled.div`
  background: ${p => p.$theme?.backgroundColor || '#fff'};
  border-radius: 10px;
  padding: ${p => p.$wide ? '0' : '24px'};
  min-width: ${p => p.$wide ? '760px' : '400px'};
  max-width: ${p => p.$wide ? '820px' : '600px'};
  height: ${p => p.$wide ? '560px' : 'auto'};
  max-height: ${p => p.$wide ? '560px' : '70vh'};
  overflow: ${p => p.$wide ? 'hidden' : 'auto'};
  position: relative;
  &:focus { outline: none; }
`;

export const ModalTitle = styled.h3`
  margin: 0 0 16px 0;
  /* Wide dialogs zero out ModalContent padding, so the title needs its own. */
  padding: ${p => p.$wide ? '20px 24px 0' : '0'};
  font-size: 1.1rem;
  color: ${p => p.$theme?.textColor || '#222'};
`;

export const ModalCloseButton = styled.button`
  position: absolute;
  top: 12px;
  right: 12px;
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: ${p => p.$theme?.textSecondary || '#666'};
  padding: 4px 8px;
  &:hover { color: ${p => p.$theme?.textColor || '#222'}; }
`;

export const MapListRow = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
`;

export const MapListItem = styled.button`
  flex: 1;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid ${p => p.$theme?.borderColor || '#ddd'};
  background: ${p => p.$theme?.panelBackground || '#f9f9f9'};
  color: ${p => p.$theme?.textColor || '#111'};
  cursor: pointer;
  text-align: left;
  &:hover {
    background: ${p => p.$theme?.backgroundColor || '#eee'};
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  }
`;

export const DeleteMapButton = styled.button`
  flex: 0 0 auto;
  padding: 0 14px;
  border-radius: 8px;
  border: 1px solid ${p => p.$theme?.borderColor || '#ddd'};
  background: ${p => p.$theme?.panelBackground || '#f9f9f9'};
  color: ${p => p.$theme?.textSecondary || '#888'};
  cursor: pointer;
  &:hover:not(:disabled) {
    background: #c0392b;
    border-color: #c0392b;
    color: #fff;
  }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
`;

export const EmptyMessage = styled.p`
  color: ${p => p.$theme?.textSecondary || '#888'};
  font-size: 0.9rem;
  text-align: center;
  padding: 16px 0;
`;
