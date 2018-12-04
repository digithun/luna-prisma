import * as React from "react"
import { GraphQLStoreConsumer } from "./StoreContext"
import { FormMeta } from "../generateFormMetaFromSDL"
import classNames from "classnames"

export interface FormInputFieldMetaPropTypes {
  meta: FormMeta
}
export const BooleanInputField: React.SFC<
  FormInputFieldMetaPropTypes
> = props => {
  return (
    <GraphQLStoreConsumer>
      {store => {
        function onChange(e: React.ChangeEvent<HTMLInputElement>) {
          const handler = store.onChangeHandler(props.meta.kind, props.meta.key)
          if (e.target.value === "yes") {
            handler(true)
          } else {
            handler(false)
          }
        }
        const booleanValue = store.state[props.meta.key]
        return (
          <div className="toggle-btn-container">
            <div className="btn-group btn-group-toggle">
              <label
                className={classNames("btn", "btn-secondary", {
                  active: booleanValue,
                })}
              >
                <input
                  type="radio"
                  onChange={onChange}
                  className="form-control"
                  checked={!!booleanValue}
                  value="yes"
                  autoComplete={"off"}
                />
                {"Yes"}
              </label>

              <label
                className={classNames("btn", "btn-secondary", {
                  active: !booleanValue,
                })}
              >
                <input
                  autoComplete={"off"}
                  type="radio"
                  onChange={onChange}
                  checked={!booleanValue}
                  value="no"
                />
                {"No"}
              </label>
            </div>
          </div>
        )
      }}
    </GraphQLStoreConsumer>
  )
}
