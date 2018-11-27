import * as React from "react"
import { GraphQLFormView } from "luna-prisma-tools"
import gql from "graphql-tag"
import { createApolloClient } from "."
import { ApolloProvider } from "react-apollo"

const TODO_QUERY = gql`
  query TodoQuery($where: TodoWhereUniqueInput!) {
    todo(where: $where) @form {
      id
      color @input
      description @input
      name @input
      state
    }
  }
`

const TODO_MUTATION = gql`
  mutation UpsertTodo(
    $where: TodoWhereUniqueInput!
    $create: TodoCreateInput!
    $update: TodoUpdateInput!
  ) {
    upsertTodo(where: $where, create: $create, update: $update) {
      id
      name
      description
      state
      color
    }
  }
`

interface TodoPagePropTypes {
  query: {
    id?: string
  }
}
export default (props: TodoPagePropTypes) => {
  const client = createApolloClient({
    uri: "http://localhost:4466/luna/default",
  })
  return (
    // @ts-ignore
    <ApolloProvider client={client}>
      <div>
        <GraphQLFormView
          query={TODO_QUERY}
          mutation={TODO_MUTATION}
          defaultValue={{}}
          variables={{
            where: {
              id: props.query.id,
            },
          }}
          introspection={require("../static/luna-schema.json")}
        />
      </div>
    </ApolloProvider>
  )
}
