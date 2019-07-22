import {
  define
} from 'hybrids';
import styles from '../dist/style.css';
import { isNull } from 'util';
import { networkInterfaces } from 'os';
const axios = require("axios");
/* Add any additional library imports you may need here. */


/**
 * === Don't remove this method or styles will break.
 * We directly insert a style element into the document head
 * in order to embed styles.
 **/
function styleTemplate() {
  var myStyle = document.createElement("style");
  myStyle.setAttribute("id", "BioJSHomologyToolStyle");
  myStyle.setAttribute("type", "text/css");
  myStyle.innerHTML = styles.toString();
  return myStyle;
}

/**
 * === Don't remove this method or styles will break.
 * Check if there is already a style element for this component and add if not.
 * Useful in cases where this component might be initialised more than once.
 **/
function addStylesIfNeeded() {
  if (!document.getElementById("BioJSHomologyToolStyle")) {
    document.head.appendChild(styleTemplate());
  }
}

/**
 * initialises an existing library, called inside the web component wrapper.
 **/
function initComponent(options) {
  return {
    get: (host, v) => v, // required to be recognized as property descriptor,
    set: () => {}, //required to stop TypeError: setting getter-only property "x"
    connect: (host, key) => {
      var res;
      var organism = host.getAttribute("organism");
      var URL = 'http://registry.intermine.org/service';
      axios.get(URL + '/instances', {
        params: { q:"q - " + organism
}      })
      .then((response) => {
        res = JSON.parse(response.request.response);
        console.log(res.instances);
        if(res.instances.length === 0) {
          throw("No results");
        }
        res.instances.map((value, index) => {
          findHomologues(value.url, index + 1, value.name);
        })
      })
      .catch((err) => {
        console.log(err);
        document.getElementById('status').innerHTML = 'Error:' + err;
      })
    
      function findHomologues(url, index, interMineName) {
        var service  = {root: url};
        var query    = {
          "from": "Gene",
          "select": [
            "organism.name",
            "symbol",
            "name",
            "primaryIdentifier",
            "secondaryIdentifier"
          ],
          "orderBy": [
            {
              "path": "symbol",
              "direction": "ASC"
            }
          ],
          "where": [
            {
              "path": "homologues.homologue",
              "op": "LOOKUP",
              "value": host.getAttribute("gene"), // REPLACE VALUE WITH THE GENE TO BE SEARCHED FOR
              "extraValue": "",
              "code": "A"
            }
          ]
        };
        intermine = new imjs.Service(service);
        var array, result;
        intermine.records(query).then(function(response) {
          console.log(response);
          if(!response.length) {
            throw("No result");
          }
          array = response.map((value) => {
            if(isNull(value.symbol)) {
              return { symbol: value.primaryIdentifier, name: value.organism.name }
            } else {
              return { symbol: value.symbol, name: value.organism.name }
            }
          })
          result = array.reduce((unique, o) => {
            if(!unique.some(obj => obj.name === o.name && obj.symbol === o.symbol)) {
              unique.push(o);
            }
            return unique;
          },[]);
          console.log(result);
          var list;
          if(index === 1) {
            var intermineNameRow = document.createElement('tr');
            intermineNameRow.innerHTML = "<th style=background-color:black;color:white;>INTERMINE</th><th style=background-color:black;color:white;>" + interMineName + "</th>";
            var headingRow = document.createElement('tr');
            headingRow.innerHTML = "<th>Organism Name</th><th>Gene Symbol</th>";
            document.getElementById('results').appendChild(intermineNameRow);
            document.getElementById('results').appendChild(headingRow);
          } else {
            var intermineNameRow = document.createElement('tr');
            intermineNameRow.innerHTML = "<th style=background-color:black;color:white;>INTERMINE</th><th style=background-color:black;color:white;>" + interMineName + "</th>";
            document.getElementById('results').appendChild(intermineNameRow);
          }
          result.map((value) => {
            var newRow = document.createElement('tr');
            newRow.innerHTML = `<tr><th>${value.symbol}</th><th>${value.name}</th></tr>`;
            document.getElementById('status').style.display = 'none';
            document.getElementById('results').append(newRow);
          })
        })
        .catch((err) => {
          console.log(err);
          document.getElementById('status').innerHTML = 'Error:' + err;
        });
      }
      //leave this line here. Deleting it will result in your css going AWOL.
      addStylesIfNeeded();
    }
  }
}

/**
 * This is where we place the bulk of the code, wrapping an existing BioJS component
 * or where we might initialise a component written from scratch. Needs to be
 * paired with a `define` method call - see end of the page.
 **/
export const BioJSHomologyTool = {
  init: initComponent()
};

// this line connects the html element in index.html with the javascript defined above.
define('homologues-finder', BioJSHomologyTool);
