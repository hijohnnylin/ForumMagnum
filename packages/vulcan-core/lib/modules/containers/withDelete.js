/*

Generic mutation wrapper to remove a document from a collection. 

Sample mutation: 

  mutation deleteMovie($input: DeleteMovieInput) {
    deleteMovie(input: $input) {
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
    - input.selector: the id of the document to remove

Child Props:

  - deleteMovie({ selector })
  
*/

import React, { Component } from 'react';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import { deleteClientTemplate } from 'meteor/vulcan:core';
import { extractCollectionInfo, extractFragmentInfo } from './handleOptions';
import { compose, withHandlers } from 'recompose';

const withDelete = options => {
  const { collectionName, collection } = extractCollectionInfo(options);
  const { fragmentName, fragment } = extractFragmentInfo(options, collectionName);

  const typeName = collection.options.typeName;
  const query = gql`
    ${deleteClientTemplate({ typeName, fragmentName })}
    ${fragment}
  `;

  const withHandlersOptions = {
    [`delete${typeName}`]: ({ mutate }) => args => {
      const { selector } = args;
      return mutate({
        variables: { selector }
      });
    },
    // OpenCRUD backwards compatibility
    removeMutation: ({ mutate }) => args => {
      const { documentId } = args;
      const selector = { documentId };
      return mutate({
        variables: { selector }
      });
    },
  }    

  // wrap component with graphql HoC
  return compose(
    graphql(query, {alias: `withDelete${typeName}`}),
    withHandlers(withHandlersOptions)
  )
};

export default withDelete;
