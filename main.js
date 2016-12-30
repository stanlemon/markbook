const { dialog, Menu, BrowserWindow, shell, app } = require('electron');
const path = require('path');
const fs = require('fs');
const format = require('date-fns/format');

let activeWindows = [];

const AppName = 'Markbook';
const menus = [
    {
        label: AppName,
        submenu: [
            {
                label: 'About ' + AppName,
                role: 'about'
            },
            {
                type: 'separator'
            },
            {
                label: 'Services',
                role: 'services',
                submenu: []
            },
            {
                type: 'separator'
            },
            {
                label: 'Hide ' + AppName,
                accelerator: 'Command+H',
                role: 'hide'
            },
            {
                label: 'Hide Others',
                accelerator: 'Command+Alt+H',
                role: 'hideothers'
            },
            {
                label: 'Show All',
                role: 'unhide'
            },
            {
                type: 'separator'
            },
            {
                label: 'Quit',
                accelerator: 'Command+Q',
                click: app.quit
            }
        ]
    },
    {
        label: 'File',
        submenu: [
            {
                label: 'New Note',
                accelerator: 'CmdOrCtrl+N',
                click: (menuItem, browserWindow) => {
                    newFile(browserWindow.directory, (filename) => {
                        browserWindow.webContents.send('new-file', filename);
                    });
                }
            },
            {
                label: 'Open...',
                accelerator: 'CmdOrCtrl+O',
                click: (menuItem, browserWindow) => {
                    openDirectory();
                }
            }
        ]
    },
    {
        label: 'Edit',
        submenu: [
            {
                label: 'Undo',
                accelerator: 'CmdOrCtrl+Z',
                role: 'undo'
            },
            {
                label: 'Redo',
                accelerator: 'Shift+CmdOrCtrl+Z',
                role: 'redo'
            },
            {
                type: 'separator'
            },
            {
                label: 'Cut',
                accelerator: 'CmdOrCtrl+X',
                role: 'cut'
            },
            {
                label: 'Copy',
                accelerator: 'CmdOrCtrl+C',
                role: 'copy'
            },
            {
                label: 'Paste',
                accelerator: 'CmdOrCtrl+V',
                role: 'paste'
            },
            {
                label: 'Select All',
                accelerator: 'CmdOrCtrl+A',
                role: 'selectall'
            }
        ]
    },
    {
        label: 'View',
        submenu: [
            {
                label: 'Sort by...',
                submenu: [
                    {
                        label: 'Name',
                        accelerator: 'Command+Alt+N',
                        click: (item, window) => {
                            window.webContents.send('sort-by', 'name');
                        }
                    },
                    {
                        label: 'Date Created',
                        accelerator: 'Command+Alt+B',
                        click: (item, window) => {
                            window.webContents.send('sort-by', 'created');
                        }
                    },
                    {
                        label: 'Date Modified',
                        accelerator: 'Command+Alt+M',
                        click: (item, window) => {
                            window.webContents.send('sort-by', 'modified');
                        }
                    }
                ]
            },
            {
                type: 'separator'
            },
            {
                role: 'zoomin'
            },
            {
                role: 'zoomout'
            },
            {
                role: 'resetzoom'
            },
            {
                type: 'separator'
            },
            {
                role: 'togglefullscreen'
            },
            {
                type: 'separator'
            },
            {
                label: 'Bring All to Front',
                role: 'front'
            }
        ]
    },
    {
        label: 'Window',
        role: 'window',
        submenu: [
            {
                label: 'Minimize',
                accelerator: 'CmdOrCtrl+M',
                role: 'minimize'
            }, {
                label: 'Close',
                accelerator: 'CmdOrCtrl+W',
                role: 'close'
            }
        ]
    },
    {
        label: 'Help',
        role: 'help',
        submenu: [
            {
                label: 'Markdown syntax',
                click: function () {
                    //shell.openExternal('https://daringfireball.net/projects/markdown/syntax')
                }
            },
            {
                type: 'separator'
            },
            {
                label: 'Follow @stanlemon on Twitter',
                click: function () {
                    //shell.openExternal('https://twitter.com/stanlemon')
                }
            }
        ]
    },
    {
        label: 'Develop',
        submenu: [
            {
                type: 'separator'
            },
            {
                label: 'Reload',
                accelerator: 'CmdOrCtrl+R',
                click: function (item, focusedWindow) {
                    if (focusedWindow) {
                        focusedWindow.reload()
                    }
                }
            },
            {
                label: 'Toggle Developer Tools',
                accelerator: (function () {
                    if (process.platform === 'darwin') {
                    return 'Alt+Command+I'
                    } else {
                    return 'Ctrl+Shift+I'
                    }
                })(),
                click: function (item, focusedWindow) {
                    if (focusedWindow) {
                        focusedWindow.webContents.toggleDevTools()
                    }
                }
            }
        ]
    }
];

