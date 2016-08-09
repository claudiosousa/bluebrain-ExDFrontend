// This tool can be executed using node to generate a json file from the embedded
// description data (containing annotation, colors and xyz coordinates).

 var fs = require('fs');
 var js;

js = fs.readFileSync('src/brain3D.js')+"";
eval(js);

js = fs.readFileSync('data/brain3Dallannotation.js')+"";
eval(js);

for(var i=1;i<=4;i++)
{
    js = fs.readFileSync('data/brain3Dposes_'+i+'.js')+"";
    eval(js);
}

js = fs.readFileSync('data/brain3Dembeddeddata.js')+"";
eval(js);

fs.writeFileSync('data/brainvisualiserdata.json', JSON.stringify(BRAIN3D.embeddedData));


