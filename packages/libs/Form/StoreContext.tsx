import * as React from "react"
import { FormMeta } from "../generateFormMetaFromSDL"
import ApolloClient, { ObservableQuery, ApolloError } from "apollo-client"
import { OperationVariables, MutationFn } from "react-apollo"
import { GraphQLError } from "graphql"
type GraphQLFormStore = ReturnType<typeof useGraphQLFormState>

// To use with prisma db
// this function generate payload for
// upsert mutation method from prisma
function CreatePrismaMutationVariables(state: any) {
  const { id, __typename, ...mutateRecord } = state as any
  return {
    where: {
      id: id || "",
    },
    create: {
      ...mutateRecord,
    },
    update: {
      ...mutateRecord,
    },
  }
}

export function useGraphQLFormState<TState extends object = {}>(options: {
  defaultValue: TState
  query: ObservableQuery<{}, OperationVariables>
  mutate: MutationFn
  dataKey: string
  formMetas: FormMeta[]
  onSave: (data: TState) => void
}) {
  if (!options.defaultValue) {
    options.defaultValue = {} as any
  }

  const { dataKey, defaultValue, mutate, query } = options

  const [state, setState] = React.useState<TState>(defaultValue)
  const [isMutateLoading, setIsMutateLoading] = React.useState(false)
  const [isQueryLoading, setIsQueryLoading] = React.useState(true)

  const [isDirty, setIsDirty] = React.useState(false)
  const [error, setError] = React.useState<null | Error>(null)

  // This hook work as init value
  // from Remote server
  // when variables.where.id is not provide
  // This hook will be skip because Store will
  // work as Create new recoard store
  React.useEffect(
    () => {
      if (!query.variables.where.id) {
        setTimeout(() => {
          setIsQueryLoading(false)
        }, 500)
        return
      }
      const s = query.subscribe(({ data, loading, errors }) => {
        if (errors) {
          setError(errors[0])
        } else {
          setIsDirty(false)
          setState(Object.assign({}, state, data[dataKey]))
        }

        setTimeout(() => {
          setIsQueryLoading(loading)
        }, 500)
      })
      return () => {
        s.unsubscribe()
      }
    },
    [query.variables]
  )

  return {
    state,
    isQueryLoading,
    isMutateLoading,
    isDirty,
    error,
    onChangeHandler: (kind: FormMeta["kind"], key: string) => (
      value: string | boolean | number
    ) => {
      setIsDirty(true)

      switch (kind) {
        case "FormTextInputFieldMeta":
          break
      }
      setState(Object.assign(state, { [key]: value }))
    },

    onSubmit: async () => {
      // Doing upsert document to server
      setError(null)

      // before confirm data to graphql server
      // validate each attribute in payload first
      // by using formMeta
      let err: Error | null = null
      options.formMetas.forEach(formMeta => {
        const fieldName = formMeta.label || formMeta.key
        if (formMeta.isNonNull) {
          // check if value provide by each kind
          // of input form type
          const NonNullError = new Error(`Field <b>${fieldName}</b> is required`)
          switch (formMeta.kind) {
            case "FormTextInputFieldMeta": {
              if (typeof state[formMeta.key] === "undefined") {
                err = NonNullError
              } else if (
                state[formMeta.key] &&
                state[formMeta.key].length <= 0
              ) {
                err = NonNullError
              }
              break
            }
            case "FormBooleanInputFieldMeta": {
              if (typeof state[formMeta.key] === "undefined") {
                err = NonNullError
              }
              break
            }
          }
        }
      })

      if (err) {
        setError(err)
        return
      }

      setIsMutateLoading(true)
      try {
        const result = await mutate({
          variables: CreatePrismaMutationVariables(state),
        })

        if (result) {
          const data = result.data.data
          options.onSave(data)
          // upsert item complete,
          // send id to component callback
        }
      } catch (e) {
        const apolloError: ApolloError = e
        if (apolloError.graphQLErrors && apolloError.graphQLErrors.length > 0) {
          setError(apolloError.graphQLErrors[0])
        } else {
          throw new Error(e)
        }
      }
      // throttle feedback from response
      // to make use feel asynchornous
      setTimeout(() => {
        setIsMutateLoading(false)
        setIsDirty(false)
      }, 500)
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
