import * as RDF from 'rdf-js'
import * as N3 from 'n3'
import { storeStream } from 'rdf-store-stream'
import ns from '../util/NameSpaces'
import { RelationType, Literal, Collection, Node, Relation } from '../util/Util';
import * as jsonld from 'jsonld';

const context = { "@vocab": ns.tree('') }

export async function extractMetadata (quads: RDF.Quad[] | RDF.Stream) {
  // Create triple store of data quads
  const store : N3.Store = Array.isArray(quads)
    ? await new N3.Store(quads)
    : await storeStream(quads)

  const collectionIds = await extractCollectionids(store)
  const nodeIds = await extractNodeIds(store)
  const relationIds = await extractRelationIds(store)

  const collectionsMetadata = new Array();
  const nodesMetadata = new Array();
  const relationsMetadata = new Array();

  for (let id of collectionIds) {
    const metadata = await extractCollectionMetadata(store, id)
    collectionsMetadata.push(await jsonld.compact(metadata, context))
  }
  for (let id of nodeIds) {
    const metadata = await extractNodeMetadata(store, id)
    nodesMetadata.push(await jsonld.compact(metadata, context))
  }
  for (let id of relationIds) {
    const metadata = await extractRelationMetadata(store, id)
    relationsMetadata.push(await jsonld.compact(metadata, context))
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

  // extract tree:view metadata
  setField(c, "@type", store.getQuads(id, ns.rdf('type'), null, null).map(quad => quad.object.id));

  setField(c, "view", store.getQuads(id, ns.tree('view'), null, null).map(quad => retrieveFullObject(store, quad.object)));
  setField(c, "view", store.getQuads(id, ns.hydra('view'), null, null).map(quad => retrieveFullObject(store, quad.object)));
  setField(c, "view", store.getQuads(id, ns.void('subset'), null, null).map(quad => retrieveFullObject(store, quad.object)));
  setField(c, "view", store.getQuads(id, ns.dct('isPartOf'), null, null).map(quad => retrieveFullObject(store, quad.subject)));
  setField(c, "member", store.getQuads(id, ns.tree('member'), null, null).map(quad => retrieveFullObject(store, quad.object)));
  setField(c, "member", store.getQuads(id, ns.hydra('member'), null, null).map(quad => retrieveFullObject(store, quad.object)));
  setField(c, "import", store.getQuads(id, ns.tree('import'), null, null).map(quad => retrieveFullObject(store, quad.object)));
  setField(c, "importStream", store.getQuads(id, ns.tree('importStream'), null, null).map(quad => retrieveFullObject(store, quad.object)));
  setField(c, "conditionalImport", store.getQuads(id, ns.tree('conditionalImport'), null, null).map(quad => retrieveFullObject(store, quad.object)));
  return c;
}

function extractNodeMetadata(store: N3.Store, id: string) {
  const n : Node = { 
    "@context": context,
    "@id": id,
   }

  // extract tree:view metadata
  setField(n, "@type", store.getQuads(id, ns.rdf('type'), null, null).map(quad => quad.object.id));
  setField(n, "search", store.getQuads(id, ns.tree('search'), null, null).map(quad => retrieveFullObject(store, quad.object)));
  setField(n, "relation", store.getQuads(id, ns.tree('relation'), null, null).map(quad => retrieveFullObject(store, quad.object)));
  setField(n, "import", store.getQuads(id, ns.tree('import'), null, null).map(quad => retrieveFullObject(store, quad.object)));
  setField(n, "importStream", store.getQuads(id, ns.tree('importStream'), null, null).map(quad => retrieveFullObject(store, quad.object)));
  setField(n, "conditionalImport", store.getQuads(id, ns.tree('conditionalImport'), null, null).map(quad => retrieveFullObject(store, quad.object)));
  return n;
}

function extractRelationMetadata(store: N3.Store, id: string) {
  const r : Relation = { 
    "@context": context,
    "@id": id,
   }

  // extract tree:view metadata
  setField(r, "@type", store.getQuads(id, ns.rdf('type'), null, null).map(quad =>  quad.object.id));
  setField(r, "remainingItems", store.getQuads(id, ns.tree('remainingItems'), null, null).map(quad => retrieveFullObject(store, quad.object)));
  setField(r, "path", store.getQuads(id, ns.tree('path'), null, null).map(quad => retrieveFullObject(store, quad.object)));
  setField(r, "value", store.getQuads(id, ns.tree('value'), null, null).map(quad => retrieveFullObject(store, quad.object)));
  setField(r, "node", store.getQuads(id, ns.tree('node'), null, null).map(quad => retrieveFullObject(store, quad.object)));
  setField(r, "import", store.getQuads(id, ns.tree('import'), null, null).map(quad => retrieveFullObject(store, quad.object)));
  setField(r, "importStream", store.getQuads(id, ns.tree('importStream'), null, null).map(quad => retrieveFullObject(store, quad.object)));
  setField(r, "conditionalImport", store.getQuads(id, ns.tree('conditionalImport'), null, null).map(quad => retrieveFullObject(store, quad.object)));
  return r;
}

function retrieveFullObject(store: N3.Store, term: N3.Term){

  switch (term.termType) {
    case "Literal":
      return createLiteral(store, term as N3.Literal)
    case "BlankNode":
      return createNode(store, term as N3.BlankNode)
    case "NamedNode":
      return createNode(store, term as N3.NamedNode)
    default:
      // We do not process variables in metadata extraction.
      return {};
  } 
}

const createLiteral = (store: N3.Store, literal: N3.Literal) : Literal => {
  const item : Literal = { "@value": literal.value }
  if (literal.datatype) item["@type"] = literal.datatype.id
  if (literal.language) item["@language"] = literal.language;
  return item;
}

const createNode = (store: N3.Store, namedNode: N3.NamedNode | N3.BlankNode) => {
  const item : any = namedNode.termType === "NamedNode" ? { "@id": namedNode.id } : {}
  const quads = store.getQuads(namedNode.id, null, null, null)
  for (let quad of quads) {
    if (quad.predicate.id === ns.rdf('type')) item["@type"] = quad.object.id
    else item[quad.predicate.id] = retrieveFullObject(store, quad.object)
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