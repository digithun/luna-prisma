
import { ASTNode, visit, IntrospectionQuery, buildClientSchema, printSchema, parse, FieldDefinitionNode, DocumentNode, SelectionSetNode, ArgumentNode } from "graphql"
const objectPath = require("object-path")
interface TableCommonColumnInfo {
    key: string
    label: string
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

export function parseSDLToTableColumnInfos(
    query: ASTNode,
    schemaIntrospection: IntrospectionQuery,
    datasource: any[]
): any[] {
    const columnInfos = getTableHeaderColumnInfo(query, schemaIntrospection)

    if (datasource === undefined) {
        return [columnInfos]
    }
    const tempData = getDataFromDatasourceItem(datasource, columnInfos)

    return [columnInfos, ...tempData]
}

export function getTableHeaderColumnInfo(
    query: ASTNode,
    schemaIntrospection: IntrospectionQuery
): TableColumnInfo[] {
    let columnInfos: TableColumnInfo[] = []
    const clientSchemaAST = parse(
        printSchema(buildClientSchema(schemaIntrospection))
    )
    visit(query, {
        OperationDefinition(node) {
            if (node.operation === "query") {
                columnInfos = getColumnInfo(
                    "query",
                    node.selectionSet,
                    [],
                    clientSchemaAST
                )
            }
        },
    })
    return columnInfos
}

function getColumnInfo(
    path: string,
    sectionNode: SelectionSetNode,
    fieldDefinition: FieldDefinitionNode[],
    schemaAST: DocumentNode
): TableColumnInfo[] {
    let result: TableColumnInfo[] = []

    sectionNode.selections.map((section) => {
        if (section.kind === "Field") {
            if (section.directives) {
                section.directives.map((directive) => {
                    if (directive.arguments) {
                        const label = getArgumentFromDerective(directive.arguments, "label")
                        const desacrption = getArgumentFromDerective(directive.arguments, "desacrption")
                        if (label.length > 0) {
                            const data = getNameTypeValue(
                                path,
                                section.name.value,
                                label,
                                desacrption,
                                fieldDefinition,
                                schemaAST)

                            if (data != undefined) {
                                result.push(data)
                            }
                        }
                    }
                })
            }
            if (section.selectionSet) {
                const tempFieldDefination
                    = getFieldDefinitionSchemaIntrospection(section.name.value, schemaAST)
                if (tempFieldDefination != null && tempFieldDefination.length > 0) {
                    const tempObjectTypeDefination
                        = getObjectTypeDefinitionSchemaIntrospection(tempFieldDefination, schemaAST)
                    result = [
                        ...result,
                        ...getColumnInfo(
                            path != null ? path + "." + section.name.value : section.name.value,
                            section.selectionSet,
                            tempObjectTypeDefination,
                            schemaAST)
                    ]
                } else {
                    throw new Error(`Introspection Query Type not found`)
                }
            }
        }
    })

    return result
}

function getArgumentFromDerective(args: ReadonlyArray<ArgumentNode>, key: string): string {
    let result: string = ""
    args.map((argument) => {
        if (argument.value.kind === "StringValue") {
            if (argument.name.value.indexOf(key) != null && argument.name.value.length === key.length) {
                result = argument.value.value
            }
        }
    })
    return result
}
function getFieldDefinitionSchemaIntrospection(
    nameSearch: string,
    schemaAST: DocumentNode
): string {
    let result: string = ""
    visit(schemaAST, {
        FieldDefinition(node) {
            if (node.name.value === nameSearch) {
                const nameType = node.type.kind === "NonNullType" ? node.type.type : node.type
                if (nameType.kind === "NamedType") {
                    result = nameType.name.value
                }
                else if (nameType.kind === "ListType") {
                    const listType = nameType.type
                    if (listType.kind === "NamedType") {
                        result = listType.name.value
                    }
                }
            }
        },
    })
    return result
}

function getObjectTypeDefinitionSchemaIntrospection(
    nameSearch: string,
    schemaAST: DocumentNode
): FieldDefinitionNode[] {
    let result: FieldDefinitionNode[] = []
    visit(schemaAST, {
        ObjectTypeDefinition(node) {
            if (node.name.value === nameSearch) {
                result = node.fields as FieldDefinitionNode[]
            }
        },
    })
    return result
}

function getNameTypeValue(
    path: string,
    nameSearch: string,
    label: string,
    desacrption: string,
    fieldDefinition: FieldDefinitionNode[],
    schemaAST: DocumentNode
): TableColumnInfo | undefined {
    let result: TableColumnInfo | undefined
    fieldDefinition.map(m => {
        visit(m, {
            FieldDefinition(node) {
                if (m.name.kind === "Name" && m.name.value === nameSearch) {
                    const nameType =
                        node.type.kind === "NonNullType" ? node.type.type : node.type
                    if (nameType.kind === "NamedType") {
                        const name = nameType.name
                        if (name.kind === "Name") {
                            if (name.value === "String" || name.value === "ID") {
                                result = {
                                    path: path + "." + nameSearch,
                                    kind: "TableStringColumnInfo",
                                    key: nameSearch,
                                    label,
                                }
                            } else if (name.value === "Boolean") {
                                result = {
                                    path: path + "." + nameSearch,
                                    kind: "TableBooleanColumnInfo",
                                    key: nameSearch,
                                    label,
                                }
                            } else if (name.value === "Date") {
                                result = {
                                    path: path + "." + nameSearch,
                                    kind: "TableDateColumnInfo",
                                    key: nameSearch,
                                    label: label,
                                    desacrption: desacrption
                                }
                            } else if (name.value.indexOf("Enum") != null) {
                                result = {
                                    path: path + "." + nameSearch,
                                    kind: "TableEnumColumnInfo",
                                    key: nameSearch,
                                    label,
                                    enumValues: getEnumColumnInfoValue(name.value, schemaAST),
                                }
                            }
                        }
                    }
                }
            },
        })
    })

    return result
}

function getEnumColumnInfoValue(
    nameSearch: string,
    schemaAST: DocumentNode
): string[] {
    const enumValues: string[] = []
    visit(schemaAST, {
        EnumTypeDefinition(node) {
            if (node.name.value === nameSearch && node.values) {
                node.values.map(value => {
                    if (value.name != null) {
                        enumValues.push(value.name.value)
                    }
                })
            }
        },
    })
    return enumValues
}

export function getDataFromDatasourceItem(
    datasource: any[],
    columns: TableColumnInfo[]
): Array<Array<{ path: string; value: string }>> {
    return datasource.map(data => {
        return columns.reduce<Array<{ path: string; value: string }>>(
            (fieldDataList, column) => {
                if (
                    column.kind === "TableStringColumnInfo" ||
                    column.kind === "TableBooleanColumnInfo" ||
                    column.kind === "TableEnumColumnInfo"
                ) {
                    const value = objectPath.get(data, getDatasourceItemPath(column.path))
                    if (value === undefined) {
                        throw new Error(`${column.path} Invalid Filed.`)
                    }
                    if (column.kind === "TableBooleanColumnInfo") {
                        fieldDataList.push({
                            path: column.path,
                            value, // ? "true" : "false",
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

function getDatasourceItemPath(path: string) {
    return path
        .split(".")
        .filter((_, i) => i > 1)
        .join(".")
}

export function getTablePath(query: ASTNode): string {
    let result
    visit(query, {
        OperationDefinition(node) {
            if (node.operation === "query") {
                node.selectionSet.selections.map(selection => {
                    if (selection.kind === "Field") {
                        result = selection.name.value
                    }
                })
            }
        },
    })
    if (result === null) {
        throw new Error("table node not found")
    }
    return result
}
