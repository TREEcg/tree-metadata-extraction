/* eslint-disable no-multi-str */
import { expect } from 'chai'
import 'mocha'
import * as N3 from 'n3'
import * as RDF from 'rdf-js'
import ns from '../src/util/NameSpaces';
// import { extractMetadata } from '../src/lib/metadataextraction';
import { extractMetadata } from '../src/lib/metadataExtraction';
import { Collection, Node, Relation, JSONLDLiteral, clearObj, RelationType, JSONLDIdentifier } from '../src/util/Util';
import * as jsonld from 'jsonld';

const context = { "@vocab": ns.tree(''), ex: ns.ex(''), xsd: ns.xsd('') }

var testcount = 0
async function test (turtleString, result, message) {
  it(message, async () => {
    const quadArray = [];
    await new N3.Parser().parse(turtleString,
      (_error, quad, prefixes) => {
        if (_error) console.log('error', _error)
        if (quad) quadArray.push(quad)
      })

    await evaluateMetadataExtraction(quadArray, result)
  })
}

function clearJSONLDBlankNodeIds (obj) {
  for(const prop in obj) {
    delete obj["@context"]
    if (prop === '@id') {
      if (obj["@id"].startsWith('_:')) { // blank node id
        delete obj[prop];
      }
    } else if (typeof obj[prop] === 'object')
    clearJSONLDBlankNodeIds(obj[prop]);
  }
}

async function evaluateMetadataExtraction(input, result) {
  const extractedMetadataPerType = await extractMetadata(input)
  // Check if output is valid JSONLD
  for (let type of ['collections', 'nodes', 'relations']) {
    
    // Clear blank node Ids
    clearJSONLDBlankNodeIds(extractedMetadataPerType[type]);
    clearJSONLDBlankNodeIds(result[type]);

    console.log(JSON.stringify(extractedMetadataPerType[type], null, 2))
    
    expect (extractedMetadataPerType[type].length).to.equal(result[type].length)
    for (let i = 0; i < extractedMetadataPerType[type].length; i++) {
      expect(extractedMetadataPerType[type][i]).to.deep.equal(result[type][i])
      // expect(await jsonld.expand(extractedMetadataPerType[type][i])).to.deep.equal(await jsonld.expand(result[type][i]))
    }
  }
}

