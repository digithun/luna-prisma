import {
  IntrospectionQuery,
  ASTNode,
  DocumentNode,
  ScalarTypeDefinitionNode,
  EnumTypeDefinitionNode,
  buildClientSchema,
  printSchema,
  visit,
  parse,
  FragmentDefinitionNode,
  FieldNode,
  BREAK,
  DirectiveNode,
} from "graphql"

interface FormInputFieldMeta {
  isNonNull: boolean
  key: string
  path: string
  typeName: string
  isEditable: boolean
}

interface FormDateInputFieldMeta extends FormInputFieldMeta {
  kind: "FormDateInputFieldMeta"
  label?: string
}

interface FormIDInputFieldMeta extends FormInputFieldMeta {
  kind: "FormIDInputFieldMeta"
  label?: string
}

interface FormBooleanInputFieldMeta extends FormInputFieldMeta {
  kind: "FormBooleanInputFieldMeta"
  label?: string
}

interface FormTextInputFieldMeta extends FormInputFieldMeta {
  kind: "FormTextInputFieldMeta"
  label?: string
}

interface FormEnumInputFieldMeta extends FormInputFieldMeta {
  kind: "FormEnumInputFieldMeta"
  options: string[]
  label?: string
}

const FormDirectiveName = "form"
const InputDirectiveName = "input"

export type FormMeta =
  | FormEnumInputFieldMeta
  | FormTextInputFieldMeta
  | FormIDInputFieldMeta
  | FormDateInputFieldMeta
  | FormBooleanInputFieldMeta

export function findTypeDefinitionInfoFromSchema(
  schema: DocumentNode,
  path: ASTNode[]
): FormMeta | undefined {
  let currentTypeName: string | null = null
  let isNonNull = false
  let isEditable = true

  const _path = path.map(p => p)

  // @ts-ignore
  const pathname = _path
    // @ts-ignore
    .filter(n => n.name || n.operation)
    .map(n => {
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
      InputValueDefinition: () => false,
      NamedType: n => {
        currentTypeName = n.name.value
      },
      NonNullType: () => {
        isNonNull = true
      },
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
      isEditable = false
    case "String":
      return {
        isNonNull,
        isEditable,
        key,
        kind: "FormTextInputFieldMeta",
        path: pathname,
        typeName: currentTypeName,
      }
    case "Boolean":
      return {
        isNonNull,
        isEditable,
        key,
        kind: "FormBooleanInputFieldMeta",
        path: pathname,
        typeName: currentTypeName,
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
          kind: "FormEnumInputFieldMeta",
          key,
          isEditable,
          path: pathname,
          typeName: currentTypeName,
          isNonNull,
          options: abstractType.values
            ? abstractType.values.map(v => v.name.value)
            : [],
        }
      } else {
        // Any scalar type that unknown
        // will support as Textinput form data
        return {
          isNonNull,
          key,
          isEditable,
          kind: "FormTextInputFieldMeta",
          path: pathname,
          typeName: currentTypeName,
        }
      }
    }
  }
}

export function getDirectiveArgs(directive: DirectiveNode) {
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

export function getFormLabel(query: ASTNode) {
  let label = ""
  visit(query, {
    Directive: node => {
      if (node.name.value === FormDirectiveName) {
        const args = getDirectiveArgs(node)
        label = args.label
        return BREAK
      }
    },
  })

  return label
}

export function getFormDataFieldKey(query: ASTNode): FieldNode | null {
  const key: string | undefined = undefined
  let fieldNode: FieldNode

  visit(query, {
    Directive: {
      enter: node => {
        if (node.name.value === FormDirectiveName) {
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

  // @ts-ignore
  return fieldNode
}
export function parseSDLToFormMeta(
  query: ASTNode,
  schemaIntrospection: IntrospectionQuery
) {
  const result: FormMeta[] = []

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
        if (node.name.value === FormDirectiveName) {
          shouldVisitFieldNode = true
          return undefined
        } else if (node.name.value === InputDirectiveName) {
          // process each selection field
          const meta = findTypeDefinitionInfoFromSchema(schemaAST, currentPath)
          // after meta from
          // remote schema already extract
          // check if meta is avaliable
          // and then get label from directive args
          if (meta) {
            const args = getDirectiveArgs(node)
            meta.label = args.label
            result.push(meta)
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
                directiveNode.name.value === InputDirectiveName
              ) {
                console.log("nested", directiveNode.name.value)
                const meta = findTypeDefinitionInfoFromSchema(
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

  return result
}
