import * as RDF from 'rdf-js'
import * as N3 from 'n3'
import { storeStream } from 'rdf-store-stream'
import ns from '../util/NameSpaces'
import { RelationType, Literal, Collection, Node, Relation, ConditionalImport } from '../util/Util';
import * as jsonld from 'jsonld';

const context = { "@vocab": ns.tree('') }

export async function extractMetadata (quads: RDF.Quad[]) {
  // Create triple store of data quads
  const store : N3.Store = await new N3.Store(quads)

  const collectionIds = await extractCollectionids(store)
  const nodeIds = await extractNodeIds(store)
  const relationIds = await extractRelationIds(store)

  // const collectionsMetadata = new Array();
  // const nodesMetadata = new Array();
  // const relationsMetadata = new Array();
  const collectionsMetadata = new Map();
  const nodesMetadata = new Map();
  const relationsMetadata = new Map();

  for (let id of collectionIds) {
    const metadata = await extractCollectionMetadata(store, id)
    collectionsMetadata.set(id, metadata)

    // const expanded = await jsonld.expand(metadata)
    // collectionsMetadata.set(id, expanded[0]) // we take the first value, because we know we extracted metadata for a single collection, which should in a single object
    // collectionsMetadata.push(await jsonld.compact(metadata, context))
  }
  for (let id of nodeIds) {
    const metadata = await extractNodeMetadata(store, id)
    nodesMetadata.set(id, metadata)

    // const expanded = await jsonld.expand(metadata)
    // nodesMetadata.set(id, expanded[0]) // we take the first value, because we know we extracted metadata for a single collection, which should in a single object
    // nodesMetadata.push(await jsonld.compact(metadata, context))
  }
  for (let id of relationIds) {
    const metadata = await extractRelationMetadata(store, id)
    relationsMetadata.set(id, metadata)

    // const expanded = await jsonld.expand(metadata)
    // relationsMetadata.set(id, expanded[0]) // we take the first value, because we know we extracted metadata for a single collection, which should in a single object
    // relationsMetadata.push(await jsonld.compact(metadata, context))
    
  }
  return {collections: collectionsMetadata, nodes: nodesMetadata, relations: relationsMetadata}
}

/**
 * Extract the ids of the collections from the store
 * @param store 
 */
function extractCollectionids(store: N3.Store) {
  let ids: string[] = []
  // Search for collection ids
  ids = ids.concat( store.getQuads(null, ns.rdf('type'), ns.tree('Collection'), null).map(quad => quad.subject.id) );
  ids = ids.concat( store.getQuads(null, ns.rdf('type'), ns.hydra('Collection'), null).map(quad => quad.subject.id) );
  ids = ids.concat( store.getQuads(null, ns.tree('view'), null, null).map(quad => quad.subject.id) );
  ids = ids.concat( store.getQuads(null, ns.hydra('view'), null, null).map(quad => quad.subject.id) );
  ids = ids.concat( store.getQuads(null, ns.void('subset'), null, null).map(quad => quad.subject.id) );
  // Match on dct:isPartOf property -> collection id is object here
  ids = ids.concat( store.getQuads(null, ns.dct('isPartOf'), null, null).map(quad => quad.object.id) );
  ids = ids.concat( store.getQuads(null, ns.tree('member'), null, null).map(quad => quad.subject.id) );
  ids = ids.concat( store.getQuads(null, ns.hydra('member'), null, null).map(quad => quad.subject.id) );
  return Array.from(new Set(ids))
}

/**
 * Extract the ids of the nodes from the store
 * @param store 
 */
function extractNodeIds(store: N3.Store) {
  let ids: string[] = []
  // Search for node ids
  ids = ids.concat( store.getQuads(null, ns.rdf('type'), ns.tree('Node'), null).map(quad => quad.subject.id) );
  ids = ids.concat( store.getQuads(null, ns.rdf('type'), ns.hydra('PartialCollectionView'), null).map(quad => quad.subject.id) );
  ids = ids.concat( store.getQuads(null, ns.tree('search'), null, null).map(quad => quad.subject.id) );
  ids = ids.concat( store.getQuads(null, ns.tree('relation'), null, null).map(quad => quad.subject.id) );
  return Array.from(new Set(ids))
}

