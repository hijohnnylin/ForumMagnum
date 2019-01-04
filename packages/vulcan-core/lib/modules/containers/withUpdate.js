/*

Generic mutation wrapper to update a document in a collection. 

Sample mutation: 

  mutation updateMovie($input: UpdateMovieInput) {
    updateMovie(input: $input) {
      data {
        _id
        name
        __typename
      }
      __typename
    }
  }

Arguments: 

  - input
    - input.selector: a selector to indicate the document to update
    - input.data: the document (set a field to `null` to delete it)

Child Props:

  - updateMovie({ selector, data })
  
*/

import React, { Component } from 'react';
import { graphql } from 'react-apollo';
import { compose, withHandlers } from 'recompose';
import gql from 'graphql-tag';
import { updateClientTemplate } from 'meteor/vulcan:lib';
import clone from 'lodash/clone';

import { extractCollectionInfo, extractFragmentInfo } from './handleOptions';

const withUpdate = options => {
  const { collectionName, collection } = extractCollectionInfo(options);
  const { fragmentName, fragment } = extractFragmentInfo(options, collectionName);

  const typeName = collection.options.typeName;
  const query = gql`
    ${updateClientTemplate({ typeName, fragmentName })}
    ${fragment}
  `;

  const withHandlersOptions = {
    [`update${typeName}`]: ({ mutate }) => args => {
      const { selector, data } = args;
      return mutate({
        variables: { selector, data }
        // note: updateQueries is not needed for editing documents
      });
    },
    // OpenCRUD backwards compatibility
    editMutation: ({ mutate }) => args => {
      const { documentId, set, unset } = args;
      const selector = { documentId };
      const data = clone(set);
      unset &&
        Object.keys(unset).forEach(fieldName => {
          data[fieldName] = null;
        });
      return mutate({
        variables: { selector, data }
        // note: updateQueries is not needed for editing documents
      });
    }
  }
  
  return compose(
    graphql(query, {alias: `withUpdate${typeName}`}),
    withHandlers(withHandlersOptions)
  )
};

export default withUpdate;
