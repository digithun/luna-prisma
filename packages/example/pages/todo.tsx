import * as React from "react"
import { GraphQLFormView } from "luna-prisma-tools"
import gql from "graphql-tag"
import { createApolloClient } from "."
import { ApolloProvider } from "react-apollo"
import Router from "next/router"
import Link from "next/link"

const TODO_QUERY = gql`
  query TodoQuery($where: TodoWhereUniqueInput!) {
    todo(where: $where) @form(label: "Edit Todo item") {
      id
      color @input
      description @input
      name @input
      state @input(label: "Completed ?")
    }
  }
`

const TODO_MUTATION = gql`
  mutation UpsertTodo(
    $where: TodoWhereUniqueInput!
    $create: TodoCreateInput!
    $update: TodoUpdateInput!
  ) {
    data: upsertTodo(where: $where, create: $create, update: $update) {
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

  function reloadIDToQueryOnSave(data) {
    Router.push(`/todo?id=${data.id}`)
  }

  return (
    // @ts-ignore
    <ApolloProvider client={client}>
      <div className="px-4 py-4">
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              {
                // @ts-ignore
                <Link href="/">
                  <a>{"Todo List"}</a>
                </Link>
              }
            </li>
            <li className="breadcrumb-item active" aria-current="page">
              {"Edit Todo"}
            </li>
          </ol>
        </nav>
        <GraphQLFormView
          debug
          query={TODO_QUERY}
          mutation={TODO_MUTATION}
          defaultValue={{}}
          onSave={reloadIDToQueryOnSave}
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