/**
 * Extract the ids of the relations from the store
 * @param store 
 */
function extractRelationIds(store: N3.Store) {
  let ids: string[] = []
  // Search for node ids
  for(let relationType of Object.keys(RelationType).map(key => (RelationType as any)[key]) ) {
    ids = ids.concat( store.getQuads(null, ns.rdf('type'), relationType, null).map(quad => quad.subject.id) );
  }
  return Array.from(new Set(ids))
}

function extractCollectionMetadata(store: N3.Store, id: string) {
  const c : Collection = { 
    "@context": context,
    "@id": id,
   }

  // Extract collection type
  setField(c, "@type", store.getQuads(id, ns.rdf('type'), null, null).map(quad => quad.object.id));

  // Extract view ids
  setField(c, "view", store.getQuads(id, ns.tree('view'), null, null).map(quad => retrieveFullObject(store, quad.object, false)));
  setField(c, "view", store.getQuads(id, ns.hydra('view'), null, null).map(quad => retrieveFullObject(store, quad.object, false)));
  setField(c, "view", store.getQuads(id, ns.void('subset'), null, null).map(quad => retrieveFullObject(store, quad.object, false)));
  setField(c, "view", store.getQuads(id, ns.dct('isPartOf'), null, null).map(quad => retrieveFullObject(store, quad.subject, false)));

  // Extract member ids
  setField(c, "member", store.getQuads(id, ns.tree('member'), null, null).map(quad => retrieveFullObject(store, quad.object, false)));
  setField(c, "member", store.getQuads(id, ns.hydra('member'), null, null).map(quad => retrieveFullObject(store, quad.object, false)));

  // Extract full import objects
  setField(c, "import", store.getQuads(id, ns.tree('import'), null, null).map(quad => retrieveFullObject(store, quad.object)));
  setField(c, "importStream", store.getQuads(id, ns.tree('importStream'), null, null).map(quad => retrieveFullObject(store, quad.object)));
  setField(c, "conditionalImport", store.getQuads(id, ns.tree('conditionalImport'), null, null).map(quad => extractConditionalImportMetadata(store, quad.object)));
  return c;
}

function extractNodeMetadata(store: N3.Store, id: string) {
  const n : Node = { 
    "@context": context,
    "@id": id,
   }

  // Extract node type
  setField(n, "@type", store.getQuads(id, ns.rdf('type'), null, null).map(quad => quad.object.id));

  // extract full search object
  setField(n, "search", store.getQuads(id, ns.tree('search'), null, null).map(quad => retrieveFullObject(store, quad.object)));
  
  // Extract relation ids
  setField(n, "relation", store.getQuads(id, ns.tree('relation'), null, null).map(quad => retrieveFullObject(store, quad.object, false)));

  // Extract full import objects
  setField(n, "import", store.getQuads(id, ns.tree('import'), null, null).map(quad => retrieveFullObject(store, quad.object)));
  setField(n, "importStream", store.getQuads(id, ns.tree('importStream'), null, null).map(quad => retrieveFullObject(store, quad.object)));
  setField(n, "conditionalImport", store.getQuads(id, ns.tree('conditionalImport'), null, null).map(quad => extractConditionalImportMetadata(store, quad.object)));
  return n;
}

