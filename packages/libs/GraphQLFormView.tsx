import * as React from "react"
import { DocumentNode } from "graphql"
import {
  parseSDLToFormMeta,
  FormMeta,
  getFormDataFieldKey,
} from "./generateFormMetaFromSDL"
import { useGraphQLFormState, GraphQLFormContext } from "./Form/StoreContext"
import { EnumInputField } from "./Form/EnumInput"
import { FormInputFieldMetaPropTypes, TextInputField } from "./Form/TextInput"
import { ApolloConsumer, MutationFn, MutationOptions } from "react-apollo"
import ApolloClient, {
  ObservableQuery,
  OperationVariables,
} from "apollo-client"

const fieldRenderer: Pick<
  { [key: string]: React.SFC<FormInputFieldMetaPropTypes> },
  FormMeta["kind"]
> = {
  FormDateInputFieldMeta: props => {
    return (
      <div>
        <input />
      </div>
    )
  },
  FormEnumInputFieldMeta: EnumInputField,
  FormIDInputFieldMeta: props => <div />,
  FormTextInputFieldMeta: props => (
    <div className="form-group">
      <label
        htmlFor={props.meta.key}
        dangerouslySetInnerHTML={{
          __html: props.meta.label || props.meta.key,
        }}
      />
      <TextInputField {...props} />
    </div>
  ),
}

interface FromGroupPropTypes {
  fieldInputs: FormMeta[]
  defaultValue: any
  query: ObservableQuery<{}, OperationVariables>
  mutate: MutationFn
  dataKey: string
}
const FromGroup: React.SFC<FromGroupPropTypes> = ({
  defaultValue,
  fieldInputs,
  query,
  mutate,
  dataKey,
}) => {
  const store = useGraphQLFormState(defaultValue, query, mutate, dataKey)

  return (
    <GraphQLFormContext.Provider value={store}>
      {fieldInputs.map(field => {
        const Field = fieldRenderer[field.kind]
        return <Field key={field.key} meta={field} />
      })}
      <code>{dataKey + JSON.stringify(store.state)}</code>
      <div>
        <button>{"Submit"}</button>
        <button>{"Cancel"}</button>
      </div>
    </GraphQLFormContext.Provider>
  )
}

interface GraphQLFormViewPropTypes {
  introspection: any
  query: DocumentNode
  mutation: DocumentNode
  defaultValue: any
  variables?: any
}
export const GraphQLFormView: React.SFC<GraphQLFormViewPropTypes> = props => {
  const { defaultValue, mutation, query, introspection, variables } = props
  const fieldInputs = parseSDLToFormMeta(query, introspection)
  const dataNode = getFormDataFieldKey(query)
  if (!dataNode) {
    throw new Error("Please provide @form directive")
  }

  return (
    // @ts-ignore
    <ApolloConsumer>
      {client => {
        function mutateFn(options?: MutationOptions) {
          return client.mutate(Object.assign({ mutation }, options))
        }
        return (
          <FromGroup
            dataKey={dataNode.name.value}
            query={client.watchQuery({
              query,
              variables,
            })}
            mutate={mutateFn}
            fieldInputs={fieldInputs}
            defaultValue={defaultValue}
          />
        )
      }}
    </ApolloConsumer>
  )
}
