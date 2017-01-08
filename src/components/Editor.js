import React from 'react'
import SimpleMDE from 'simplemde';

export default class Editor extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            interval: 1000,
            content: props.content,
            changed: false,
            onChange: (v) => {}
        };
    }

    monitor() {
        if (this.state.changed) {
            this.setState({
                changed: false,
            });
            this.props.onChange(this.state.content);
        }
    }

    componentDidMount() {
       this.simplemde = new SimpleMDE({
            spellChecker: false,
            autoDownloadFontAwesome: false,
            autofocus: true,
            hideIcons: ['fullscreen', 'side-by-side'],
            renderingConfig: {
                singleLineBreaks: true,
                codeSyntaxHighlighting: true
            },
            showIcons: ["code", "table"],
            initialValue: this.props.content,
        });

        this.simplemde.codemirror.on("change", () => {
            const content = this.simplemde.value();

            if (this.state.content === content) {
                return;
            }

            this.setState({
                content,
                changed: true,
            });
        });

        this.interval = setInterval(this.monitor.bind(this), this.props.interval);
    }

    componentWillReceiveProps({ content }) {
        this.setState({
            content
        });
        this.simplemde.value(content);
    }

    componentWillUnmount() {
        clearInterval(this.interval);
    }

    render() {
        return (
            <textarea></textarea>
        );
    }
}
