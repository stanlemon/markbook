require("babel-polyfill");

import React from 'react';
import ReactDOM from 'react-dom';
import fs from 'fs';
import path from 'path';
import async from 'async';
import querystring from 'querystring';
import App from './components/App';

const { directory } = querystring.parse(window.location.search.substring(1));

loadDirectory(directory, (files) => {
    ReactDOM.render(
        <App directory={directory} files={files} />,
        document.getElementById('root')
    );
})

function loadDirectory(directory, callback) {
    fs.readdir(directory, (err, files) => {
        async.map(files.filter((f) => f.substring(0, 1) !== '.'), (name, done) => {
            const file = path.join(directory, name);

            fs.stat(file, (err, stats) => {
                if (err) {
                    console.log(err);
                    done(err, null);
                    return;
                }

                done(null, {
                    name: name,
                    path: file,
                    created: stats.birthtime,
                    modified: stats.mtime,
                })
            });
        }, (err, results) => {
            if (err) {
                console.error(err);
                return;
            }
            callback(results);
        });
    });
}