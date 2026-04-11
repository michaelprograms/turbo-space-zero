import {
  DockWrapper,
  DockGrid,
  DockButton,
  DockCenter,
  DockToggleButton,
} from './QuillDock.style.js';
import { DIRECTION_GRID } from '../map-controls/constants';

function QuillDock({ isQuillMode, onNavigate, onToggleQuillMode, theme }) {
  if (!isQuillMode) return null;

  return (
    <DockWrapper $theme={theme}>
      <DockGrid>
        {DIRECTION_GRID.map((btn) =>
          btn ? (
            <DockButton
              key={btn.dir}
              $theme={theme}
              type="button"
              aria-label={btn.label}
              onClick={() => onNavigate(btn.dir)}
            >
              {btn.label}
            </DockButton>
          ) : (
            <DockCenter key="center" />
          )
        )}
      </DockGrid>
      <DockToggleButton type="button" onClick={onToggleQuillMode}>
        Exit Quill
      </DockToggleButton>
    </DockWrapper>
  );
}

export default QuillDock;
