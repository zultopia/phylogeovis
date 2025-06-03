#!/usr/bin/env node
const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');
const fs = require('fs').promises; 

const NCBI_EUTILS = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
const OUTPUT_FILE = './src/services/pongo_genome_sequence.json'; 

const speciesToFetch = [
  { name: 'Pongo abelii', count: 20 },
  { name: 'Pongo pygmaeus', count: 25 },
  { name: 'Pongo tapanuliensis', count: 8 }
];

async function fetchPongoData() {
  const allResults = {}; 
  let globalRecordIdCounter = 1;

  for (const speciesInfo of speciesToFetch) {
    const { name, count } = speciesInfo;
    console.log(`\n--- Fetching data for: ${name} (count: ${count}) ---`);

    try {
      const searchUrl = `${NCBI_EUTILS}/esearch.fcgi?db=nucleotide&term=${encodeURIComponent(name)}[Organism]&retmax=${count}`;
      console.log(`Accessing: ${searchUrl}`);
      
      const searchRes = await axios.get(searchUrl, {
        headers: { 'Accept': 'application/xml' } 
      });

      const parser = new XMLParser();
      const searchData = parser.parse(searchRes.data);

      let idList = searchData?.eSearchResult?.IdList?.Id || [];
      if (!Array.isArray(idList) && idList) { 
        idList = [idList];
      } else if (!idList) {
        idList = [];
      }

      if (idList.length === 0) {
        console.log(`No data found for ${name}.`);
        continue;
      }
      console.log(`Found ${idList.length} IDs for ${name}.`);

      const idsToFetch = idList.join(',');
      const fetchUrl = `${NCBI_EUTILS}/efetch.fcgi?db=nucleotide&id=${idsToFetch}&rettype=gb&retmode=text`;
      console.log(`Fetching data: ${fetchUrl}`);
      
      const fetchRes = await axios.get(fetchUrl);

      const records = fetchRes.data.split('//\n').filter(entry => entry.trim() !== '');
      
      if (!allResults[name]) {
        allResults[name] = [];
      }

      records.forEach((record) => {
        const organismMatch = record.match(/ORGANISM\s+(.+)/);
        const parsedSpecies = organismMatch ? organismMatch[1].split('\n')[0].trim() : name; 

        const sequenceMatch = record.match(/ORIGIN\s+([\s\S]+)/);
        const sequence = sequenceMatch ? sequenceMatch[1].replace(/[\d\s]/g, '').trim() : '';

        allResults[name].push({
          id: globalRecordIdCounter++, 
          species: parsedSpecies,
          sequence: sequence
        });
      });
      console.log(`Successfully processed ${allResults[name].length} records for ${name}.`);

    } catch (error) {
      console.error(`An error occurred while fetching or processing data for ${name}:`);
      if (error.response) {
        console.error('HTTP Status:', error.response.status);
        console.error('Response Data:', error.response.data);
      } else if (error.request) {
        console.error('No response received:', error.request);
      } else {
        console.error('Error Message:', error.message);
      }
    }
  }

  console.log('\n--- Data Fetching Process Complete ---');
  console.log('Summary of Collected Data:');
  for (const speciesName in allResults) {
    console.log(`- ${speciesName}: ${allResults[speciesName].length} records`);
  }

  try {
    await fs.writeFile(OUTPUT_FILE, JSON.stringify(allResults, null, 2));
    console.log(`All data successfully saved to ${OUTPUT_FILE}`);
  } catch (fileError) {
    console.error('An error occurred while writing the JSON file:', fileError.message);
  }
}

fetchPongoData();