function getSettingsPath() {
    return path.join(
        app.getPath('userData'),
        'settings.json'
    );
}

function getSettings() {
    const settingsPath = getSettingsPath();

    if (!fs.existsSync(settingsPath)) {
        const defaultSettings = {
            windows: []
        };
        saveSettings(defaultSettings);
    }

    return JSON.parse(fs.readFileSync(settingsPath).toString());
}

function saveSettings(settings) {
    fs.writeFileSync(getSettingsPath(), JSON.stringify(settings));
}

function saveWindowSettings(directory, windowSettings) {
    const window = Object.assign({}, settings.windows.find(
        (d) => d.directory === directory
    ), windowSettings);

    settings.windows = [...settings.windows.filter(
        (d) => d.directory !== directory
    ), window];

    saveSettings(settings);
}

let settings = getSettings();

function openDirectory() {
    dialog.showOpenDialog({
        properties: ['openDirectory'],
    }, (directories) => {
        if (directories && directories[0]) {
            createWindow(directories[0]);

            settings.windows = [...new Set([
                ...settings.windows,
                {
                    directory: directories[0]
                }
            ])];

            saveSettings(settings);
        }
    });
}

function newFile(directory, callback) {
    const date = format(Date.now(), 'YYYY-MM-DD HH:mm');

    dialog.showSaveDialog({
        title: date,
        defaultPath: path.join(directory, date + '.md'),
    }, (filename) => {
        if (filename) {
            fs.writeFileSync(filename, "");
            callback(filename);
        }
    });
}

function createWindow(directory, position = [null, null], size = [800, 600], fullscreen = false) {
    if (activeWindows.length > 0) {
        const prevWindow = activeWindows.reduce((a, b) => 
            b.directory === directory ? a : b
        );
        prevWindow.focus();
        return;
    }

    const appWindow = new BrowserWindow({
        minWidth: 720,
        minHeight: 450,
        show: false,
        width: size[0],
        height: size[1],
        x: position[0],
        y: position[1],
        title: path.basename(directory)
    });

    appWindow.setRepresentedFilename(directory);

    if (fullscreen) {
        appWindow.setFullScreen(true);
    }

    activeWindows.push(appWindow);

    appWindow.directory = directory;

    if (process.env.NODE_ENV === 'development') {
        appWindow.loadURL('file://' + __dirname + '/src/index.html?directory=' + directory);
        appWindow.webContents.openDevTools();
    } else {
        appWindow.loadURL('file://' + __dirname + '/dist/index.html?directory=' + directory);
    }

    appWindow.on('close', (e) => {
        if (appWindow.quit !== true) {
            activeWindows = activeWindows.filter((w) => w.directory !== directory);

            settings.windows = settings.windows.filter(
                (v) => v.directory !== directory
            );

            saveSettings(settings);
        }
    });

    appWindow.once('ready-to-show', () => {
        appWindow.show()
    });

    appWindow.on('resize', (e) => {
        if (!appWindow.isFullScreen()) {
            saveWindowSettings(appWindow.directory, { size: appWindow.getSize() });
        }
    });

    appWindow.on('move', (e) => {
        if (!appWindow.isFullScreen()) {
            saveWindowSettings(appWindow.directory, { position: appWindow.getPosition() });
        }
    });

    appWindow.on('enter-full-screen', (e) => {
        saveWindowSettings(appWindow.directory, { fullscreen: true });
    });

    appWindow.on('leave-full-screen', (e) => {
        saveWindowSettings(appWindow.directory, { fullscreen: false });
    });
}

app.setName(AppName);

app.on('ready', () => {
    Menu.setApplicationMenu(Menu.buildFromTemplate(menus));

    if (settings.windows.length > 0) {
        settings.windows.forEach((window) => {
            createWindow(
                window.directory,
                window.position,
                window.size,
                window.fullscreen
            );
        });
    } else {
        openDirectory();
    }

    app.focus();
});

app.on('open-file', (e, path) => {
    openDirectory(path);
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // When there are no windows and we activate, open the directory prompt
    if (activeWindows.length === 0) {
        openDirectory();
    }
});

app.on('before-quit', () => {
    activeWindows.forEach((w) => {
        w.quit = true;
    });
});

app.on('will-quit', () => {
    saveSettings(settings);
});
