import Dialog from './Dialog.jsx';
import { SHORTCUT_GROUPS } from './shortcuts-data.js';
import {
  ShortcutsContainer, ShortcutGroup, ShortcutGroupLabel, ShortcutTable,
  ShortcutRow, ShortcutAction, ShortcutKey,
} from './ShortcutsDialog.style.js';

function ShortcutsDialog({ onClose, theme }) {
  return (
    <Dialog title="Shortcuts" onClose={onClose} theme={theme}>
      <ShortcutsContainer>
      {SHORTCUT_GROUPS.map(group => (
        <ShortcutGroup key={group.label}>
          <ShortcutGroupLabel $theme={theme}>{group.label}</ShortcutGroupLabel>
          <ShortcutTable $theme={theme}>
            <thead>
              <tr>
                <th scope="col">Action</th>
                <th scope="col">Mac</th>
                <th scope="col">Win / Linux</th>
              </tr>
            </thead>
            <tbody>
              {group.shortcuts.map(s => (
                <ShortcutRow key={s.action} $theme={theme}>
                  <ShortcutAction $theme={theme}>{s.action}</ShortcutAction>
                  <ShortcutKey $theme={theme}>{s.mac}</ShortcutKey>
                  <ShortcutKey $theme={theme}>{s.win}</ShortcutKey>
                </ShortcutRow>
              ))}
            </tbody>
          </ShortcutTable>
        </ShortcutGroup>
      ))}
      </ShortcutsContainer>
    </Dialog>
  );
}

export default ShortcutsDialog;
