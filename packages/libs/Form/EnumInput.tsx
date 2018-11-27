import * as React from "react"
import { FormInputFieldMetaPropTypes } from "./TextInput"
import { GraphQLStoreConsumer } from "./StoreContext"
export const EnumInputField: React.SFC<FormInputFieldMetaPropTypes> = props => {
  return (
    <GraphQLStoreConsumer>
      {store => {
        if (props.meta.kind !== "FormEnumInputFieldMeta") {
          throw new Error("Field meta for Enum input field is not correct")
        }

        function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
          store.onChangeHandler(props.meta.kind, props.meta.key)(e.target.value)
        }
        return (
          <select value={store.state[props.meta.key]} onChange={onChange}>
            <option disabled value={undefined}>
              {"select"}
            </option>
            {props.meta.options.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        )
      }}
    </GraphQLStoreConsumer>
  )
}
