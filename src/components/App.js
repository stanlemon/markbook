const { ipcRenderer } = require('electron');

const React = require('react');
const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const isBefore = require('date-fns/is_before');
const format = require('date-fns/format');
const SimpleMde = require('simplemde');
const SplitPane = require('react-split-pane');

const DATE_FORMAT = 'YYYY-MM-DD @ HH:mm';

module.exports = class App extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            sort: 'name',
            direction: 'ASC',
            active: null,
            changed: false,
            files: new Set()
        };
    }

    componentDidMount() {
        ipcRenderer.on('sort-by', (e, type) => {
            this.setSortBy(type);
        });

        ipcRenderer.on('new-file', (e, file) => {
            this.openFile(file);
        });

        this.simplemde = new SimpleMde({
            autoDownloadFontAwesome: false,
            autofocus: true,
            hideIcons: ['fullscreen', 'side-by-side'],
            renderingConfig: {
                singleLineBreaks: true,
                codeSyntaxHighlighting: true
            },
            showIcons: ["code", "table"],
        });

        this.simplemde.codemirror.on("change", () => {
            this.setState({
                changed: true
            });
        });

        setInterval(() => {
            const content = this.simplemde.value();

            if (this.state.changed && this.state.active && this.state.content !== content) {
                this.setState({
                    content
                });

                fs.writeFileSync(this.state.active, content);
            }
        }, 1000);

        const watcher = chokidar.watch(this.props.directory, {
            ignored: /[\/\\]\./,
            persistent: true
        });

        watcher
            .on('add', (f) => {
                const stats = fs.statSync(f);

                if (this.state.files.size === 0) {
                    this.openFile(f);
                }

                this.setState({
                    files: this.state.files.add({
                        name: path.basename(f),
                        path: f,
                        created: stats.birthtime,
                        modified: stats.mtime,
                    })
                });
            })
            .on('unlink', (f) => {
                this.setState({
                    files: new Set([...this.state.files].filter((file) => {
                        return f !== file.path
                    }))
                });
            })
            .on('change', (f) => {
                console.log('File', f, 'has been changed');
            })
        ;
    }

    openFile(file) {
        const content = fs.readFileSync(file).toString();
        this.setState({
            content,
            changed: false,
            active: file
        });
        this.simplemde.value(content);
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
        return [...new Set([...this.state.files].sort((a, b) => {
            const type = this.state.sort;
            if (this.state.direction === 'ASC') {
                if (this.isDate(a[type])) {
                    return isBefore(a[type], b[type]);
                }
                return a[type] > b[type];
            } else {
                if (this.isDate(b[type])) {
                    return isBefore(b[type], a[type]);
                }
                return b[type] > a[type];
            }
        }))];
    }

    render() {
        const files = this.sortFiles();

        const activeCss = {
            backgroundColor: '#eee'
        };

        return (
            <SplitPane split="vertical" minSize={200} defaultSize={250}>
                <div className="pane">
                    <ul className="note-list">
                    {files.map((file) => (
                        <li style={file.path === this.state.active ? activeCss : {}} key={file.name} onClick={this.openFile.bind(this, file.path)}>
                            <div style={{ textOverflow: 'ellipsis-word', lineHeight: '1.2em', whiteSpace: 'nowrap' }}>
                                {file.name}
                            </div>
                            { this.state.sort === 'modified' && 
                                <div className="date-info">
                                    Last modified on {format(file.created, DATE_FORMAT)}
                                </div>
                            }
                            { this.state.sort !== 'modified' && 
                                <div className="date-info">
                                    Created on {format(file.modified, DATE_FORMAT)}
                                </div>
                            }
                        </li>
                    ))}
                    </ul>
                </div>
                <div className="pane">
                    <textarea></textarea>
                </div>
           </SplitPane>
        );
    }
};
