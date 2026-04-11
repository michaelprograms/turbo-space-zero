import { styled } from 'styled-components';

export const AboutHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 20px;
`;

export const AboutLogoSlot = styled.div`
  flex-shrink: 0;
  line-height: 0;
  img { display: block; width: 44px; height: 44px; border-radius: 8px; }
`;

export const AboutAppName = styled.div`
  font-size: 15px;
  font-weight: bold;
  color: ${p => p.$theme?.textColor || '#222'};
  margin-bottom: 2px;
`;

export const AboutVersion = styled.div`
  font-size: 10px;
  color: ${p => p.$theme?.textSecondary || '#888'};
`;

export const AboutDescription = styled.p`
  margin: 0 0 20px;
  font-size: 10pt;
  line-height: 1.7;
  color: ${p => p.$theme?.textColor || '#555'};
`;

export const AboutSectionLabel = styled.div`
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: ${p => p.$theme?.textSecondary || '#999'};
  margin-bottom: 8px;
`;

export const AboutChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 20px;
`;

export const AboutChip = styled.span`
  background: ${p => p.$theme?.panelBackground || '#f0f0f0'};
  color: ${p => p.$theme?.textSecondary || '#666'};
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 10px;
`;

export const AboutFooter = styled.div`
  border-top: 1px solid ${p => p.$theme?.borderColor || '#eee'};
  padding-top: 16px;
  display: flex;
  gap: 12px;
  align-items: center;
`;

export const AboutLink = styled.a`
  color: ${p => p.$theme?.accentColor || '#106ba3'};
  font-size: 11px;
  text-decoration: none;
  &:hover { text-decoration: underline; }
`;

export const AboutLinkSubtext = styled.span`
  font-size: 10px;
  color: ${p => p.$theme?.textSecondary || '#999'};
`;
