-- @param {Int} $1:limit

SELECT
  e."id" AS "embeddingId",
  e."content",
  e."resourceId",
  r."fileName",
  r."fileType",
  e."pageNumber",
  e."chunkIndex",
  e."category",
  e."layoutInfo",
  r."metadata" AS "resourceMetadata",
  e."createdAt",
  (e."vector" <=> $2::real[]::vector) AS "distance",
  1 - (e."vector" <=> $2::real[]::vector) AS "similarity"
FROM "embeddings" e
LEFT JOIN "resources" r ON r."id" = e."resourceId"
ORDER BY "distance"
LIMIT $1;
