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
          <th className="text-center">{"Action"}</th>
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

export class GraphQLTableView<TItem, TVariables> extends React.Component<
  IGraphQLTableViewPropTypes<TItem, TVariables>,
  {
    datasource: any[]
    rawDatasource: any[]
    loading?: boolean
  }
> {
  constructor(props) {
    super(props)
    this.state = {
      datasource: [],
      rawDatasource: [],
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
          data[dataKey]
        ),
        rawDatasource: data[dataKey],
        loading,
      })
    })
  }

  public render() {
    return (
      <table className="table-bordered table">
        {this.state.datasource.length > 0 ? (
          <GraphQLTableHeader column={this.state.datasource[0]} />
        ) : null}
        <tbody>
          {this.state.datasource.map((columnData, index) => {
            if (index >= 1) {
              return (
                <tr key={index}>
                  {columnData.map((row, rowIndex) => {
                    return <td className="align-middle" key={rowIndex}>{row.value}</td>
                  })}
                  <td style={{width: 100}} key={`action-${index}`} className="text-center">
                    <button
                      className="btn btn-info my-1 btn-block"
                      onClick={this.handleOnEditClick(index)}
                    >
                      {"แก้ไข"}
                    </button>
                    <button
                      className="btn btn-danger my-1 btn-block"
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
        this.props.onEditClick(this.state.rawDatasource[index])
      }
    }
  }
}
