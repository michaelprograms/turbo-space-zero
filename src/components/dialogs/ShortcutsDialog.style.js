import { styled } from 'styled-components';

export const ShortcutsContainer = styled.div`
  min-width: 460px;
`;

export const ShortcutGroup = styled.div`
  margin-bottom: 20px;
  &:last-child { margin-bottom: 0; }
`;

export const ShortcutGroupLabel = styled.div`
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: ${p => p.$theme?.textSecondary || '#999'};
  margin-bottom: 6px;
  padding: 0 2px;
`;

export const ShortcutTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  /* Fixed widths so columns align across the separate per-group tables. */
  th:nth-child(1) { width: 56%; }
  th:nth-child(2), th:nth-child(3) { width: 22%; }
  th {
    text-align: left;
    font-size: 9px;
    color: ${p => p.$theme?.textSecondary || '#999'};
    padding: 0 8px 6px;
    font-weight: normal;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  th:not(:first-child) { text-align: right; }
`;

export const ShortcutRow = styled.tr`
  border-top: 1px solid ${p => p.$theme?.borderColor || '#eee'};
  &:first-child { border-top: none; }
`;

export const ShortcutAction = styled.td`
  padding: 6px 8px;
  font-size: 10pt;
  color: ${p => p.$theme?.textColor || '#222'};
`;

export const ShortcutKey = styled.td`
  padding: 6px 8px;
  font-size: 10pt;
  color: ${p => p.$theme?.textSecondary || '#666'};
  text-align: right;
  font-family: monospace;
  white-space: nowrap;
`;
