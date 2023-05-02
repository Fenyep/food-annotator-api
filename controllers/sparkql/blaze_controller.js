import axios from "axios";

export const blazeQuery = async (req, res) => {
    try {
        const query = 'SELECT * WHERE {?s ?p ?o} LIMIT 10';
        const query2 = 'SELECT ?instance WHERE { ?instance rdfs:subClassOf <http://www.tsotsa.org/entity/Food> }';

        const headers = {
            'Content-Type': 'application/sparql-query'
        };

      const response = await axios.post('http://172.17.0.1:9999/blazegraph/namespace/testonto/sparql', query, {
        headers
      });

      console.log(response.data.results.bindings);
  
      return response.data.results.bindings;
    } catch (error) {
    //   console.error(`Error annotating value for ${columnName}=${value}: ${error.message}`);
      console.error(error);
      return error;
    }
  }
