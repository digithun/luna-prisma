import * as React from "react"
import { FormInputFieldMetaPropTypes } from "./TextInput"
import { GraphQLStoreConsumer } from "./StoreContext"

const SELECTED_NULL_VALUE = "NULL"
export const EnumInputField: React.SFC<FormInputFieldMetaPropTypes> = props => {
  return (
    <GraphQLStoreConsumer>
      {store => {
        if (props.meta.kind !== "FormEnumInputFieldMeta") {
          throw new Error("Field meta for Enum input field is not correct")
        }

        function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
          if (e.target.value === SELECTED_NULL_VALUE) {
            // this condition is unreachable by design
            // if user able to select this choices
            // nothing gonna happen
          } else {
            store.onChangeHandler(props.meta.kind, props.meta.key)(
              e.target.value
            )
          }
        }
        return (
          <select
            className="form-control"
            value={store.state[props.meta.key] || SELECTED_NULL_VALUE}
            onChange={onChange}
          >
            <option disabled value={SELECTED_NULL_VALUE}>
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
