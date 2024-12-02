export const acceptsSchemaHash = "9bff3fcce056471127ba9282be7be567";

import JargonTerms from "@/lib/collections/jargonTerms/collection"
import { addField, createTable, dropField, dropTable, updateIndexes } from "./meta/utils"
import Users from "@/lib/vulcan-users";

export const up = async ({db}: MigrationContext) => {
  await createTable(db, JargonTerms);
  await updateIndexes(JargonTerms);

  await addField(db, Users, 'postGlossariesPinned');
}

export const down = async ({db}: MigrationContext) => {
  await dropTable(db, JargonTerms);

  await dropField(db, Users, 'postGlossariesPinned');
}
