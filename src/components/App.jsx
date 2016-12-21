import "babel-polyfill";
const React = require('react');
const { dialog } = require('electron').remote
const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const SimpleMde = require('simplemde');

module.exports = class App extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            active: null,
            directory: null,
            files: []
        };
    }

    componentDidMount() {
        this.simplemde = new SimpleMde({
            autofocus: true,
            /*
            autosave: {
                enabled: true,
                uniqueId: 'simplemd',
                delay: 1000,
            }
            */
        });

        let changed = false;

        this.simplemde.codemirror.on("change", () => {
            changed = true;
        });

        setInterval(() => {
            if (changed && this.state.active) {
                console.log('saving...');

                const contents = this.simplemde.value();

                fs.writeFileSync(this.state.active, contents);
            }
        }, 1000);

        dialog.showOpenDialog({
            properties: ['openDirectory'],
        }, (directories) => {
            const directory = directories[0];

            this.setState({
                directory
            });
 
            fs.readdir(directory, (err, items) => {
                const files = {};

                items.forEach((item) => {
                    if (item.substring(0, 1) === '.') {
                        return;
                    }

                    const key = path.join(directory, item);

                    files[key] = {
                        name: item,
                        path: key
                    };
                });

                console.log(files);

                this.setState({
                    files
                });
            });

            const watcher = chokidar.watch(directory, {
                ignored: /[\/\\]\./,
                persistent: true
            });

            watcher
                .on('add', (f) => {
                    const items = this.state.files;
                    items[f] = {
                        name: path.basename(f),
                        path: f
                    };
                    this.setState({
                        files: items
                    });
                })
                .on('unlink', (f) => {
                    const items = this.state.files;
                    delete items[f];
                    this.setState({
                        files: items
                    });
                })
                .on('change', (f) => {
                    console.log('File', f, 'has been changed');
                })
            ;
        });
    }

    openFile(file) {
        this.setState({
            active: file
        });
        const contents = fs.readFileSync(file).toString();
        this.simplemde.value(contents);
    }

    render() {
        console.log('Rendering...', this.state);

        return (
            <div>
                <h1>{this.state.directory}</h1>
                <div>
                    <ul>
                    {Object.values(this.state.files).map((file) => (
                        <li key={file.name} onClick={this.openFile.bind(this, file.path)}>
                            {file.path}
                        </li>
                    ))}
                    </ul>
                </div>
                <div>
                    <textarea></textarea>
                </div>
            </div>
        );
    }
};
