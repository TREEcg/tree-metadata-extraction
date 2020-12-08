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

export interface Collection {
  "@context": any,
  "@id": string,
  "view"?: any[],
  "member"?: any[],
  "import"?: any[],
  "importStream"?: any[],
  "conditionalImport"?: any[],
}

export interface Node {
  "@context": any,
  "@id": string,
  "@type"?: string[],
  "search"?: any[],
  "relation"?: any[],
  "import"?: any[],
  "importStream"?: any[],
  "conditionalImport"?: any[],

}

export interface Relation {
  "@context": any,
  "@id": string,
  "@type"?: string[],
  "remainingItems"?: any[],
  "path"?: any[],
  "value"?: any[],
  "node"?: any[],
  "import"?: any[],
  "importStream"?: any[],
  "conditionalImport"?: any[],
}

export interface Literal {
  "@value": string,
  "@type"?: string,
  "@language"?: string,
}
