import { ipcRenderer } from 'electron';
import React from 'react';
import fs from 'fs';
import path from 'path';
import chokidar from 'chokidar';
import format from 'date-fns/format';
import Editor from './Editor';
import SplitPane from 'react-split-pane';

const DATE_FORMAT = 'YYYY-MM-DD @ HH:mm';

export default class App extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            sidebarWidth: props.sidebarWidth,
            content: null,
            directory: props.directory,
            sort: 'name',
            direction: 'ASC',
            active: null,
            files: new Set(props.files),
            message: null,
            error: null,
        };
    }

    componentDidMount() {
        ipcRenderer.on('sort-by', (e, type) => {
            this.setSortBy(type);
        });

        ipcRenderer.on('new-file', (e, file) => {
            this.openFile(file);
        });

        const watcher = chokidar.watch(this.props.directory, {
            ignored: /[\/\\]\./,
            ignoreInitial: true,
            persistent: true
        });

        watcher
            .on('add', (f, stats) => {
                this.setState({
                    files: this.state.files.add({
                        name: path.basename(f),
                        path: f,
                        created: stats.birthtime,
                        modified: stats.mtime,
                    })
                });

                // We added a new file to an empty directory so we will open it by default
                if (this.state.active === null) {
                    this.openFirstFile();
                }
            })
            .on('unlink', (f) => {
                this.setState({
                    files: new Set([...this.state.files].filter((file) => {
                        return f !== file.path
                    }))
                });

                // We unlinked the file currently open, so we need to close the editor
                if (this.state.active === f) {
                    this.setState({
                        active: null,
                        content: null,
                    });

                    // If we have other files in the notebook, attempt to open the first one
                    if (this.state.files.size > 0) {
                        this.openFirstFile();
                    }
                }
            })
            .on('change', (f) => {})
        ;

        // Open the first file in the current directory...
        if (this.state.files.size > 0) {
            this.openFirstFile();
        }
    }

    handleChange(content) {
        fs.writeFileSync(this.state.active, content);
    }

    render() {
        if (this.state.files.size === 0) {
            return (
                <div style={{ color: '#555', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <em>There are no notes in this notebook yet!  Create one to get started.</em>
                </div>
            )
        }

        const files = this.sortFiles();

        const activeCss = {
            backgroundColor: '#eee'
        };

        return (
            <div>
                { this.state.message &&
                    <div className="toaster green">{this.state.message}</div>
                }
                { this.state.error && 
                    <div className="toaster red">{this.state.error}</div>
                }
                <SplitPane split="vertical" minSize={200} defaultSize={this.state.sidebarWidth}>
                    <div className="pane sidebar">
                        <ul className="note-list">
                        {files.map((file) => (
                            <li style={file.path === this.state.active ? activeCss : {}} key={file.name} onClick={this.openFile.bind(this, file.path)}>
                                <div style={{ textOverflow: 'ellipsis-word', lineHeight: '1.2em', whiteSpace: 'nowrap' }}>
                                    {file.name}
                                </div>
                                { this.state.sort !== 'modified' && 
                                    <div className="date-info">
                                        Created on {format(file.created, DATE_FORMAT)}
                                    </div>
                                }
                                { this.state.sort === 'modified' && 
                                    <div className="date-info">
                                        Last modified on {format(file.modified, DATE_FORMAT)}
                                    </div>
                                }
                            </li>
                        ))}
                        </ul>
                    </div>
                    <div className="pane">
                        <Editor content={this.state.content} onChange={this.handleChange.bind(this)} />
                    </div>
                </SplitPane>
            </div>
        );
    }

    openFirstFile() {
        this.openFile([...this.state.files].slice(0,1)[0].path);
    }

    openFile(file) {
        const content = fs.readFileSync(file).toString();
        this.setState({
            content,
            active: file
        });
    }

    setSortBy(type) {
        const direction = type === this.state.sort && this.state.direction === 'ASC' ? 'DESC' : 'ASC';
        this.setState({
            sort: type,
            direction,
        });
    }

    isDate(date) {
        return Object.prototype.toString.call(date) === '[object Date]';
    }

    sortFiles() {
        const type = this.state.sort;
        return [...new Set([...this.state.files].sort((a, b) => {
            if (this.state.direction === 'ASC') {
                if (this.isDate(a[type])) {
                    const aTime = a[type].getTime();
                    const bTime = b[type].getTime();

                    if (aTime < bTime) {
                        return -1
                    } else if (aTime > bTime) {
                        return 1
                    } else {
                        return 0
                    }
                }

                if (a[type].toLowerCase() < b[type].toLowerCase()) {
                    return -1;
                } else if (a[type].toLowerCase() > b[type].toLowerCase()) {
                    return 1;
                } else {
                    return 0;
                }
            } else {
                if (this.isDate(b[type])) {
                    const aTime = a[type].getTime();
                    const bTime = b[type].getTime();

                    if (aTime > bTime) {
                        return -1
                    } else if (aTime < bTime) {
                        return 1
                    } else {
                        return 0
                    }
                }

                if (a[type].toLowerCase() > b[type].toLowerCase()) {
                    return -1;
                } else if (a[type].toLowerCase() < b[type].toLowerCase()) {
                    return 1;
                } else {
                    return 0;
                }
            }
        }))];
    }
};

App.defaultProps = {
    sidebarWidth: 200
};
