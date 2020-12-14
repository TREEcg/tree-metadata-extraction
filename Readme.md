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

for (const collection of metadata.collections) {
  collection
}


```

### Extracted metadata

| Object                | Metadata field      | type          |
|-----------------------|---------------------|---------------|
| Collection            | @id                 | string
|                       | @type               | [ string ]
|                       | view                | [ URI ] # References a Node object
|                       | member              | [ URI ]
|                       | import              | [ URI ]
|                       | importStream        | [ URI ]
|                       | conditionalImport   | [ ConditionalImport ]
| Node                  | @id                 | string
|                       | @type               | [ string ]
|                       | search              | [ object ]
|                       | relation            | [ URI ] # References a Relation object
|                       | import              | [ object
|                       | importStream        | [ object
|                       | conditionalImport   | [ ConditionalImport
| Relation              | @id                 | string
|                       | @type               | [ string
|                       | remainingItems      | [ Literal
|                       | path                | [ object
|                       | value               | [ object
|                       | node                | [ object
|                       | import              | [ URI
|                       | importStream        | [ URI
|                       | conditionalImport   | [ ConditionalImport
| ConditionalImport     | path                | [ object
|                       | import              | [ URI
|                       | importStream        | [ URI
| Literal               | @value              | stringtype
|                       | @type               | string
|                       | @language           | string
| URI                   | @id                 | string
| object                | @id                 | string

