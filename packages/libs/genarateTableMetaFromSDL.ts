import {
  ASTNode,
  visit,
  IntrospectionQuery,
  buildClientSchema,
  printSchema,
  parse,
  DocumentNode,
  DirectiveNode,
  ScalarTypeDefinitionNode,
  EnumTypeDefinitionNode,
  FragmentDefinitionNode,
  FieldNode,
  BREAK
} from "graphql"

const objectPath = require("object-path")
export interface TableCommonColumnInfo {
  key: string
  label?: string
  path: string
  desacrption?: string
}
interface TableStringColumnInfo extends TableCommonColumnInfo {
  kind: "TableStringColumnInfo"
}
interface TableIntColumnInfo extends TableCommonColumnInfo {
  kind: "TableIntColumnInfo"
  precisionPoint?: number
}
interface TableBooleanColumnInfo extends TableCommonColumnInfo {
  kind: "TableBooleanColumnInfo"
}
interface TableEnumColumnInfo extends TableCommonColumnInfo {
  kind: "TableEnumColumnInfo"
  enumValues: string[]
}
interface TableDateColumnInfo extends TableCommonColumnInfo {
  kind: "TableDateColumnInfo"

}

export type TableColumnInfo =
  TableStringColumnInfo |
  TableIntColumnInfo |
  TableBooleanColumnInfo |
  TableEnumColumnInfo |
  TableDateColumnInfo

export interface TablePaginationInfo {
  path: string
  total: number
}

export function getDataPath(query: ASTNode): string {
  let result
  let fieldNode: FieldNode | undefined

  visit(query, {
    Directive: {
      enter: node => {
        if (node.name.value === "table") {
          return BREAK
        }
      },
    },
    Field: {
      enter: node => {
        fieldNode = node
      },
    },
  })

  if (fieldNode) {
    if (fieldNode.alias) {
      result = fieldNode.alias.value
    } else {
      result = fieldNode.name.value
    }
  }
  if (result === null) {
    throw new Error("table node not found")
  }
  return result
}

export function parseSDLToTableColumnInfos(
  query: ASTNode,
  schemaIntrospection: IntrospectionQuery
) {
  const result: TableColumnInfo[] = []
  let totalPath = ""
  const schemaAST = parse(printSchema(buildClientSchema(schemaIntrospection)))

  // find every form in query
  let shouldVisitFieldNode = true
  const currentPath: ASTNode[] = []

  visit(query, {
    FragmentDefinition: {
      enter: () => false,
    },
    OperationDefinition: {
      enter: node => {
        currentPath.push(node)
      },
      leave: node => {
        currentPath.pop()
      },
    },
    Directive: {
      enter: (node, parent) => {
        if (node.name.value === "table" || node.name.value === "pagination") {
          shouldVisitFieldNode = true
          return undefined
        } else if (node.name.value === "column") {
          const meta = getTypeDefinitionInfoFromSchema(schemaAST, currentPath)
          if (meta) {
            const args = getArgsFromDirective(node)
            meta.label = args.label
            if (args.desacrption) {
              meta.desacrption = args.desacrption
            }
            result.push(meta)
          }
          return undefined
        } else if (node.name.value === "total") {
          const meta = getTypeDefinitionInfoFromSchema(schemaAST, currentPath)
          if (meta) {
            totalPath = meta.path
          }
          return undefined
        } else {
          shouldVisitFieldNode = false
          return false
        }
      },
    },
    FragmentSpread: {
      enter: fragmentSpreadNode => {
        // ถ้ามี fragment spread ให้เอา Field ด้านในทั้งหมด
        // ของ Fragment spread มา push กลับไปใส่ path
        // เพื่อทำให้ผลลัพธ์ออกมาเหมือนเดิม
        const fragmentName = fragmentSpreadNode.name.value
        let currentFragmentDefinitionNode: FragmentDefinitionNode | null = null
        let currentField: FieldNode | null = null
        // หา Fragment Definition ก่อน
        visit(query, {
          FragmentDefinition: {
            enter: fragmentDefinitionNode => {
              if (fragmentDefinitionNode.name.value === fragmentName) {
                currentFragmentDefinitionNode = fragmentDefinitionNode
                return undefined
              } else {
                return false
              }
            },
            leave: fragmentDefinitionNode => {
              currentFragmentDefinitionNode = null
            },
          },
          Field: {
            enter: fieldNode => {
              if (currentFragmentDefinitionNode) {
                currentField = fieldNode
                currentPath.push(fieldNode)
              }
            },
            leave: fieldNode => {
              currentField = null
              if (currentFragmentDefinitionNode) {
                currentPath.pop()
              }
            },
          },
          Directive: {
            enter: directiveNode => {
              if (
                currentFragmentDefinitionNode &&
                currentField &&
                directiveNode.name.value === "column"
              ) {
                const meta = getTypeDefinitionInfoFromSchema(
                  schemaAST,
                  currentPath
                )
                if (meta) {
                  result.push(meta)
                }
              }
            },
          },
        })
      },
    },
    Field: {
      enter: node => {
        if (shouldVisitFieldNode) {
          currentPath.push(node)
        } else {
          return false
        }
      },
      leave: () => {
        shouldVisitFieldNode = true
        currentPath.pop()
      },
    },
  })

  return { columnInfos: result, totalPath }
}

