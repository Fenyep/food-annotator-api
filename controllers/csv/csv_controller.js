import csvParser from 'csv-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
// import async2 from 'async'
// import Bottleneck from 'bottleneck'
import JSZip from 'jszip';
import { clearCsvFile, createCEACsvFile, createCPACsvFile, createCTACsvFile, getFoodOnURI, getWikidataUri } from '../../utils/utils.js';

// const limiter = new Bottleneck({ maxConcurrent: 1, minTime: 3000 });

// const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const annotateFiles = async (req, res) => {
  /// Getting all the files sent in the request
  const files = req.files;

  // Creates an instance of a zip file
  const zip = new JSZip();

  // For each file
  const promises = files.map(async (file) => {

    // Gets the uploaded file path
    const originalFilePath = path.join(__dirname, '../../uploads', file.filename); 

    // Gets the uploaded file cea path
    const ceaFileName = `cea-${file.filename}`;
    const cellEntityFilePath = path.join(__dirname, '../../uploads', ceaFileName);

    // // // Gets the uploaded file cta path
    const ctaFileName = `cta-${file.filename}`;
    const columnTypeFilePath = path.join(__dirname, '../../uploads', ctaFileName);

    // // // Gets the uploaded file cpa path
    const cpaFileName = `cpa-${file.filename}`;
    const columnPropertyFilePath = path.join(__dirname, '../../uploads', cpaFileName);

    // Getting the parsed filename of a csv file (format containing "_clean.csv")
    let fileName = "";
    if(file.filename.includes("_clean.csv")) {
      fileName = file.filename.split('_clean.csv')[0];
    } else {
      fileName = file.filename.split('.csv')[0];
    }

    // Temporary variable to story each data of the CSV file
    let results = [];

    // Creates an event interface on the original uploaded file
    const stream = fs.createReadStream(originalFilePath);

    return new Promise((resolve, reject) => {

      stream.pipe(csvParser({ headers: false })).on('data', (data) => results.push(data)).on('end', async () => {
        
        // Annotating the csv files using wikidata
        await createCEACsvFile(fileName, results, cellEntityFilePath, getWikidataUri);
        await createCTACsvFile(fileName, results, columnTypeFilePath, getWikidataUri);
        await createCPACsvFile(fileName, results, columnPropertyFilePath, getWikidataUri);
  
        // Getting the content of each of the files from their path
        let ceaData = fs.readFileSync(cellEntityFilePath);
        let ctaData = fs.readFileSync(columnTypeFilePath);
        let cpaData = fs.readFileSync(columnPropertyFilePath);

        // Inserts a folder named "wikidata" inside the zip instance
        const wikidata = zip.folder("wikidata");
        // Inserting the files inside "wikidata" inside the zip instance
        // Providing the file name nd it's content
        wikidata.file(ceaFileName, ceaData);
        wikidata.file(ctaFileName, ctaData);
        wikidata.file(cpaFileName, cpaData);

        // Clearing the three files
        await clearCsvFile(cellEntityFilePath);
        await clearCsvFile(columnTypeFilePath);
        await clearCsvFile(columnPropertyFilePath);

        // Annotating the csv files using foodOn
        await createCEACsvFile(fileName, results, cellEntityFilePath, getFoodOnURI);
        await createCTACsvFile(fileName, results, columnTypeFilePath, getFoodOnURI);
        await createCPACsvFile(fileName, results, columnPropertyFilePath, getFoodOnURI);

        // Getting the content of each of the files from their path
        ceaData = fs.readFileSync(cellEntityFilePath);
        ctaData = fs.readFileSync(columnTypeFilePath);
        cpaData = fs.readFileSync(columnPropertyFilePath);

        // Inserts a folder named "wikidata" inside the zip instance
        const foodon = zip.folder("foodOn");
  
        // Inserting the files inside "foodOn" inside the zip instance
        // Providing the file name nd it's content
        foodon.file(ceaFileName, ceaData);
        foodon.file(ctaFileName, ctaData);
        foodon.file(cpaFileName, cpaData);

        fs.unlink(originalFilePath, (err) => {
          if (err) throw err;
          console.log(`${file.filename} deleted`);
        });
        fs.unlink(cellEntityFilePath, (err) => {
          if (err) throw err;
          console.log(`${ceaFileName} deleted`);
        });
        fs.unlink(columnTypeFilePath, (err) => {
          if (err) throw err;
          console.log(`${ctaFileName} deleted`);
        });
        fs.unlink(columnPropertyFilePath, (err) => {
          if (err) throw err;
          console.log(`${cpaFileName} deleted`);
        });
    
        resolve();
      }).on('error', (error) => {
        reject(error);
      });
    });
  });

  // Waiting for all the promises to resolve before generation the Zip file
  await Promise.all(promises);

  // Path to the zip file
  const zipFilePath = path.join(__dirname, '../../uploads', 'annotations.zip');

  zip.generateNodeStream({ type: 'nodebuffer', streamFiles: true })
  .pipe(fs.createWriteStream(zipFilePath))
  .on('finish', () => {
    res.download(zipFilePath, 'annotations.zip', (err) => {
      if(err) {
        console.log(err);
      }
      fs.unlinkSync(zipFilePath);
    })
  });
}

// // This function creates the new files
// const processFiles = (files, callback) => {
//     async2.eachSeries(files, (file, done) => {
//     //           await delay(3000);
  
//     //           await limiter.schedule(() => axios.get(url, { timeout: 4000 }).then((response) => {
//     //               const items = wdk.simplify.sparqlResults(response.data);
//         done();
//     }, callback);
// }

// // Function to read the files
// export const readFile = async (req, res) => {
//     // Recuperation of the files
//     const files = req.files;
//     // Files processing
//     processFiles(files, (err) => {
//         if(err) {
//             console.log(err);
//         } else {
//             console.log("good");
//         }
//     });