function extractRelationMetadata(store: N3.Store, id: string) {
  const r : Relation = { 
    "@context": context,
    "@id": id,
   }

  // Extract relation type
  setField(r, "@type", store.getQuads(id, ns.rdf('type'), null, null).map(quad =>  quad.object.id));
  
  // Extract remaining Items literal 
  setField(r, "remainingItems", store.getQuads(id, ns.tree('remainingItems'), null, null).map(quad => retrieveFullObject(store, quad.object)));
  
  // Extract full path object
  setField(r, "path", store.getQuads(id, ns.tree('path'), null, null).map(quad => retrieveFullObject(store, quad.object)));

  // Extract full value object
  setField(r, "value", store.getQuads(id, ns.tree('value'), null, null).map(quad => retrieveFullObject(store, quad.object)));

  // Extract node id
  setField(r, "node", store.getQuads(id, ns.tree('node'), null, null).map(quad => retrieveFullObject(store, quad.object, false)));

  // Extract full import objects
  setField(r, "import", store.getQuads(id, ns.tree('import'), null, null).map(quad => retrieveFullObject(store, quad.object)));
  setField(r, "importStream", store.getQuads(id, ns.tree('importStream'), null, null).map(quad => retrieveFullObject(store, quad.object)));
  setField(r, "conditionalImport", store.getQuads(id, ns.tree('conditionalImport'), null, null).map(quad => extractConditionalImportMetadata(store, quad.object)));
  return r;
}


function extractConditionalImportMetadata(store: N3.Store, term: N3.Term) {
  const ci : ConditionalImport = { }
  if (N3.Util.isNamedNode(term)) { 
    ci ["@id"] = term.value 
  }
  const id = term.id
  // Extract full import objects
  setField(ci, "path", store.getQuads(id, ns.tree('path'), null, null).map(quad => retrieveFullObject(store, quad.object)));
  setField(ci, "import", store.getQuads(id, ns.tree('import'), null, null).map(quad => retrieveFullObject(store, quad.object)));
  setField(ci, "importStream", store.getQuads(id, ns.tree('importStream'), null, null).map(quad => retrieveFullObject(store, quad.object)));
  return ci;
}


/**
 * Recursively retrieve data by following all available predicates
 * @param store 
 * @param term 
 * @param recursive 
 * @param processedIds 
 */
function retrieveFullObject(store: N3.Store, term: N3.Term, recursive = true, processedIds : string[] = []){
  switch (term.termType) {
    case "Literal":
      return createLiteral(store, term as N3.Literal)
    case "BlankNode":
      if (recursive) {
        return createObject(store, term as N3.BlankNode, processedIds)
      } else {
        return { '@id': term.id }
      }
    case "NamedNode":
      if (recursive) {
        return createObject(store, term as N3.NamedNode, processedIds)
      } else {
        return { '@id': term.id }
      }
    default:
      // We do not process variables in metadata extraction.
      return {};
  } 
}

/**
 * Create a literal object
 * @param store 
 * @param literal 
 */
const createLiteral = (store: N3.Store, literal: N3.Literal) : Literal => {
  const item : Literal = { "@value": literal.value }
  if (literal.datatype) item["@type"] = literal.datatype.id
  if (literal.language) item["@language"] = literal.language;
  return item;
}

/**
 * Create an object, and recursively add objects for all 
 * @param store 
 * @param namedNode 
 * @param processedIds 
 */
const createObject = (store: N3.Store, namedNode: N3.NamedNode | N3.BlankNode, processedIds: string[]) => {
  const item : any = namedNode.termType === "NamedNode" ? { "@id": namedNode.id } : {}
  const quads = store.getQuads(namedNode.id, null, null, null)
  for (let quad of quads) {
    if (quad.predicate.id === ns.rdf('type')) item["@type"] = quad.object.id
    else {
      // Check for circular dereferencing
      if (!quad.object.id || processedIds.indexOf(quad.object.id) === -1) {
        const newProcessedIds = processedIds.concat(quad.object.id)
        const object = retrieveFullObject(store, quad.object, true, newProcessedIds)
        item[quad.predicate.id] = item[quad.predicate.id] ? item[quad.predicate.id].concat([object]) : [object] 
      } else {
        console.error(`circular dependency discovered for ${quad.object.id}`)
        const object = {"@id": quad.object.id}
        item[quad.predicate.id] = item[quad.predicate.id] ? item[quad.predicate.id].concat([object]) : [object] 
      }
    }
  }
  return item
}

/**
 * Helper function. Only add a field if there is a value for this field.
 * If the field already has results, concatenate the new results.
 */
function setField(object: any, field: string, results: any[]) {
  if (results && results.length) {
    if (object.field && object.field.length) {
      object[field] = object[field].concat(results)
    } else {
      object[field] = results
    }
  }
}