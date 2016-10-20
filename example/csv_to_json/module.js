'use strict';

var Converter = require('csvtojson').Converter;
var converter = new Converter({});
var fs = require('fs');
var path = require('path');
var util = require('util');
var output_path = path.join(__dirname, '/dummy_data.json');
var input_path = path.join(__dirname, process.env.INPUT_FILENAME);
var log_file = fs.createWriteStream(output_path);
var log_stdout = process.stdout;

// end_parsed will be emitted once parsing finished
converter.on('end_parsed', function (jsonArray) {
  var key, nullifiedArray;

  nullifiedArray = jsonArray.map(function (item) {
    for (key in item) {
      if (item[key] === ''
     || item[key] === 'Not applicable'
     || item[key] === 'Not Applicable'
     || item[key] === 'Does not apply'
     || item[key] === '-'
   ) { item[key] = null }
    }

    return item;
  });
  log_file.write(util.format(nullifiedArray));
  log_stdout.write(util.format(nullifiedArray));
});

// read from file
require('fs').createReadStream(input_path)
.pipe(converter);
