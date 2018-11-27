import * as React from "react"
import { GraphQLStoreConsumer } from "./StoreContext"
import { FormMeta } from "../generateFormMetaFromSDL"

export interface FormInputFieldMetaPropTypes {
  meta: FormMeta
}
export const TextInputField: React.SFC<FormInputFieldMetaPropTypes> = props => {
  return (
    <GraphQLStoreConsumer>
      {store => {
        function onChange(e: React.ChangeEvent<HTMLInputElement>) {
          store.onChangeHandler(props.meta.kind, props.meta.key)(e.target.value)
        }
        return (
          <input
            value={store.state[props.meta.key] || ""}
            onChange={onChange}
            className="form-control"
            id={props.meta.key}
          />
        )
      }}
    </GraphQLStoreConsumer>
  )
}
