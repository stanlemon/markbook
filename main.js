const { dialog, Menu, BrowserWindow, shell, app } = require('electron');
const path = require('path');
const fs = require('fs');
const format = require('date-fns/format');

const windows = [];

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
        submenu: [{
            label: 'Undo',
            accelerator: 'CmdOrCtrl+Z',
            role: 'undo'
        }, {
            label: 'Redo',
            accelerator: 'Shift+CmdOrCtrl+Z',
            role: 'redo'
        }, {
            type: 'separator'
        }, {
            label: 'Cut',
            accelerator: 'CmdOrCtrl+X',
            role: 'cut'
        }, {
            label: 'Copy',
            accelerator: 'CmdOrCtrl+C',
            role: 'copy'
        }, {
            label: 'Paste',
            accelerator: 'CmdOrCtrl+V',
            role: 'paste'
        }, {
            label: 'Select All',
            accelerator: 'CmdOrCtrl+A',
            role: 'selectall'
        }]
    },
    {
        label: 'View',
        submenu: [
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
                label: 'Toggle Full Screen',
                accelerator: (function () {
                    if (process.platform === 'darwin') {
                        return 'Ctrl+Command+F'
                    } else {
                        return 'F11'
                    }
                })(),
                click: function (item, focusedWindow) {
                    if (focusedWindow) {
                        focusedWindow.setFullScreen(!focusedWindow.isFullScreen())
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
            directories: []
        };
        saveSettings(defaultSettings);
    }

    return JSON.parse(fs.readFileSync(settingsPath).toString());
}

function saveSettings(settings) {
    fs.writeFileSync(getSettingsPath(), JSON.stringify(settings));
}

const settings = getSettings();

function openDirectory() {
    dialog.showOpenDialog({
        properties: ['openDirectory'],
    }, (directories) => {
        createWindow(directories[0]);

        settings.directories = [...new Set([
            ...settings.directories,
            directories[0]
        ])];

        saveSettings(settings);
    });
}

function newFile(directory, callback) {
    const date = format(Date.now, 'YYYY-MM-DD');

    dialog.showSaveDialog({
        title: date,
        defaultPath: directory,
    }, (filename) => {
        fs.writeFileSync(filename, "");
        callback(filename);
    });
}

function createWindow(directory) {
    if (windows.length > 0) {
        const prevWindow = windows.reduce((a, b) => 
            b.directory === directory ? a : b
        );
        prevWindow.focus();
        return;
    }

    const appWindow = new BrowserWindow({
        width: 800,
        height: 600,
        title: directory
    });

    windows.push(appWindow);

    appWindow.directory = directory;

    if (process.env.NODE_ENV === 'development') {
        appWindow.loadURL('file://' + __dirname + '/src/index.html?directory=' + directory);
        appWindow.webContents.openDevTools();
    } else {
        appWindow.loadURL('file://' + __dirname + '/dist/index.html?directory=' + directory);
    }

    appWindow.on('close', () => {
        settings.directories = settings.directories.filter((v) => v !== directory);

        saveSettings(settings);
    });
}

app.setName(AppName);

app.on('ready', () => {
    Menu.setApplicationMenu(Menu.buildFromTemplate(menus));

    if (settings.directories.length > 0) {
        settings.directories.forEach((directory) => {
            createWindow(directory);
        });
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // When there are no windows and we activate, open the directory prompt
    if (windows.length === 0) {
        openDirectory();
    }
});
