/**
 * Init the graphQL schema
 */

import { makeExecutableSchema } from 'apollo-server';
import { getAdditionalSchemas, queries, mutations, getContext, getDirectives, getResolvers, getCollections } from '../../../lib/vulcan-lib/graphql';
import { runCallbacks } from '../../../lib/vulcan-lib/callbacks';
import {
  selectorInputTemplate,
  mainTypeTemplate,
  createInputTemplate,
  createDataInputTemplate,
  updateInputTemplate,
  updateDataInputTemplate,
  orderByInputTemplate,
  selectorUniqueInputTemplate,
  deleteInputTemplate,
  upsertInputTemplate,
  singleInputTemplate,
  multiInputTemplate,
  multiOutputTemplate,
  singleOutputTemplate,
  mutationOutputTemplate,
  singleQueryTemplate,
  multiQueryTemplate,
  createMutationTemplate,
  updateMutationTemplate,
  upsertMutationTemplate,
  deleteMutationTemplate,
} from '../../../lib/vulcan-lib/graphql_templates';
import { Utils } from '../../../lib/vulcan-lib/utils';
import deepmerge from 'deepmerge';
import GraphQLJSON from 'graphql-type-json';
import GraphQLDate from 'graphql-date';
import * as _ from 'underscore';

const queriesToGraphQL = (queries): string =>
  `type Query {
${queries.map(q =>
        `${
          q.description
            ? `  # ${q.description}\n`
            : ''
        }  ${q.query}
  `
    )
    .join('\n')}
}

`;
const mutationsToGraphQL = (mutations): string =>
  mutations.length > 0
    ? `
${
        mutations.length > 0
          ? `type Mutation {

${mutations
              .map(m => `${
                m.description
                  ? `  # ${m.description}\n`
                  : ''
              }  ${m.mutation}\n`)
              .join('\n')}
}
`
          : ''
      }

`
    : '';

// generate GraphQL schemas for all registered collections
const getTypeDefs = () => {
  const schemaContents: Array<string> = [
    "scalar JSON",
    "scalar Date",
    getAdditionalSchemas(),
  ];
  
  const allQueries = [...queries];
  const allMutations = [...mutations];
  const allResolvers: Array<any> = [];
  
  for (let collection of getCollections()) {
    const { schema, addedQueries, addedResolvers, addedMutations } = generateSchema(collection);

    for (let query of addedQueries) allQueries.push(query);
    for (let resolver of addedResolvers) allResolvers.push(resolver);
    for (let mutation of addedMutations) allMutations.push(mutation);
    
    schemaContents.push(schema);
  }
  
  schemaContents.push(queriesToGraphQL(allQueries));
  schemaContents.push(mutationsToGraphQL(allMutations));
  
  return {
    schemaText: schemaContents.join("\n"),
    addedResolvers: allResolvers,
  };
}

// get GraphQL type for a given schema and field name
const getGraphQLType = (schema, fieldName, isInput = false) => {
  const field = schema[fieldName];
  const type = field.type.singleType;
  const typeName =
    typeof type === 'object' ? 'Object' : typeof type === 'function' ? type.name : type;

  // LESSWRONG: Add optional property to override default input type generation
  if (isInput && field.inputType) {
    return field.inputType
  }

  switch (typeName) {
    case 'String':
      return 'String';

    case 'Boolean':
      return 'Boolean';

    case 'Number':
      return 'Float';

    case 'SimpleSchema.Integer':
      return 'Int';

    // for arrays, look for type of associated schema field or default to [String]
    case 'Array':
      const arrayItemFieldName = `${fieldName}.$`;
      // note: make sure field has an associated array
      if (schema[arrayItemFieldName]) {
        // try to get array type from associated array
        const arrayItemType = getGraphQLType(schema, arrayItemFieldName);
        return arrayItemType ? `[${arrayItemType}]` : null;
      }
      return null;

    case 'Object':
      return 'JSON';

    case 'Date':
      return 'Date';

    default:
      return null;
  }
};

// for a given schema, return main type fields, selector fields,
// unique selector fields, orderBy fields, creatable fields, and updatable fields
const getFields = (schema, typeName) => {
  const fields: any = {
    mainType: [],
    create: [],
    update: [],
    selector: [],
    selectorUnique: [],
    orderBy: [],
  };
  const addedResolvers: Array<any> = [];

  Object.keys(schema).forEach(fieldName => {
    const field = schema[fieldName];
    const fieldType = getGraphQLType(schema, fieldName);
    const inputFieldType = getGraphQLType(schema, fieldName, true);

    // only include fields that are viewable/insertable/editable and don't contain "$" in their name
    // note: insertable/editable fields must be included in main schema in case they're returned by a mutation
    // OpenCRUD backwards compatibility
    if (
      (field.canRead ||
        field.canCreate ||
        field.canUpdate ||
        field.viewableBy ||
        field.insertableBy ||
        field.editableBy) &&
      fieldName.indexOf('$') === -1
    ) {
      const fieldDescription = field.description;
      const fieldDirective = '';
      const fieldArguments: Array<any> = [];

      // if field has a resolveAs, push it to schema
      if (field.resolveAs) {
        // get resolver name from resolveAs object, or else default to field name
        const resolverName = field.resolveAs.fieldName || fieldName;

        // use specified GraphQL type or else convert schema type
        const fieldGraphQLType = field.resolveAs.type || fieldType;

        // if resolveAs is an object, first push its type definition
        // include arguments if there are any
        // note: resolved fields are not internationalized
        fields.mainType.push({
          description: field.resolveAs.description,
          name: resolverName,
          args: field.resolveAs.arguments,
          type: fieldGraphQLType,
        });

        // then build actual resolver object and pass it to addGraphQLResolvers
        const resolver = {
          [typeName]: {
            [resolverName]: (document, args, context: ResolverContext, info) => {
              const { currentUser } = context;
              const Users = context.Users as any; // Cast to any because monkeypatched functions aren't in the ResolverContext type definition
              // check that current user has permission to access the original non-resolved field
              const canReadField = Users.canReadField(currentUser, field, document);
              return canReadField
                ? field.resolveAs.resolver(document, args, context, info)
                : null;
            },
          },
        };
        addedResolvers.push(resolver);

        // if addOriginalField option is enabled, also add original field to schema
        if (field.resolveAs.addOriginalField && fieldType) {
          fields.mainType.push({
            description: fieldDescription,
            name: fieldName,
            args: fieldArguments,
            type: fieldType,
            directive: fieldDirective,
          });
        }
      } else {
        // try to guess GraphQL type
        if (fieldType) {
          fields.mainType.push({
            description: fieldDescription,
            name: fieldName,
            args: fieldArguments,
            type: fieldType,
            directive: fieldDirective,
          });
        }
      }

      // OpenCRUD backwards compatibility
      if (field.canCreate || field.insertableBy) {
        fields.create.push({
          name: fieldName,
          type: inputFieldType,
          required: !field.optional,
        });
      }
      // OpenCRUD backwards compatibility
      if (field.canUpdate || field.editableBy) {
        fields.update.push({
          name: fieldName,
          type: inputFieldType,
        });
      }
    }
  });
  return { fields, resolvers: addedResolvers };
};

// generate a GraphQL schema corresponding to a given collection
const generateSchema = (collection) => {
  let graphQLSchema = '';

  const schemaFragments: Array<string> = [];

  const collectionName = collection.options.collectionName;

  const typeName = collection.typeName
    ? collection.typeName
    : Utils.camelToSpaces(_.initial(collectionName).join('')); // default to posts -> Post

  const schema = collection.simpleSchema()._schema;

  const { fields, resolvers: fieldResolvers } = getFields(schema, typeName);

  const { interfaces = [], resolvers, mutations } = collection.options;

  const description = collection.options.description
    ? collection.options.description
    : `Type for ${collectionName}`;

  const { mainType, create, update, selector, selectorUnique, orderBy } = fields;
  
  let addedQueries: Array<any> = [];
  let addedResolvers: Array<any> = [...fieldResolvers];
  let addedMutations: Array<any> = [];

  if (mainType.length) {
    schemaFragments.push(
      mainTypeTemplate({ typeName, description, interfaces, fields: mainType })
    );
    schemaFragments.push(deleteInputTemplate({ typeName }));
    schemaFragments.push(singleInputTemplate({ typeName }));
    schemaFragments.push(multiInputTemplate({ typeName }));
    schemaFragments.push(singleOutputTemplate({ typeName }));
    schemaFragments.push(multiOutputTemplate({ typeName }));
    schemaFragments.push(mutationOutputTemplate({ typeName }));

    if (create.length) {
      schemaFragments.push(createInputTemplate({ typeName }));
      schemaFragments.push(createDataInputTemplate({ typeName, fields: create }));
    }

    if (update.length) {
      schemaFragments.push(updateInputTemplate({ typeName }));
      schemaFragments.push(upsertInputTemplate({ typeName }));
      schemaFragments.push(updateDataInputTemplate({ typeName, fields: update }));
    }

    schemaFragments.push(selectorInputTemplate({ typeName, fields: selector }));

    schemaFragments.push(selectorUniqueInputTemplate({ typeName, fields: selectorUnique }));

    schemaFragments.push(orderByInputTemplate({ typeName, fields: orderBy }));

    if (!_.isEmpty(resolvers)) {
      const queryResolvers = {};

      // single
      if (resolvers.single) {
        addedQueries.push({query: singleQueryTemplate({ typeName }), description: resolvers.single.description});
        queryResolvers[Utils.camelCaseify(typeName)] = resolvers.single.resolver.bind(
          resolvers.single
        );
      }

      // multi
      if (resolvers.multi) {
        addedQueries.push({query: multiQueryTemplate({ typeName }), description: resolvers.multi.description});
        queryResolvers[
          Utils.camelCaseify(Utils.pluralize(typeName))
        ] = resolvers.multi.resolver.bind(resolvers.multi);
      }
      addedResolvers.push({ Query: { ...queryResolvers } });
    }

    if (!_.isEmpty(mutations)) {
      const mutationResolvers = {};
      // create
      if (mutations.create) {
        // e.g. "createMovie(input: CreateMovieInput) : Movie"
        if (create.length === 0) {
          // eslint-disable-next-line no-console
          console.log(
            `// Warning: you defined a "create" mutation for collection ${collectionName}, but it doesn't have any mutable fields, so no corresponding mutation types can be generated. Remove the "create" mutation or define a "canCreate" property on a field to disable this warning`
          );
        } else {
          addedMutations.push({mutation: createMutationTemplate({ typeName }), description: mutations.create.description});
          mutationResolvers[`create${typeName}`] = mutations.create.mutation.bind(
            mutations.create
          );
        }
      }
      // update
      if (mutations.update) {
        // e.g. "updateMovie(input: UpdateMovieInput) : Movie"
        if (update.length === 0) {
          // eslint-disable-next-line no-console
          console.log(
            `// Warning: you defined an "update" mutation for collection ${collectionName}, but it doesn't have any mutable fields, so no corresponding mutation types can be generated. Remove the "update" mutation or define a "canUpdate" property on a field to disable this warning`
          );
        } else {
          addedMutations.push({mutation: updateMutationTemplate({ typeName }), description: mutations.update.description});
          mutationResolvers[`update${typeName}`] = mutations.update.mutation.bind(
            mutations.update
          );
        }
      }
      // upsert
      if (mutations.upsert) {
        // e.g. "upsertMovie(input: UpsertMovieInput) : Movie"
        if (update.length === 0) {
          // eslint-disable-next-line no-console
          console.log(
            `// Warning: you defined an "upsert" mutation for collection ${collectionName}, but it doesn't have any mutable fields, so no corresponding mutation types can be generated. Remove the "upsert" mutation or define a "canUpdate" property on a field to disable this warning`
          );
        } else {
          addedMutations.push({mutation: upsertMutationTemplate({ typeName }), description: mutations.upsert.description});
          mutationResolvers[`upsert${typeName}`] = mutations.upsert.mutation.bind(
            mutations.upsert
          );
        }
      }
      // delete
      if (mutations.delete) {
        // e.g. "deleteMovie(input: DeleteMovieInput) : Movie"
        addedMutations.push({mutation: deleteMutationTemplate({ typeName }), description: mutations.delete.description});
        mutationResolvers[`delete${typeName}`] = mutations.delete.mutation.bind(mutations.delete);
      }
      addedResolvers.push({ Mutation: { ...mutationResolvers } });
    }
    graphQLSchema = schemaFragments.join('\n\n') + '\n\n\n';
  } else {
    // eslint-disable-next-line no-console
    console.log(
      `// Warning: collection ${collectionName} doesn't have any GraphQL-enabled fields, so no corresponding type can be generated. Pass generateGraphQLSchema = false to createCollection() to disable this warning`
    );
  }

  return {
    schema: graphQLSchema,
    addedQueries,
    addedResolvers,
    addedMutations
  };
};



export const initGraphQL = () => {
  runCallbacks('graphql.init.before');
  
  const { schemaText, addedResolvers } = getTypeDefs();
  
  let allResolvers = deepmerge(
    getResolvers(),
    {
      JSON: GraphQLJSON,
      Date: GraphQLDate,
    }
  );
  for (let addedResolverGroup of addedResolvers) {
    allResolvers = deepmerge(allResolvers, addedResolverGroup);
  }
  
  executableSchema = makeExecutableSchema({
    typeDefs: schemaText,
    resolvers: allResolvers,
    schemaDirectives: getDirectives(),
  });

  return executableSchema;
};

let executableSchema: any = null;
export const getExecutableSchema = () => {
  if (!executableSchema) {
    throw new Error('Warning: trying to access executable schema before it has been created by the server.');
  }
  return executableSchema;
};

export const getSchemaContextBase = () => getContext();

