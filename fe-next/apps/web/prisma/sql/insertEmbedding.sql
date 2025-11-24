-- @param {String} $1:id
-- @param {String} $2:content
-- @param {String} $4:resourceId

INSERT INTO "embeddings" ("id", "content", "vector", "resourceId")
VALUES (
  $1::uuid, 
  $2, 
  $3::real[]::vector, -- 自动推导
  $4::uuid
);


-- In prisma/sql/insertEmbedding.sql:
-- Error: SQL documentation parsing: missing position or alias (eg: $1:alias) at '@param {String} id - UUID'.
-- fix：@param {String} $1:alias


-- In prisma/sql/insertEmbedding.sql:
-- Error: SQL documentation parsing: invalid type: 'Float[]' (accepted types are: 'Int', 'BigInt', 'Float', 'Boolean', 'String', 'DateTime', 'Json', 'Bytes', 'Decimal') at '{Float[]} $3:vector'.
-- fix： remove "@param {Float[]} $3:vector"  and  "use $3::real[]::vector" -- 自动推导