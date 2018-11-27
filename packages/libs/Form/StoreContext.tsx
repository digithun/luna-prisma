import * as React from "react"
import { FormMeta } from "../generateFormMetaFromSDL"
import ApolloClient, { ObservableQuery } from "apollo-client"
import { OperationVariables, MutationFn } from "react-apollo"

type GraphQLFormStore = ReturnType<typeof useGraphQLFormState>

export function useGraphQLFormState<TState extends object = {}>(
  defaultValue: TState = {} as TState,
  query: ObservableQuery<{}, OperationVariables>,
  mutate: MutationFn,
  dataKey: string
) {
  const [state, setState] = React.useState<TState>(defaultValue)

  React.useEffect(() => {
    const s = query.subscribe(({ data, loading, errors }) => {
      setState(Object.assign({}, state, data[dataKey]))
    })
    return () => {
      s.unsubscribe()
    }
  }, [])

  return {
    state,
    onChangeHandler: (kind: FormMeta["kind"], key: string) => (
      value: string
    ) => {
      switch (kind) {
        case "FormTextInputFieldMeta":
          break
      }
      setState(Object.assign(state, { [key]: value }))
    },

    onSubmit: () => {
      // Doing upsert document to server
    },
  }
}

export const GraphQLFormContext = React.createContext<
  GraphQLFormStore | undefined
>(undefined)

export const GraphQLStoreConsumer: React.SFC<{
  children: (store: GraphQLFormStore) => React.ReactNode
}> = ({ children }) => {
  return (
    <GraphQLFormContext.Consumer>
      {store => {
        if (!store) {
          throw new Error("GraphQLForm, store is not defined")
        }
        return children(store)
      }}
    </GraphQLFormContext.Consumer>
  )
}
