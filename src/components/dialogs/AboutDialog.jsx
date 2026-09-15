import { APP_NAME, APP_VERSION } from '../../constants/app.js';
import Dialog from './Dialog.jsx';
import {
  AboutHeader, AboutLogoSlot, AboutAppName, AboutVersion,
  AboutDescription, AboutSectionLabel, AboutChips, AboutChip,
  AboutFooter, AboutLink, AboutLinkSubtext,
} from './AboutDialog.style.js';

const TECH_STACK = ['React 19', 'idb-keyval (IndexedDB)', 'Konva', 'styled-components', 'Vite'];
const GITHUB_URL = 'https://github.com/michaelprograms/turbo-space-zero';
function AboutDialog({ onClose, theme, darkMode = true }) {
  const logoUrl = `${import.meta.env.BASE_URL}${darkMode ? 'logo.svg' : 'logo-light.svg'}`;
  return (
    <Dialog title={null} onClose={onClose} theme={theme}>
      <AboutHeader>
        <AboutLogoSlot aria-hidden="true">
          <img src={logoUrl} alt="" width={44} height={44} />
        </AboutLogoSlot>
        <div>
          <AboutAppName $theme={theme}>{APP_NAME}</AboutAppName>
          <AboutVersion $theme={theme}>v{APP_VERSION}</AboutVersion>
        </div>
      </AboutHeader>

      <AboutDescription $theme={theme}>
        A browser-based grid map editor for MUD &amp; text adventure world builders.
      </AboutDescription>

      <AboutSectionLabel $theme={theme}>Built with</AboutSectionLabel>
      <AboutChips>
        {TECH_STACK.map(name => (
          <AboutChip key={name} $theme={theme}>{name}</AboutChip>
        ))}
      </AboutChips>

      <AboutFooter $theme={theme}>
        <AboutLink $theme={theme} href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
          <span aria-hidden="true">↗ </span>GitHub
        </AboutLink>
        <AboutLinkSubtext $theme={theme} aria-hidden="true">{GITHUB_URL.replace('https://', '')}</AboutLinkSubtext>
      </AboutFooter>
    </Dialog>
  );
}

export default AboutDialog;