export function getArgsFromDirective(directive: DirectiveNode) {
  const result: { [key: string]: any } = {}
  visit(directive, {
    Argument: argumentNode => {
      if (argumentNode.value && argumentNode.value.kind === "StringValue") {
        result[argumentNode.name.value] = argumentNode.value.value
      }
    },
  })
  return result
}

export function getTypeDefinitionInfoFromSchema(
  schema: DocumentNode,
  path: ASTNode[]
): TableColumnInfo | undefined {
  let currentTypeName: string | null = null

  const _path = path.map(p => p)
  // @ts-ignore
  const pathname = _path
    // @ts-ignore
    .filter(n => n.alias || n.name || n.operation)
    .map(n => {
      // @ts-ignore
      if (n.alias) {
        // @ts-ignore
        return n.alias.value
      }
      // @ts-ignore
      return n.operation || n.name.value
    })
    .join(".")

  let key: string = ""

  let focusObjectDefinition = schema.definitions.find(
    n => n.kind === "ObjectTypeDefinition" && n.name.value === "Query"
  )

  _path.shift()

  while (_path.length) {
    if (!focusObjectDefinition) {
      throw new Error("Query type not found")
    }
    // @ts-ignore
    key = _path[0].name.value
    visit(focusObjectDefinition, {
      FieldDefinition: {
        enter: n => {
          if (n.name.value === key) {
            return undefined
          } else {
            return false
          }
        },
      },
      NamedType: n => {
        currentTypeName = n.name.value
      }
    })
    focusObjectDefinition = schema.definitions.find(
      n => n.kind === "ObjectTypeDefinition" && n.name.value === currentTypeName
    )

    _path.shift()
  }
  if (!currentTypeName) {
    throw new Error(`Cannot resolve typename ${pathname} from ${pathname}`)
  }

  // Process result from type
  // and return FieldMeta
  switch (currentTypeName) {
    case "ID":
      return {
        path: pathname,
        kind: "TableStringColumnInfo",
        key,
      }
    case "String":
      return {
        path: pathname,
        kind: "TableStringColumnInfo",
        key,
      }
    case "Boolean":
      return {
        key,
        kind: "TableBooleanColumnInfo",
        path: pathname,
      }
    case "Int":
      return {
        key,
        kind: "TableIntColumnInfo",
        path: pathname,
      }
    case "Date":
      return {
        path: pathname,
        kind: "TableDateColumnInfo",
        key
      }
    default: {
      // find enum, scalar type if currentTypeName
      // is not Primitive data type
      const abstractType = schema.definitions.find(
        (n): n is ScalarTypeDefinitionNode | EnumTypeDefinitionNode =>
          (n.kind === "ScalarTypeDefinition" ||
            n.kind === "EnumTypeDefinition") &&
          n.name.value === currentTypeName
      )
      if (!abstractType) {
        throw new Error(
          `Cannot find type ${currentTypeName} in schema ${pathname}`
        )
      }
      if (abstractType.kind === "EnumTypeDefinition") {
        return {
          path: pathname,
          kind: "TableEnumColumnInfo",
          key,
          enumValues: abstractType.values
            ? abstractType.values.map(v => v.name.value)
            : [],
        }
      } else {
        // Any scalar type that unknown
        // will support as Textinput form data
        return {
          key,
          kind: "TableStringColumnInfo",
          path: pathname
        }
      }
    }
  }
}

export function getDatasourceItemPath(path: string) {
  return path
    .split(".")
    .filter((_, i) => i > 1)
    .join(".")
}

export function getDataFromDatasourceItem(
  datasource: any[],
  columns: TableColumnInfo[]
): Array<Array<{ path: string; value: string }>> {
  if (datasource === undefined || datasource.length === 0) {
    return []
  }
  return datasource.map(data => {
    return columns.reduce<Array<{ path: string; value: string }>>(
      (fieldDataList, column) => {
        if (
          column.kind === "TableStringColumnInfo" ||
          column.kind === "TableBooleanColumnInfo" ||
          column.kind === "TableEnumColumnInfo" ||
          column.kind === "TableDateColumnInfo" ||
          column.kind === "TableIntColumnInfo"
        ) {
          const value = objectPath.get(data, getDatasourceItemPath(column.path))
          if (value === undefined) {
            throw new Error(`${column.path} Invalid Filed.`)
          }
          if (column.kind === "TableBooleanColumnInfo") {
            fieldDataList.push({
              path: column.path,
              value: value ? "true" : "false",
            })
          } else {
            fieldDataList.push({
              path: column.path,
              value,
            })
          }
        }
        return fieldDataList
      },
      []
    )
  })
}
