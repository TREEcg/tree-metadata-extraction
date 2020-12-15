## TREE metadata extraction
This library handles the extraction of [TREE](https://treecg.github.io/specification/) metadata from RDF data.

### Installation

#### Node
```
const extractMetadata = require('@treecg/tree-metadata-extraction').extractMetadata
```

#### typescript
```
import { extractMetadata } from '@treecg/tree-metadata-extraction';
```

### Usage

```
// quads is an array of RDF Quads (RDF.Quad[])
const metadata = extractMetadata(quads)

// Retrieve extracted collections metadata
for (const collectionId of metadata.collections.keys()) {
  const collection = metadata.collections.get(collectionId)
}

// Retrieve extracted nodes metadata
for (const nodeId of metadata.nodes.keys()) {
  const node = metadata.nodes.get(nodeId)
}

// Retrieve extracted relations metadata
for (const relationId of metadata.relations.keys()) {
  const relation = metadata.relations.get(relationId)
}
```

### Extracted metadata
In this section, the extracted fields per class are listed.
In the case an Object is returned, it can have arbitrary fields that are not listed below.

| Object                | Metadata field      | type          |
|-----------------------|---------------------|---------------|
| Collection            | @id                 | string
|                       | @type               | [ string ]
|                       | view                | [ URI ] # References a Node object
|                       | member              | [ URI ]
|                       | shape               | [ object ]
|                       | import              | [ URI ]
|                       | importStream        | [ URI ]
|                       | conditionalImport   | [ ConditionalImport ]
| Node                  | @id                 | string
|                       | @type               | [ string ]
|                       | search              | [ object ]
|                       | relation            | [ URI ] # References a Relation object
|                       | import              | [ object ]
|                       | importStream        | [ object ]
|                       | conditionalImport   | [ ConditionalImport ]
| Relation              | @id                 | string
|                       | @type               | [ string ]
|                       | remainingItems      | [ Literal ]
|                       | path                | [ object ]
|                       | value               | [ object ]
|                       | node                | [ object ]
|                       | import              | [ URI ]
|                       | importStream        | [ URI ]
|                       | conditionalImport   | [ ConditionalImport ]
| ConditionalImport     | path                | [ object ]
|                       | import              | [ URI ]
|                       | importStream        | [ URI ]
| Literal               | @value              | [ string ] 
|                       | @type               | [ string ]
|                       | @language           | [ string ]
| URI                   | @id                 | string
| object                | @id                 | string
|                       | <span style="color:red">...</span>                | <span style="color:red">[ any ]</span>



### Examples

#### Retrieve the ids of all members of all collections available in the quad array.
```
// Parse the input into a quad array
const quads = parse(input)

// Extract the tree metadata from the quad array
const metadata = extractMetadata(quads)

const memberIds = []

// Retrieve extracted collections metadata
for (const collectionId of metadata.collections.keys()) {
  // Get the collection object
  const collection = metadata.collections.get(collectionId)
  // Map the member URIs to extract the @id values
  const memberURIs = collection.member.map(uri => uri["@id"])
  // Store the @id values
  memberIds = memberIds.concat(memberURIs)
}

return memberIds
```