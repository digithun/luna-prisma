import "isomorphic-fetch"
import * as React from "react"
import gql from "graphql-tag"
import { concat, ApolloLink } from "apollo-link"
import { GraphQLTableView } from "luna-prisma-tools"
import { ApolloClient } from "apollo-boost"
import { InMemoryCache } from "apollo-cache-inmemory"

import { removeDirectivesFromDocument } from "apollo-utilities"
import { createUploadLink } from "apollo-upload-client"
import Router from "next/router"

export interface IApolloClientOptions {
  uri: string
}
export function createApolloClient(options: IApolloClientOptions) {
  const LunaApolloLink = concat(
    new ApolloLink((operation, forward) => {
      /**
       * Remove every directive
       * from graphQLView Utils
       */
      operation.query = removeDirectivesFromDocument(
        [
          {
            // from TableView
            test: d => !!d.name.value.match(/(column|value|lang|table)/),
          },
          {
            // from FormInput
            test: d => d.name.value === "input",
            remove: false,
          },
          {
            // from Relation Input
            test: d =>
              !!d.name.value.match(/(label|relation|value|datasources|form)/),
          },
        ],
        operation.query
      )!
      return forward!(operation)
    }),
    createUploadLink({
      uri: options.uri,
    })
  )

  return new ApolloClient({
    link: LunaApolloLink,
    cache: new InMemoryCache(),
  })
}

const TODOES_QUERY = gql`
  query {
    todoes {
      id
      name @column(lable: "Name")
      description @column(lable: "Description")
      state @column(lable: "State")
      color @column(lable: "Color")
    }
  }
`

const TODOLIST_QUERY = gql`
  query {
    todoLists {
      id
      name @column(lable: "Name")
    }
  }
`

export default class extends React.Component {
  public render() {
    const client = createApolloClient({
      uri: "http://localhost:4466/luna/default",
    })
    return (
      <div className="title">
        <div className="py-3 px-3">
          <h4>{"Todo Lists"}</h4>
          <GraphQLTableView
            client={client}
            query={TODOLIST_QUERY}
            introspection={require("../static/luna-schema.json")}
          />
        </div>

        <div className="py-3 px-3">
          <h4>{"Todo"}</h4>
          <GraphQLTableView
            client={client}
            query={TODOES_QUERY}
            introspection={require("../static/luna-schema.json")}
            // tslint:disable-next-line:jsx-no-lambda
            onEditClick={item => {
              Router.push(`/todo?id=${item.id}`)
            }}
          />
        </div>
      </div>
    )
  }
}
