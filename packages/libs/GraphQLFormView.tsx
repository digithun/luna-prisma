import * as React from "react"
import { DocumentNode } from "graphql"
import {
  parseSDLToFormMeta,
  FormMeta,
  getFormDataFieldKey,
  getFormLabel,
} from "./generateFormMetaFromSDL"
import { useGraphQLFormState, GraphQLFormContext } from "./Form/StoreContext"
import { EnumInputField } from "./Form/EnumInput"
import { FormInputFieldMetaPropTypes, TextInputField } from "./Form/TextInput"
import { ApolloConsumer, MutationFn, MutationOptions } from "react-apollo"
import ApolloClient, {
  ObservableQuery,
  OperationVariables,
} from "apollo-client"

import className from "classnames"
import { BooleanInputField } from "./Form/BooleanInputField"

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
  FormTextInputFieldMeta: props => <TextInputField {...props} />,
  FormBooleanInputFieldMeta: props => <BooleanInputField {...props} />,
}

const CodeDebug = ({ children }) => (
  <code style={{ whiteSpace: "pre" }}>{children}</code>
)

interface FromGroupPropTypes {
  fieldInputs: FormMeta[]
  defaultValue: any
  query: ObservableQuery<{}, OperationVariables>
  mutate: MutationFn
  onSave: (data: any) => void
  dataKey: string
  debug?: boolean
  name?: string
}
const FromGroup: React.SFC<FromGroupPropTypes> = ({
  defaultValue,
  fieldInputs,
  query,
  mutate,
  dataKey,
  debug,
  onSave,
  name,
}) => {
  function onDataSaved(data) {
    // on data save
    // reload current page with
    // id change
    onSave(data)
  }

  const store = useGraphQLFormState({
    defaultValue,
    query,
    mutate,
    dataKey,
    onSave: onDataSaved,
    formMetas: fieldInputs,
  })
  const { error, isDirty, isMutateLoading, isQueryLoading } = store

  return (
    <GraphQLFormContext.Provider value={store}>
      <div className="card">
        <div className="card-header">{name}</div>
        <div className="card-body">
          {error ? (
            <div
              dangerouslySetInnerHTML={{ __html: error.message }}
              className="alert alert-danger"
            />
          ) : null}

          {isQueryLoading ? (
            <>
              <div style={{ width: "18%" }} className="input__loading--line" />
              <div style={{ width: "28%" }} className="input__loading--line" />
              <div style={{ width: "25%" }} className="input__loading--line" />
              <div style={{ width: "48%" }} className="input__loading--line" />
            </>
          ) : (
              fieldInputs.map(field => {
                const Field = fieldRenderer[field.kind]
                return (
                  <div className="form-group" key={field.key}>
                    <label
                      htmlFor={field.key}
                      dangerouslySetInnerHTML={{
                        __html: field.label || field.key,
                      }}
                    />
                    <Field meta={field} />
                  </div>
                )
              })
            )}
          <div className="text-right">
            <button className="btn btn-secondary mr-2">{"Cancel"}</button>
            <button
              onClick={store.onSubmit}
              className={className(
                "btn",
                { "btn-primary": isDirty },
                { "btn-success": !isDirty }
              )}
            >
              {isMutateLoading ? (
                <div className="loader" />
              ) : (
                  <span>{isDirty ? "Save" : "Saved"}</span>
                )}
            </button>
          </div>
        </div>
      </div>
      {debug ? (
        <>
          <CodeDebug>
            {dataKey + ":\n" + JSON.stringify(store, null, " ")}
          </CodeDebug>
        </>
      ) : null}
    </GraphQLFormContext.Provider>
  )
}

interface GraphQLFormViewPropTypes {
  introspection: any
  query: DocumentNode
  mutation: DocumentNode
  onSave?: (data: any) => void
  defaultValue: any
  variables?: any
  debug?: boolean
}
export const GraphQLFormView: React.SFC<GraphQLFormViewPropTypes> = props => {
  const {
    defaultValue,
    debug,
    mutation,
    query,
    introspection,
    variables,
  } = props
  const fieldInputs = parseSDLToFormMeta(query, introspection)
  const dataNode = getFormDataFieldKey(query)
  const formLabel = getFormLabel(query)
  if (!dataNode) {
    throw new Error("Please provide @form directive")
  }

  function onSave(data) {
    if (props.onSave) {
      props.onSave(data)
    }
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
            onSave={onSave}
            debug={debug}
            mutate={mutateFn}
            fieldInputs={fieldInputs}
            defaultValue={defaultValue}
            name={formLabel}
          />
        )
      }}
    </ApolloConsumer>
  )
}
