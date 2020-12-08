import ns from './NameSpaces';
import * as RDF from 'rdf-js';
import * as N3 from 'n3';

export enum RelationType {
  Relation = 'https://w3id.org/tree#Relation', // ns.tree("Relation"),
  PrefixRelation = 'https://w3id.org/tree#PrefixRelation', // ns.tree("PrefixRelation"),
  SubstringRelation = 'https://w3id.org/tree#SubstringRelation', // ns.tree("SubstringRelation"),
  GreaterThanRelation = 'https://w3id.org/tree#GreaterThanRelation', // ns.tree("GreaterThanRelation"),
  GreaterOrEqualThanRelation = 'https://w3id.org/tree#GreaterOrEqualThanRelation', // ns.tree("GreaterOrEqualThanRelation"),
  LessThanRelation = 'https://w3id.org/tree#LessThanRelation', // ns.tree("LessThanRelation"),
  LessOrEqualThanRelation = 'https://w3id.org/tree#LessOrEqualThanRelation', // ns.tree("LessOrEqualThanRelation"),
  EqualThanRelation = 'https://w3id.org/tree#EqualThanRelation', // ns.tree("EqualThanRelation"),
  GeospatiallyContainsRelation = 'https://w3id.org/tree#GeospatiallyContainsRelation', // ns.tree("GeospatiallyContainsRelation"),
  InBetweenRelation = 'https://w3id.org/tree#InBetweenRelation', // ns.tree("InBetweenRelation"),
}

export class JSONLDIdentifier {
  '@id'?: string;
  constructor(term : RDF.Term) {
    if (term.termType === "NamedNode")
      this['@id'] = (term as N3.Term).id
  }
}

abstract class TreeObject extends JSONLDIdentifier{
  '@context' = ns.tree('');
  constructor(term: RDF.Term) {
    super(term)
  }
}

export class Collection extends TreeObject {
  '@type' = 'Collection';
  'member'?: Array<JSONLDIdentifier>;                // 0   -   n
  'view'?: Array<JSONLDIdentifier>;                  // 0   -   n
  'shape'?: Array<any>;                              // 0   -   1
  'import'?: Array<JSONLDIdentifier>;                // 0   -   n

}

export class Node extends TreeObject {
  '@type' = 'Node';
  'relation'?: Array<JSONLDIdentifier>;              // 0   -   n
  'search'?: Array<IRITemplate>;                     // 0   -   n
  'conditionalImport'?: Array<ConditionalImport>;    // 0   -   n
}

export class Relation extends TreeObject {
  constructor(term: RDF.Term, type: RelationType) {
    super(term);
    this["@type"] = type;
  }
  '@type': RelationType;
  'remainingItems'?: Array<JSONLDLiteral>;           // 0   -   1
  'path'?: Array<any>; // Shacl property path        // 0   -   n
  'value'?: Array<JSONLDLiteral>;                    // 0   -   1
  'node'?: Array<JSONLDIdentifier>;                  // 0   -   n
  'conditionalImport'?: Array<ConditionalImport>;    // 0   -   n
  'import'?: Array<JSONLDIdentifier>;                // 0   -   n
}


export class ConditionalImport extends TreeObject {
  '@type' = 'ConditionalImport';
  'path'?: Array<any>; // Shacl property path               // 0   -   1
  'import'?: Array<JSONLDIdentifier>;                       // 0   -   1
  'importstream'?: Array<JSONLDIdentifier>;                 // 0   -   n
}

export class IRITemplate extends TreeObject{
  'timeQuery'?: Array<any>;                              // 0   -   1
  'zoom'?: Array<any>;                                   // 0   -   1
  'latitudeTile'?: Array<any>;                           // 0   -   1
  'longitudeTile'?: Array<any>;                          // 0   -   1
}

export class JSONLDLiteral {
  '@value': string;
  '@type'?: string;
  '@language'?: string;
  constructor(value, type?, language?) {
    this['@value'] = value
    if (type) this['@type'] = type
    if (language) this['@language'] = language
  }
}


export const clearObj = (obj) => { Object.keys(obj).forEach(key => (!obj[key] || (Array.isArray(obj[key]) && obj[key].length === 0)) && delete obj[key]) ; return obj } 