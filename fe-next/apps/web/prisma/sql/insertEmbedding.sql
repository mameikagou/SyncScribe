-- @param {String} $1:id
-- @param {String} $2:content
-- @param {String} $4:resourceId
-- @param {Int} $5:pageNumber
-- @param {Int} $6:chunkIndex
-- @param {String} $7:category
-- @param {Json} $8:layoutInfo

INSERT INTO "embeddings" (
  "id",
  "content",
  "vector",
  "resourceId",
  "pageNumber",
  "chunkIndex",
  "category",
  "layoutInfo"
)
VALUES (
  $1::uuid,
  $2,
  $3::real[]::vector, -- 自动推导
  $4::uuid,
  $5::int,
  $6::int,
  $7,
  $8::jsonb
);


-- In prisma/sql/insertEmbedding.sql:
-- Error: SQL documentation parsing: missing position or alias (eg: $1:alias) at '@param {String} id - UUID'.
-- fix：@param {String} $1:alias


-- In prisma/sql/insertEmbedding.sql:
-- Error: SQL documentation parsing: invalid type: 'Float[]' (accepted types are: 'Int', 'BigInt', 'Float', 'Boolean', 'String', 'DateTime', 'Json', 'Bytes', 'Decimal') at '{Float[]} $3:vector'.
-- fix： remove "@param {Float[]} $3:vector"  and  "use $3::real[]::vector" -- 自动推导
