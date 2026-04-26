const fs = require('fs');
const file = 'src/store/index.js';
let content = fs.readFileSync(file, 'utf8');

// Replace `config: { modules: [], workflows: [] },`
// with `config: { modules: [], workflows: [], theme: { primary: '#529990', accent: '#3d7870' }, customFields: {} },`

content = content.replace(
  'config: { modules: [], workflows: [] },',
  'config: { modules: [], workflows: [], theme: { primary: "#529990", accent: "#3d7870", mode: "light" }, customFields: {} },'
);

// wait, is it `config: { modules: [], workflows: [] }` ? 
// let's just do a string replace in the entire file
content = content.split('config: { modules: [], workflows: [] }').join('config: { modules: [], workflows: [], theme: { primary: "#529990", accent: "#3d7870", mode: "light" }, customFields: {} }');

fs.writeFileSync(file, content);
