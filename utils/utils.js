
import WBK from 'wikibase-sdk';
import axios from 'axios';
import NodeCache from 'node-cache';
import fs from 'fs';
import axiosRetry from 'axios-retry'

// Instance of wikibase to query the wikidata query api
const wdk = WBK({
    instance: 'https://www.wikidata.org',
    sparqlEndpoint: 'https://query.wikidata.org/sparql'
});

// Creates a cache instance with a timetoleave of 1hour

/// Instace of cache for wikidata
const cacheWikidata = new NodeCache({ stdTTL: 3600 });
/// Instance of cache for foodon
const cacheFoodOn = new NodeCache({ stdTTL: 3600 });

// This will clear the cache after every 1hour
setInterval(() => {
  cacheWikidata.flushAll();
  cacheFoodOn.flushAll();
}, 60 * 60 * 1000);

// Permits to retry a request 2 times, when it fails
axiosRetry(axios, { retries: 2 });
 
/**
 * The role of this function will retrieve the resource wikidata identifier
 * @param {String} cellValue  
 */
export const getWikidataUri = async (cellValue) => {
    if(cellValue != "" && cellValue != " ") {
      if(cacheWikidata.has(cellValue)) {
        let value = cacheWikidata.get(cellValue);
        console.log(value); 
        return value;
      } else {
        const uri = wdk.searchEntities({ search: cellValue, language: 'en', limit: '30', continue: 10 })
      
        const response = await axios.get(uri, { timeout: 30000 }).then((value) => {
          return value;
        }).catch((err) => {
          console.log(err);
        });
      
        if(response.data.search.length > 0) {
          cacheWikidata.set(cellValue, response.data.search[0].concepturi);
          return response.data.search[0].concepturi;
        } else {
          return 'NIL';
        }
      }
    } else {
      return 'NIL';
    }
  }

/**
 * The role of this function will retrieve the resource foodon identifier
 * @param {String} foodName  
 */
export const getFoodOnURI = async (foodName) => {
    if(foodName != "" && foodName != " ") {
      if(cacheFoodOn.has(foodName)) {
        let value = cacheFoodOn.get(foodName);
        return value;
      } else {
        const url = `https://www.ebi.ac.uk/ols/api/search?q=${foodName}&ontology=foodon`;
      
        try {
          const response = await axios.get(url);
          const hits = response.data.response.docs;
          if (hits.length > 0) {
            cacheFoodOn.set(foodName, hits[0].iri);
            return hits[0].iri;
          } else {
            return 'NIL';
          }
        } catch (error) {
          console.error(error);
          return 'NIL';
        }
      }
    } else {
      return 'NIL'
    }
  }

/**
 * The role of this function will be to create the cta file, from the source file
 * @param {String} filename 
 * @param {Array<Array<String>>} data 
 * @param {String} annoSource 
 * @param {Function} annotationFunc 
 */
export const createCEACsvFile = async (filename, data, annoSource, annotationFunc) => {

    // The file header
    const csv = `file, col, row, URI\n`;
    try {
      // Adds the header inside the cea file. Create the file if it doesn't exist
      fs.appendFileSync(annoSource, csv);
      // Automatically prefill the table values
      // TODO: Here we will automatically annotate the CEA URI
      for (let i = 0; i < Object.keys(data[0]).length; i++) {
        for (let j = 0; j < data.length; j++) {
          // const queryId = await getWikidataUri(data[j][i]);
          const queryId = await annotationFunc(data[j][i]);
          // const queryId = "NIL";
          let col = `${filename}, ${i}, ${j}, ${queryId}\n`;
          // Filling the value inside the csv file
          fs.appendFileSync(annoSource, col);
        }
      }
    } catch (err) {
        console.log("here " + err);
    }
}

/**
 * The role of this function will be to create the cta file, from the source file
 * @param {String} filename 
 * @param {Array<Array<String>>} data 
 * @param {String} annoSource 
 * @param {Function} annotationFunc 
 */
export const createCTACsvFile = async (filename, data, annoSource, annotationFunc) => {
    // The file header
    const csv = `file, col, URI\n`;
    try {
        // Adds the header inside the cta file
        fs.appendFileSync(annoSource, csv);
        // Automatically prefill the table values
        // TODO: Here we will automatically annotate the CTA URI
        for (let index = 0; index < Object.keys(data[0]).length; index++) {
            // const queryId = await getWikidataUri(data[0][index]);
            const queryId = await annotationFunc(data[0][index]);
            // const queryId = "NIL";
            let col = `${filename}, ${index}, ${queryId}\n`;
            // Filling the value inside the csv file
            fs.appendFileSync(annoSource, col);
        }
    } catch (err) {
        console.log(err);
    }

}

/**
 * The role of this function will be to create the cta file, from the source file
 * @param {String} filename 
 * @param {Array<Array<String>>} data 
 * @param {String} annoSource 
 * @param {Function} annotationFunc 
 */
export const createCPACsvFile = async (filename, data, annoSource, annotationFunc) => {
    // The file header
    const csv = `file, colx, colj, URI\n`;
    try {
        // Adds the header inside the cpa file. Create the file if it doesn't exist
        fs.appendFileSync(annoSource, csv);
        // Automatically prefill the table values
        // TODO: Here we will automatically annotate the CPA URI
        var i = 0;
        for (let j = i+1; j < Object.keys(data[0]).length; j++) {
            // console.log(data[0][0]);
            // console.log(data[0][j]);
            const queryId = "NIL"
            let col = `${filename}, ${i}, ${j}, ${queryId}\n`;
            // Filling the value inside the csv file
            fs.appendFileSync(annoSource, col);
        }
        
    } catch (err) {
        console.log(err);
    }
}

/**
 * The role of this function will be to clear the content of the file with an empty string
 * @param {String} filePath 
 */
export const clearCsvFile = async (filePath) => {
  try {
    fs.writeFileSync(filePath, '');
    console.log(`Cleared contents of ${filePath}`);
  } catch (error) {
    console.error(`Error clearing contents of ${filePath}: ${error}`);
  }
}


// const annotateValue = async (columnName, value) => {
//     try {
//       const response = await axios.get('https://www.wikidata.org/w/api.php', {
//         params: {
//           action: 'wbsearchentities',
//           search: value,
//           format: 'json',
//         },
//       });
  
//       if (response.data.searchinfo.totalhits > 0) {
//         const entityId = response.data.search[0].id;
//         return `http://www.wikidata.org/entity/${entityId}`;
//       }
  
//       return value;
//     } catch (error) {
//       console.error(`Error annotating value for ${columnName}=${value}: ${error.message}`);
//       return value;
//     }
// }

// const annotateValue2 = async (columnName, value) => {
//     try {
//       const response = await axios.get('https://foodb.ca/api/search.json', {
//         params: {
//           q: value,
//           limit: 1,
//           api_key: 'YOUR_API_KEY_HERE',
//         },
//       });
  
//       if (response.data.foods.length > 0) {
//         const foodonId = response.data.foods[0].foodon_id;
//         return `http://purl.obolibrary.org/obo/${foodonId}`;
//       }
  
//       return value;
//     } catch (error) {
//       console.error(`Error annotating value for ${columnName}=${value}: ${error.message}`);
//       return value;
//     }
//   }

