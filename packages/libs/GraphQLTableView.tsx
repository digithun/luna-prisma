import * as React from "react"
import { IntrospectionQuery, DocumentNode } from "graphql"
import ApolloClient from "apollo-client"
import { TableColumnInfo, parseSDLToTableColumnInfos } from "."
import { getTablePath } from "./genarateTableMetaFromSDL"

type GraphQLTableHeaderProps = {
  column: TableColumnInfo[]
}

class GraphQLTableHeader extends React.Component<GraphQLTableHeaderProps> {
  public render() {
    const { column } = this.props
    return (
      <thead>
        <tr>
          {column.map((row, index) => {
            const rowData = row as TableColumnInfo
            return <th key={index}>{rowData.label}</th>
          })}
          <th>{"Action"}</th>
        </tr>
      </thead>
    )
  }
}

export interface IGraphQLTableViewPropTypes<TItem = any, TVariables = any> {
  query: DocumentNode
  variables?: TVariables
  introspection: IntrospectionQuery
  client: ApolloClient<any>

  onEditClick?: (item: TItem) => void
  onDeleteClick?: (item: TItem) => void
}

export default class GraphQLTableView<
  TItem,
  TVariables
> extends React.Component<
  IGraphQLTableViewPropTypes<TItem, TVariables>,
  {
    datasource: any[],
    loading?: boolean,
  }
> {
  constructor(props) {
    super(props)
    this.state = {
      datasource: [],
      loading: true,
    }
  }
  public componentDidMount() {
    this.fetch()
  }

  public async fetch() {
    const dataKey = getTablePath(this.props.query)
    const result = this.props.client.watchQuery({
      query: this.props.query,
      variables: this.props.variables,
    })

    result.subscribe(({ data, loading }) => {
      if (!data[dataKey]) {
        console.warn(dataKey, "not found in result data", data)
      }

      this.setState({
        datasource: parseSDLToTableColumnInfos(
          this.props.query,
          this.props.introspection,
          data[dataKey],
        ),
        loading,
      })
    })
  }

  public render() {
    return (
      <div>
        <table>
          {this.state.datasource.length > 0 ? (
            <GraphQLTableHeader column={this.state.datasource[0]} />
          ) : null}
          <tbody>
            {this.state.datasource.map((columnData, index) => {
              if (index >= 1) {
                return (
                  <tr key={index}>
                    {columnData.map((row, rowIndex) => {
                      return <td key={rowIndex}>{row.value}</td>
                    })}
                    <td key={`action-${index}`}>
                      <button
                        color="info"
                        onClick={this.handleOnEditClick(index)}
                      >
                        {"แก้ไข"}
                      </button>

                      <button
                        color="danger"
                        onClick={this.handleOnDeleteClick(index, false)}
                      >
                        {"ลบ"}
                      </button>
                    </td>
                  </tr>
                )
              }
            })}
          </tbody>
        </table>
      </div>
    )
  }

  private handleOnDeleteClick(index: number, isConfirm: boolean) {
    return (e: React.SyntheticEvent<HTMLButtonElement>) => {
      if (this.props.onDeleteClick) {
        console.log("confirm delete")
        this.props.onDeleteClick(this.state.datasource[index])
      }
    }
  }

  private handleOnEditClick(index: number) {
    return (e: React.SyntheticEvent<HTMLButtonElement>) => {
      if (this.props.onEditClick) {
        this.props.onEditClick(this.state.datasource[index])
      }
    }
  }
}