describe('Testing path matching',
  () => {

    var collectionTest =  `
      @prefix ex: <${ns.ex('')}> . 
      @prefix tree: <${ns.tree('')}> . 
      ex:c a tree:Collection ;
        tree:view ex:node1 ;
        tree:view ex:node2 ;
        tree:member ex:m1 ;
        tree:member ex:m2 ;
        tree:member ex:m3 ;
        tree:import ex:filetoimport.ttl .
    `

    var c = {
      "@context": context, 
      "@id": ns.ex("c"),
      "@type": "Collection",
      "import": { "@id": ns.ex("filetoimport.ttl") },
      "member": [{ "@id": ns.ex("m1") }, { "@id": ns.ex("m2") }, { "@id": ns.ex("m3") }],
      "view": [  { "@id": ns.ex("node1") }, { "@id": ns.ex("node2") } ]
    }
    
    var collectionTestResult = {
      collections: [c], nodes: [], relations: [],
    }
    
    test(collectionTest, collectionTestResult, "Should be able to extract TREE collection metadata from a quad array")


    var nodeTest =  `
      @prefix ex: <${ns.ex('')}> . 
      @prefix tree: <${ns.tree('')}> . 
      ex:n a tree:Node ;
        tree:relation ex:relation1 ;
        tree:relation ex:relation2 ;
        tree:search _:search ;
        tree:conditionalImport _:conditionalimport .

      _:search tree:timeQuery "timeQuery";
        tree:zoom "zoom";
        tree:latitudeTile "latitudeTile";
        tree:longitudeTile "longitudeTile".

      _:conditionalimport a tree:ConditionalImport;
        tree:path ex:pathName;
        tree:import ex:import;
        tree:importstream ex:importstream.
    `
    var n = {
      "@context": context,
      "@id": ns.ex("n"),
      "@type": "Node",
      "conditionalImport": {
        "@type": "ConditionalImport",
        "import": { "@id": ns.ex("import") },
        "importstream": { "@id": ns.ex("importstream") },
        "path": { "@id": ns.ex("pathName") }
      },
      "relation": [ 
        { "@id": ns.ex("relation1") }, 
        { "@id": ns.ex("relation2") }
      ],
      "search": {
        "latitudeTile": {
          "@value": "latitudeTile",
          "@type": ns.xsd("string"),
        },
        "longitudeTile": {
          "@value": "longitudeTile",
          "@type": ns.xsd("string"),
        },
        "timeQuery": {
          "@value": "timeQuery",
          "@type": ns.xsd("string"),
        },
        "zoom": {
          "@value": "zoom",
          "@type": ns.xsd("string"),
        }
      }
    }
   
    var nodeTestResult = {
      collections: [], nodes: [n], relations: [],
    }
    
    test(nodeTest, nodeTestResult, "Should be able to extract TREE node metadata from a quad array")



    var relationTest =  `
      @prefix ex: <${ns.ex('')}> . 
      @prefix tree: <${ns.tree('')}> . 
      @prefix xsd: <${ns.xsd('')}> . 
      ex:r a tree:PrefixRelation ;
        tree:remainingItems "10"^^xsd:integer ;
        tree:path ex:predicatePath ;
        tree:value "test" ;
        tree:node ex:Node2 ;
        tree:conditionalImport _:conditionalimport2 ;
        tree:import ex:import .

      _:conditionalimport2 a tree:ConditionalImport ;
      tree:path ex:pathName ;
      tree:import ex:import ;
      tree:importstream ex:importstream .
    `
    var r = {
      "@context": context,
      "@id": ns.ex("r"),
      "@type": "PrefixRelation",
      "conditionalImport": { 
        "@type": "ConditionalImport",
        "import": { "@id": ns.ex("import") },
        "importstream": { "@id": ns.ex("importstream") },
        "path": { "@id": ns.ex("pathName") }
      },
      "import": { "@id": ns.ex("import") },
      "node": { "@id": ns.ex("Node2") },
      "path": { "@id": ns.ex("predicatePath") },
      "remainingItems": {
        "@value": "10",
        "@type": ns.xsd("integer"),
      },
      "value": {
        "@value": "test",
        "@type": ns.xsd("string"),
      }
    }

   
    var relationTestResult = {
      collections: [], nodes: [], relations: [r],
    }
    
    test(relationTest, relationTestResult, "Should be able to extract TREE relation metadata from a quad array")
    





    var combinedTest =  `
      @prefix ex: <${ns.ex('')}> . 
      @prefix tree: <${ns.tree('')}> . 
      @prefix xsd: <${ns.xsd('')}> . 
      ex:c a tree:Collection ;
        tree:view ex:node1 ;
        tree:view ex:node2 ;
        tree:member ex:m1 ;
        tree:member ex:m2 ;
        tree:member ex:m3 ;
        tree:import ex:filetoimport.ttl .

      ex:n a tree:Node ;
        tree:relation ex:relation1 ;
        tree:relation ex:relation2 ;
        tree:search _:search ;
        tree:conditionalImport _:conditionalimport .

      ex:r a tree:PrefixRelation ;
      tree:remainingItems "10"^^xsd:integer ;
      tree:path ex:predicatePath ;
      tree:value "test" ;
      tree:node ex:Node2 ;
      tree:conditionalImport _:conditionalimport2 ;
      tree:import ex:import .

      _:search tree:timeQuery "timeQuery";
        tree:zoom "zoom";
        tree:latitudeTile "latitudeTile";
        tree:longitudeTile "longitudeTile".

      _:conditionalimport a tree:ConditionalImport;
        tree:path ex:pathName;
        tree:import ex:import;
        tree:importstream ex:importstream.

      _:conditionalimport2 a tree:ConditionalImport ;
        tree:path ex:pathName ;
        tree:import ex:import ;
        tree:importstream ex:importstream .
    `

    var combinedTestResults = {
      collections: [c], nodes: [n], relations: [r],
    }

    test(combinedTest, combinedTestResults, "Should be able to extract all TREE metadata from a quad array")

    const sensordatatest = `
      <https://streams.datapiloten.be/sensors#lora.3432333857376518@2020-06-30T14:32:57.732Z> <http://purl.org/dc/terms/isVersionOf> <https://streams.datapiloten.be/sensors#lora.3432333857376518> .
      <https://streams.datapiloten.be/sensors#lora.3432333857376518@2020-06-30T14:32:57.732Z> <http://www.opengis.net/ont/geosparql#hasGeometry> _:b7 .
      <https://streams.datapiloten.be/sensors#lora.3432333857376518@2020-06-30T14:32:57.732Z> <http://www.w3.org/ns/prov#generatedAtTime> "2020-06-30T14:32:57.732Z"^^<xsd:dateTime> .
      <https://streams.datapiloten.be/sensors#lora.3432333857376518@2020-06-30T14:32:57.732Z> <http://www.w3.org/ns/sosa/observes> <https://w3id.org/cot/PM1> .
      <https://streams.datapiloten.be/sensors#lora.3432333857376518@2020-06-30T14:32:57.784Z> <http://purl.org/dc/terms/isVersionOf> <https://streams.datapiloten.be/sensors#lora.3432333857376518> .
      <https://streams.datapiloten.be/sensors#lora.3432333857376518@2020-06-30T14:32:57.784Z> <http://www.opengis.net/ont/geosparql#hasGeometry> _:b8 .
      <https://streams.datapiloten.be/sensors#lora.3432333857376518@2020-06-30T14:32:57.784Z> <http://www.w3.org/ns/prov#generatedAtTime> "2020-06-30T14:32:57.784Z"^^<xsd:dateTime> .
      <https://streams.datapiloten.be/sensors#lora.3432333857376518@2020-06-30T14:32:57.784Z> <http://www.w3.org/ns/sosa/observes> <https://w3id.org/cot/NO2> .
      <https://streams.datapiloten.be/sensors#lora.3432333857376518@2020-06-30T14:32:57.784Z> <http://www.w3.org/ns/sosa/observes> <https://w3id.org/cot/O3> .
      <https://streams.datapiloten.be/sensors#lora.3432333857376518@2020-06-30T14:32:57.784Z> <http://www.w3.org/ns/sosa/observes> <https://w3id.org/cot/PM10> .
      <https://streams.datapiloten.be/sensors#lora.3432333857376518@2020-06-30T14:32:57.784Z> <http://www.w3.org/ns/sosa/observes> <https://w3id.org/cot/PM1> .
      <https://streams.datapiloten.be/sensors#lora.3432333857376518@2020-06-30T14:32:57.784Z> <http://www.w3.org/ns/sosa/observes> <https://w3id.org/cot/PM25> .
      <https://streams.datapiloten.be/sensors#lora.3432333857376518@2020-06-30T14:32:57.785Z> <http://purl.org/dc/terms/isVersionOf> <https://streams.datapiloten.be/sensors#lora.3432333857376518> .
      <https://streams.datapiloten.be/sensors#lora.3432333857376518@2020-06-30T14:32:57.785Z> <http://www.opengis.net/ont/geosparql#hasGeometry> _:b10 .
      <https://streams.datapiloten.be/sensors#lora.3432333857376518@2020-06-30T14:32:57.785Z> <http://www.opengis.net/ont/geosparql#hasGeometry> _:b11 .
      <https://streams.datapiloten.be/sensors#lora.3432333857376518@2020-06-30T14:32:57.785Z> <http://www.opengis.net/ont/geosparql#hasGeometry> _:b12 .
      <https://streams.datapiloten.be/sensors#lora.3432333857376518@2020-06-30T14:32:57.785Z> <http://www.w3.org/ns/prov#generatedAtTime> "2020-06-30T14:32:57.785Z"^^<xsd:dateTime> .
      <https://streams.datapiloten.be/sensors#lora.3432333857376518@2020-06-30T14:32:57.785Z> <http://www.w3.org/ns/sosa/observes> <https://w3id.org/cot/NO2> .
      <https://streams.datapiloten.be/sensors#lora.3432333857376518@2020-06-30T14:32:57.785Z> <http://www.w3.org/ns/sosa/observes> <https://w3id.org/cot/O3> .
      <https://streams.datapiloten.be/sensors#lora.3432333857376518@2020-06-30T14:32:57.785Z> <http://www.w3.org/ns/sosa/observes> <https://w3id.org/cot/PM1> .
      <https://streams.datapiloten.be/sensors#lora.3432333857376518@2020-06-30T14:32:57.785Z> <http://www.w3.org/ns/sosa/observes> <https://w3id.org/cot/PM25> .
      <https://streams.datapiloten.be/sensors> <https://w3id.org/tree#member> <https://streams.datapiloten.be/sensors#lora.3432333857376518@2020-06-30T14:32:57.732Z> .
      <https://streams.datapiloten.be/sensors> <https://w3id.org/tree#member> <https://streams.datapiloten.be/sensors#lora.3432333857376518@2020-06-30T14:32:57.784Z> .
      <https://streams.datapiloten.be/sensors> <https://w3id.org/tree#member> <https://streams.datapiloten.be/sensors#lora.3432333857376518@2020-06-30T14:32:57.785Z> .
      <https://streams.datapiloten.be/sensors> <https://w3id.org/tree#member> <urn:ngsi-v2:cot-imec-be:device:imec-airquality-mobile-55vA4L2hoZ3VA48YJQcUiJ#@2020-06-30T14:32:57.785Z> .
      <https://streams.datapiloten.be/sensors> <https://w3id.org/tree#shape> _:b0 .
      <https://streams.datapiloten.be/sensors> <https://w3id.org/tree#view> <https://streams.datapiloten.be/sensors?page=1> .
      <https://streams.datapiloten.be/sensors?page=1> <http://www.w3.org/ns/hydra/core#next> <https://streams.datapiloten.be/sensors?page=2> .
      <https://streams.datapiloten.be/sensors?page=1> <https://w3id.org/tree#relation> _:b13 .
      <urn:ngsi-v2:cot-imec-be:device:imec-airquality-mobile-55vA4L2hoZ3VA48YJQcUiJ#@2020-06-30T14:32:57.785Z> <http://purl.org/dc/terms/isVersionOf> <urn:ngsi-v2:cot-imec-be:device:imec-airquality-mobile-55vA4L2hoZ3VA48YJQcUiJ> .
      <urn:ngsi-v2:cot-imec-be:device:imec-airquality-mobile-55vA4L2hoZ3VA48YJQcUiJ#@2020-06-30T14:32:57.785Z> <http://www.opengis.net/ont/geosparql#hasGeometry> _:b9 .
      <urn:ngsi-v2:cot-imec-be:device:imec-airquality-mobile-55vA4L2hoZ3VA48YJQcUiJ#@2020-06-30T14:32:57.785Z> <http://www.w3.org/ns/prov#generatedAtTime> "2020-06-30T14:32:57.785Z"^^<xsd:dateTime> .
      <urn:ngsi-v2:cot-imec-be:device:imec-airquality-mobile-55vA4L2hoZ3VA48YJQcUiJ#@2020-06-30T14:32:57.785Z> <http://www.w3.org/ns/sosa/observes> <https://w3id.org/cot/PM10> .
      _:b0 <https://www.w3.org/ns/shacl#property> _:b1 .
      _:b0 <https://www.w3.org/ns/shacl#property> _:b2 .
      _:b0 <https://www.w3.org/ns/shacl#property> _:b3 .
      _:b0 <https://www.w3.org/ns/shacl#property> _:b6 .
      _:b1 <https://www.w3.org/ns/shacl#maxCount> "1"^^<xsd:integer> .
      _:b1 <https://www.w3.org/ns/shacl#minCount> "1"^^<xsd:integer> .
      _:b1 <https://www.w3.org/ns/shacl#nodeKind> <https://www.w3.org/ns/shacl#IRI> .
      _:b1 <https://www.w3.org/ns/shacl#path> <http://purl.org/dc/terms/isVersionOf> .
      _:b10 <http://www.opengis.net/ont/geosparql#asWKT> "POINT (4.8376199416816235 50.977539075538516)"^^<http://www.opengis.net/ont/geosparql#wktLiteral> .
      _:b11 <http://www.opengis.net/ont/geosparql#asWKT> "POINT (4.8376199416816235 50.977539075538516)"^^<http://www.opengis.net/ont/geosparql#wktLiteral> .
      _:b12 <http://www.opengis.net/ont/geosparql#asWKT> "POINT (4.8376199416816235 50.977539075538516)"^^<http://www.opengis.net/ont/geosparql#wktLiteral> .
      _:b13 <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://w3id.org/tree#GreaterThanRelation> .
      _:b13 <https://w3id.org/tree#node> <https://streams.datapiloten.be/sensors?page=2> .
      _:b13 <https://w3id.org/tree#path> <http://www.w3.org/ns/prov#generatedAtTime> .
      _:b13 <https://w3id.org/tree#value> "2020-06-30T14:48:52.013Z"^^<xsd:dateTime> .
      _:b2 <https://www.w3.org/ns/shacl#datatype> <xsd:dateTime> .
      _:b2 <https://www.w3.org/ns/shacl#maxCount> "1"^^<xsd:integer> .
      _:b2 <https://www.w3.org/ns/shacl#minCount> "1"^^<xsd:integer> .
      _:b2 <https://www.w3.org/ns/shacl#path> <http://www.w3.org/ns/prov#generatedAtTime> .
      _:b3 <https://www.w3.org/ns/shacl#maxCount> "1"^^<xsd:integer> .
      _:b3 <https://www.w3.org/ns/shacl#minCount> "1"^^<xsd:integer> .
      _:b3 <https://www.w3.org/ns/shacl#node> _:b4 .
      _:b3 <https://www.w3.org/ns/shacl#path> <http://www.opengis.net/ont/geosparql#hasGeometry> .
      _:b4 <https://www.w3.org/ns/shacl#property> _:b5 .
      _:b5 <https://www.w3.org/ns/shacl#datatype> <http://www.opengis.net/ont/geosparql#wktLiteral> .
      _:b5 <https://www.w3.org/ns/shacl#maxCount> "1"^^<xsd:integer> .
      _:b5 <https://www.w3.org/ns/shacl#minCount> "1"^^<xsd:integer> .
      _:b5 <https://www.w3.org/ns/shacl#path> <http://www.opengis.net/ont/geosparql#asWKT> .
      _:b6 <https://www.w3.org/ns/shacl#minCount> "1"^^<xsd:integer> .
      _:b6 <https://www.w3.org/ns/shacl#nodeKind> <https://www.w3.org/ns/shacl#IRI> .
      _:b6 <https://www.w3.org/ns/shacl#path> <http://www.w3.org/ns/sosa/observes> .
      _:b7 <http://www.opengis.net/ont/geosparql#asWKT> "POINT (4.8376199416816235 50.977539075538516)"^^<http://www.opengis.net/ont/geosparql#wktLiteral> .
      _:b8 <http://www.opengis.net/ont/geosparql#asWKT> "POINT (4.8376199416816235 50.977539075538516)"^^<http://www.opengis.net/ont/geosparql#wktLiteral> .
      _:b9 <http://www.opengis.net/ont/geosparql#asWKT> "POINT (4.415566977113485 51.23746876604855)"^^<http://www.opengis.net/ont/geosparql#wktLiteral> .
    `

    var sensorC = {
      "@id": "https://streams.datapiloten.be/sensors",

    }

    const sensordataResult = {
      collections: [sensorC],
      nodes: [],
      relations: [],
    }

    // test(sensordatatest, sensordataResult, "Should be able to extract all metadata for the example sensor data.")
  })
