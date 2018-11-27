import * as React from "react"
import { DocumentNode } from "graphql"

function useTextInputState() {}

function useEnumInputState() {}

function useRelationInputState() {}

export function TextInput() {
  return <div />
}

export function RelationInput() {
  return <div />
}

interface GraphQLFormViewPropTypes {
  introspection: any
  query: DocumentNode
  mutation: DocumentNode
  defaultValue: any
}
export const GraphQLFormView: React.SFC<GraphQLFormViewPropTypes> = props => {
  return <div />
}
