import { app, BrowserWindow, dialog, ipcMain, Menu } from 'electron';
import settings from 'electron-settings';
import fs from 'fs';
import { DSMenu } from './main/menu';
import { initSettings } from './main/settings';
import type { Dusty } from './types';

// This allows TypeScript to pick up the magic constant that's auto-generated by Forge's Webpack
// plugin that tells the Electron app where to look for the Webpack-bundled app code (depending on
// whether you're running in development or production).
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

let mainWindow: BrowserWindow = null;

// initialize settings
initSettings();

// event listener for `ds:read`
ipcMain.on('ds:read', (event, path: string) => {
  try {
    // check if file exists
    const exists = fs.existsSync(path);

    if (exists) {
      // read file
      const fileContent = fs.readFileSync(path, 'utf8');

      // check file size
      if (fileContent.length < 100_000) {
        event.returnValue = fileContent;
      } else {
        throw Error(`File at ${path} is too big to open.`);
      }
    } else {
      throw Error(`File at ${path} does not exists.`);
    }
  } catch (err) {
    mainWindow.webContents.send(
      'ds:error',
      'Cannot read a file!',
      err.message || err
    );
    event.returnValue = null;
  }
});

// event listener for `ds:write`
ipcMain.on('ds:write', (event, path: string = '', data: string = '') => {
  try {
    // check the given path
    if (path.length === 0) {
      path = dialog.showSaveDialogSync(mainWindow);
    }

    // write to file
    fs.writeFileSync(path, data, { encoding: 'utf8' });

    event.returnValue = path;
  } catch (err) {
    mainWindow.webContents.send(
      'ds:error',
      'Cannot write to a file!',
      err.message || err
    );
    event.returnValue = null;
  }
});

// event listener for `ds:rename`
ipcMain.on('ds:rename', (event, oldPath: string, newPath: string) => {
  try {
    // rename file or directory
    fs.renameSync(oldPath, newPath);
  } catch (err) {
    mainWindow.webContents.send(
      'ds:error',
      'Cannot rename!',
      err.message || err
    );
  }
});

ipcMain.on('ds:delete', (event, path: string, isFile: boolean) => {
  try {
    // if is file delete file else delete directory
    if (isFile) {
      fs.rmSync(path);
    } else {
      fs.rmdirSync(path);
    }
  } catch (err) {
    mainWindow.webContents.send(
      'ds:error',
      'Cannot remove ' + isFile ? 'file!' : 'folder!',
      err.message || err
    );
  }
});

// event listener for `ds:mkdir`
ipcMain.on('ds:mkdir', (event, path: string) => {
  try {
    // create directory
    fs.mkdirSync(path);
  } catch (err) {
    mainWindow.webContents.send(
      'ds:error',
      'Cannot create folder!',
      err.message || err
    );
  }
});

// event listener for `ds:explore`
ipcMain.on('ds:explore', (event, path: string) => {
  try {
    // folder content
    const explored: Dusty.ExplorerItem[] = [];

    // explore folder
    fs.readdirSync(path, {
      encoding: 'utf8',
      withFileTypes: true,
    }).map((item) => {
      explored.push({
        ...item,
        isDirectory: item.isDirectory(),
        isFile: item.isFile(),
      });
    });

    // return explored folder and sort content by name and type
    event.returnValue = explored
      .sort((a, b) => {
        let na = a.name.toLowerCase();
        let nb = b.name.toLowerCase();

        if (na < nb) {
          return -1;
        }

        if (na > nb) {
          return 1;
        }

        return 0;
      })
      .sort((a, b) =>
        a.isDirectory === b.isDirectory ? 0 : a.isDirectory ? -1 : 1
      );
  } catch (err) {
    mainWindow.webContents.send(
      'ds:error',
      'Cannot explore folder!',
      err.message || err
    );
    event.returnValue = null;
  }
});

// event listener for `ds:open`
// it handles opening of dialogs
ipcMain.on('ds:open', (event, options: Electron.OpenDialogSyncOptions) => {
  try {
    // get file or folder path from dialog
    const paths = dialog.showOpenDialogSync(mainWindow, options);

    event.returnValue = paths;
  } catch (err) {
    mainWindow.webContents.send(
      'ds:error',
      `Cannot open ${
        options.properties.includes('openDirectory') ? 'folder' : 'file'
      }${options.properties.includes('multiSelections') && 's'}`,
      err.message || err
    );
    event.returnValue = [];
  }
});

// event listener for `ds:getSetting`
// it handles getting of settings
ipcMain.on('ds:getSetting', async (event, key: string) => {
  event.returnValue = settings.getSync(key) || null;
});

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = (): void => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    ...(settings.getSync('windowBounds') as {
      width: number;
      height: number;
    }),
    minHeight: 600,
    minWidth: 800,
    fullscreen: (settings.getSync('fullscreen') as boolean) || false,

    // the place where the window will be shown
    x: settings.getSync('x') as number,
    y: settings.getSync('y') as number,

    backgroundColor:
      (settings.getSync('theme.background1HEX') as string) || '#fff',

    webPreferences: {
      zoomFactor: (settings.getSync('zoomFactor') as number) || 1.0,

      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      enableRemoteModule: true,
    },
  });

  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  // set the menu to desktop app
  const menu_design = Menu.buildFromTemplate(new DSMenu().initMenu());
  Menu.setApplicationMenu(menu_design);

  mainWindow.on('resize', () => {
    const { width, height } = mainWindow.getBounds();

    settings.set('windowBounds', { width, height });
  });

  mainWindow.on('enter-full-screen', () => {
    settings.set('fullscreen', mainWindow.isFullScreen());
  });

  mainWindow.on('leave-full-screen', () => {
    settings.set('fullscreen', mainWindow.isFullScreen());
  });

  mainWindow.on('close', () => {
    const [x, y] = mainWindow.getPosition();

    settings.set('x', x);
    settings.set('y', y);
  });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
