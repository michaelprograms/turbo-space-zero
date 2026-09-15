import { styled } from 'styled-components';

export const TutorialLayout = styled.div`
  display: flex;
  height: 480px;
`;

export const TutorialSidebar = styled.div`
  width: 200px;
  flex-shrink: 0;
  border-right: 1px solid ${p => p.$theme?.borderColor || '#ddd'};
  overflow-y: auto;
  padding: 12px 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export const TutorialCategoryLabel = styled.div`
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: ${p => p.$theme?.textSecondary || '#999'};
  padding: 10px 8px 5px;
  &:first-child { padding-top: 0; }
`;

export const TutorialFeatureButton = styled.button`
  display: block;
  width: 100%;
  text-align: left;
  padding: 6px 10px;
  border: none;
  border-radius: 5px;
  font-size: 10pt;
  font-family: inherit;
  cursor: pointer;
  background: ${p => p.$active ? p.$theme?.accentColor || '#106ba3' : 'transparent'};
  color: ${p => p.$active ? '#fff' : p.$theme?.textSecondary || '#888'};
  &:hover {
    background: ${p => p.$active
      ? p.$theme?.accentColor || '#106ba3'
      : p.$theme?.panelBackground || 'rgba(0,0,0,0.05)'};
  }
`;

export const TutorialMain = styled.div`
  flex: 1;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow: hidden;
  min-width: 0;
`;

export const TutorialDemoTitle = styled.h3`
  margin: 0;
  font-size: 13px;
  color: ${p => p.$theme?.textColor || '#222'};
`;

export const TutorialDemoDescription = styled.p`
  margin: 0;
  font-size: 10pt;
  color: ${p => p.$theme?.textSecondary || '#888'};
  line-height: 1.6;
`;

export const TutorialCanvasWrapper = styled.div`
  flex: 1;
  border: 1px solid ${p => p.$theme?.borderColor || '#ddd'};
  border-radius: 6px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${p => p.$theme?.backgroundColor || '#f9f9f9'};
  min-height: 0;
`;

export const TutorialFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
`;

export const TutorialProgress = styled.span`
  font-size: 9px;
  color: ${p => p.$theme?.textSecondary || '#999'};
`;

export const TutorialNavButton = styled.button`
  padding: 4px 12px;
  border: none;
  border-radius: 4px;
  font-size: 10pt;
  font-family: inherit;
  cursor: ${p => p.disabled ? 'not-allowed' : 'pointer'};
  background: ${p => p.$primary
    ? p.$theme?.accentColor || '#106ba3'
    : p.$theme?.panelBackground || '#eee'};
  color: ${p => p.$primary ? '#fff' : p.$theme?.textSecondary || '#666'};
  opacity: ${p => p.disabled ? 0.4 : 1};
`;
