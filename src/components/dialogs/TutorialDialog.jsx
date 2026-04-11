import { useState } from 'react';
import Dialog from './Dialog.jsx';
import TutorialCanvas from './TutorialCanvas.jsx';
import { TUTORIAL_CATEGORIES, ALL_DEMOS } from './tutorial-scripts.js';
import {
  TutorialLayout, TutorialSidebar, TutorialCategoryLabel, TutorialFeatureButton,
  TutorialMain, TutorialDemoTitle, TutorialDemoDescription,
  TutorialCanvasWrapper, TutorialFooter, TutorialProgress, TutorialNavButton,
} from './TutorialDialog.style.js';

function TutorialDialog({ onClose, theme }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const demo = ALL_DEMOS[activeIndex];

  return (
    <Dialog title="Tutorial" onClose={onClose} theme={theme} wide>
      <TutorialLayout>
        <TutorialSidebar $theme={theme}>
          {TUTORIAL_CATEGORIES.map(category => (
            <div key={category.label}>
              <TutorialCategoryLabel $theme={theme}>{category.label}</TutorialCategoryLabel>
              {category.demos.map(d => {
                const idx = ALL_DEMOS.indexOf(d);
                return (
                  <TutorialFeatureButton
                    key={d.id}
                    type="button"
                    $active={activeIndex === idx}
                    $theme={theme}
                    onClick={() => setActiveIndex(idx)}
                  >
                    {d.title}
                  </TutorialFeatureButton>
                );
              })}
            </div>
          ))}
        </TutorialSidebar>

        <TutorialMain>
          <TutorialDemoTitle $theme={theme}>{demo.title}</TutorialDemoTitle>
          <TutorialDemoDescription $theme={theme}>{demo.description}</TutorialDemoDescription>

          <TutorialCanvasWrapper $theme={theme}>
            {demo.type === 'canvas'
              ? <TutorialCanvas script={demo} theme={theme} />
              : <demo.Component theme={theme} />
            }
          </TutorialCanvasWrapper>

          <TutorialFooter>
            <TutorialProgress $theme={theme}>{activeIndex + 1} of {ALL_DEMOS.length}</TutorialProgress>
            <div style={{ display: 'flex', gap: 6 }}>
              <TutorialNavButton
                type="button"
                $theme={theme}
                disabled={activeIndex === 0}
                onClick={() => setActiveIndex(i => i - 1)}
              >
                ← Prev
              </TutorialNavButton>
              <TutorialNavButton
                type="button"
                $primary
                $theme={theme}
                disabled={activeIndex === ALL_DEMOS.length - 1}
                onClick={() => setActiveIndex(i => i + 1)}
              >
                Next →
              </TutorialNavButton>
            </div>
          </TutorialFooter>
        </TutorialMain>
      </TutorialLayout>
    </Dialog>
  );
}

export default TutorialDialog;
