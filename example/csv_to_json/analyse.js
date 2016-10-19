'use strict';

var fs,
  path,
  inputFilename,
  outputFilename,
  data,
  schools,
  openSchools,
  nullifiedFields,
  fieldsObject;

require('env2')('./.env');
fs = require('fs');
path = require('path');
inputFilename = path.join(__dirname, process.env.INPUT_FILENAME);
outputFilename = './transformed_data.json';

data = fs.readFileSync(inputFilename).toString();

// converts CSV string to an array of arrays
function csvToArray (dataString, delimiter) {
  console.log('CSV -------> ARRAY');
  console.log('- - - - - - - - - - - -');
  var arrayedItems, dataArray, destringedItem, items, delimit;

  delimit = delimiter || ',';
  // converts data string --> array of strings
  items = dataString.split(delimit);

  arrayedItems = items.map(function (item) {
    // converts array of strings --> array of arrays
    var newItem = item.split(',');

    return newItem;
  });
  dataArray = arrayedItems.map(function (arrayedItem) {
    // removes excess quotes for item strings within nested arrays
    destringedItem = arrayedItem.map(function (innerArrayedItem) {
      var newInnerArrayedItem = innerArrayedItem.replace(/"|_/g, '').trim();

      return newInnerArrayedItem;
    });

    return destringedItem;
  });

  return dataArray;
}

schools = csvToArray(data, '\n');

function removeClosedSchools (schoolsData) {
  var schoolsOpen = schoolsData.filter(function (schoolData) {
    return schoolData[6] !== 'Closed';
  });
  // console.log(schoolsOpen.length);
  return schoolsOpen;
}

openSchools = removeClosedSchools(schools);

// converts values to null if they meet a given criteria
function nullify (schoolsOpen) {
  console.log('NULLIFY DATA');
  console.log('- - - - - - - - - - - -');
  var nullifiedData, dataItems;

  nullifiedData = schoolsOpen.map(function (dataBlock) {
    dataItems = dataBlock.map(function (dataBlockItem) {
      if (dataBlockItem === 'null'
        || dataBlockItem === ''
        || dataBlockItem === 'Not applicable'
        || dataBlockItem === 'Does not apply'
      ) {
        return null;
      }

      return dataBlockItem;
    });

    return dataItems;
  });

  return nullifiedData;
}

nullifiedFields = nullify(openSchools);

// creates an object with field name keys
function buildFieldsObject (nullifiedData) {
  console.log('BUILDING FIELDS OBJECT');
  console.log('- - - - - - - - - - - -');
  var values = {};
  var columnNames = nullifiedData[0];
  var matrix = nullifiedData.slice(1, nullifiedData.length);

  columnNames.forEach(function (field, index) {
    values[field] = matrix.map(function (row) {
      return row[index];
    });
  });

  return values;
}

fieldsObject = buildFieldsObject(nullifiedFields);

function parseValues (valuesArray) {
  console.log('MAKING UNIQUE ARRAY');
  console.log('- - - - - - - - - - - -');
  var uniqueArray = [];
  var nullCount = 0;

  valuesArray.forEach(function (elem) {
    if (elem === null) {
      nullCount++;
    } else if (uniqueArray.indexOf(elem) === -1) {
      // console.log(elem);
      uniqueArray.push(elem);
    }
  });

  return {
    uniqueArray: uniqueArray,
    nullCount: nullCount
  };
}
function determineFieldTypes (fieldsObj) {
  console.log('DETERMINING FIELD TYPES');
  console.log('- - - - - - - - - - - -');
  var fieldTypesObject = {};
  var fields = [Object.keys(fieldsObj)[5]];

  fields.forEach(function (field) {
    var fieldValues = fieldsObj[field];
    console.log(field, fieldValues.length);
    var parsedData = parseValues(fieldValues);
    var uniqueArray = parsedData.uniqueArray;
    var nullCount = parsedData.nullCount;
    var nullFilteredArray = uniqueArray.filter(function (uniqueItem) {
      return uniqueItem !== null;
    });


    if (uniqueArray.length === fieldValues.length) {
      fieldTypesObject[field] = { fieldType: 'UNIQUE REQUIRED' };
    } else if (uniqueArray.length + nullCount > fieldValues.length - 2000) {
      fieldTypesObject[field] = { fieldType: 'UNIQUE OR NULL' };
    } else if (uniqueArray.length < 100) {
      // console.log(uniqueArray);
      fieldTypesObject[field] = { fieldType: 'SMALL ENUM' };
    } else if (uniqueArray.length < 1000) {
      fieldTypesObject[field] = { fieldType: 'BIG ENUM' };
    } else {
      fieldTypesObject[field] = { fieldType: 'FREE FORM' };
    }
    if (field.indexOf('Date') !== -1) {
      fieldTypesObject[field].dataType = 'DATE';
    } else if (isNaN(Number(nullFilteredArray[0]))) {
      fieldTypesObject[field].dataType = 'VARCHAR';
    } else {
      fieldTypesObject[field].dataType = 'INT';
    }
  });

  return fieldTypesObject;
}

console.log(determineFieldTypes(fieldsObject));
