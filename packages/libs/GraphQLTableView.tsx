import * as React from "react"
import { IntrospectionQuery, DocumentNode } from "graphql"
import ApolloClient from "apollo-client"
import { TableColumnInfo, parseSDLToTableColumnInfos } from "."
import { getDataPath, getDataFromDatasourceItem } from "./genarateTableMetaFromSDL"
import { Pagination } from "./pagination"

const objectPath = require("object-path")
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

export interface TablePagination {
  currentPage: number
  resultPerPage: number
}

export interface IGraphQLTableViewPropTypes<TItem = any, TVariables = any> {
  query: DocumentNode
  variables?: TVariables
  introspection: IntrospectionQuery
  client: ApolloClient<any>
  pagination?: TablePagination
  onPaginationClick?: (item: number) => void
  onEditClick?: (item: TItem) => void
  onDeleteClick?: (item: TItem) => void
}

export class GraphQLTableView<TItem, TVariables> extends React.Component<
  IGraphQLTableViewPropTypes<TItem, TVariables>,
  {
    tableColumnInfo: TableColumnInfo[],
    datasource: any[]
    rawDatasource: any[]
    total?: number
    totalPath?: string
    loading?: boolean
  }
  > {
  constructor(props) {
    super(props)
    this.state = {
      tableColumnInfo: [],
      total: 0,
      totalPath: "",
      datasource: [],
      rawDatasource: [],
      loading: true,
    }
  }
  public componentDidMount() {
    this.fetch()
  }

  public async fetch() {
    const tableInfo = parseSDLToTableColumnInfos(this.props.query, this.props.introspection)
    this.setState({ tableColumnInfo: tableInfo.columnInfos, totalPath: tableInfo.totalPath })

    const dataKey = getDataPath(this.props.query)
    const result = this.props.client.watchQuery({
      query: this.props.query,
      variables: this.props.variables,
    })

    result.subscribe(({ data, loading }) => {
      if (!data[dataKey]) {
        console.warn(dataKey, "not found in result data", data)
      }

      this.setState({
        datasource: getDataFromDatasourceItem(
          data[dataKey],
          this.state.tableColumnInfo
        ),
        total: this.state.totalPath ? objectPath(data, this.state.totalPath) : 0,
        rawDatasource: data[dataKey],
        loading,
      })
    })
  }

  public render() {
    return (
      <div>
        <table className="table-bordered table">
          {this.state.tableColumnInfo.length > 0 ? (
            <GraphQLTableHeader column={this.state.tableColumnInfo} />
          ) : null}
          <tbody>
            {this.state.datasource.map((columnData, index) => {
              return (
                <tr key={index}>
                  {columnData.map((row, rowIndex) => {
                    return <td className="align-middle" key={rowIndex}>{row.value}</td>
                  })}
                  <td style={{ width: 140 }} key={`action-${index}`} className="text-center">
                    <button
                      className="btn btn-info my-1 mr-1"
                      onClick={this.handleOnEditClick(index)}
                      disabled={this.props.onEditClick ? false : true}
                    >
                      {"แก้ไข"}
                    </button>
                    <button
                      className="btn btn-danger my-1"
                      onClick={this.handleOnDeleteClick(index, false)}
                      disabled={this.props.onDeleteClick ? false : true}
                    >
                      {"ลบ"}
                    </button>
                  </td>
                </tr>
              )
            }
            )}
          </tbody>
        </table>
        {!this.props.pagination && this.state.total === 0 ?
          null :
          <Pagination
            currentPage={this.props.pagination!.currentPage}
            totalPage={this.state.total || 0}
            lastPage={Math.ceil(this.state.total! / this.props.pagination!.resultPerPage)}
            onClick={this.handleOnPaginationClick}
          />}
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
        this.props.onEditClick(this.state.rawDatasource[index])
      }
    }
  }

  private handleOnPaginationClick(index: number) {
    return (e: any) => {
      if (this.props.onPaginationClick) {
        this.props.onPaginationClick(index)
      }
    }
  }
}
