# Wiki Engine

This wiki engine uses markdown files for content.
A script in `/bin/generate` browse the files and extract the content in a JSON format. The JSON is then put inside a template literal in `database.js` and picked by the website who use it to hydrate pages.

## Commands

Regenerate the website database: `node /bin/generate.js`

## Server

The website does not need any server once database is created and can be run by double clicking on `index.html`.
