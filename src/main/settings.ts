import settings from 'electron-settings';

function createNonExistingSetting(
  settingName: string,
  defaultValue: string
): void {
  if (!settings.hasSync(settingName)) {
    settings.setSync(settingName, defaultValue);
  }
}

interface ISetting {
  name: string;
  default: string;
}

const defaultSettings: ISetting[] = [
  {
    name: 'theme.background1',
    default: 'rgba(0, 0, 0, 1)',
  },
  {
    // for window background color
    name: 'theme.background1HEX',
    default: '#000',
  },
  {
    name: 'theme.background2',
    default: 'rgba(128, 128, 128, 0.2)',
  },
  {
    name: 'theme.background3',
    default: 'rgba(52, 52, 52, 1)',
  },
  {
    name: 'theme.foreground1',
    default: 'rgba(255, 255, 255, 0.4)',
  },
  {
    name: 'theme.foreground2',
    default: 'rgba(212, 212, 212, 1)',
  },
  {
    name: 'theme.transitionTime',
    default: '0.2s',
  },
  {
    name: 'theme.scrollBarSize',
    default: '0.7rem',
  },
  {
    name: 'theme.asideWidth',
    default: '400px',
  },
  {
    name: 'theme.asideMinWidth',
    default: '200px',
  },
  {
    name: 'theme.asideMenuItemFontSize',
    default: '0.5em',
  },
  {
    name: 'theme.asideMenuItemSize',
    default: '50px',
  },
  {
    name: 'theme.footerHeight',
    default: '1.5em',
  },
  {
    name: 'theme.footerFontSize',
    default: '14px',
  },
  {
    name: 'theme.footerItemPaddingHor',
    default: '0.5rem',
  },
  {
    name: 'theme.mainFontSize',
    default: '18px',
  },
  {
    name: 'theme.navHeight',
    default: '50px',
  },
  {
    name: 'theme.navFontSize',
    default: '18px',
  },
  {
    name: 'theme.editorFontSize',
    default: '12px',
  },
  {
    name: 'theme.editorLineCounterWidth',
    default: '50px',
  },
  {
    name: 'theme.syntaxColor1',
    default: 'rgb(158, 102, 201)',
  },
  {
    name: 'theme.syntaxColor2',
    default: 'rgb(136, 173, 94)',
  },
  {
    name: 'theme.syntaxColor3',
    default: 'rgb(194, 64, 64)',
  },
  {
    name: 'theme.syntaxColor4',
    default: 'rgb(232, 159, 74)',
  },
  {
    name: 'theme.syntaxColor5',
    default: 'rgb(22, 135, 162)',
  },
  {
    name: 'theme.syntaxColor6',
    default: 'rgb(170, 170, 170)',
  },
];

export function initSettings(): void {
  settings.configure({
    prettify: true,
  });

  defaultSettings.map((defaultSetting) => {
    createNonExistingSetting(defaultSetting.name, defaultSetting.default);
  });
}
