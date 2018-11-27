import {
  IntrospectionQuery,
  ASTNode,
  visit,
  DocumentNode,
  ScalarTypeDefinitionNode,
  EnumTypeDefinitionNode,
  buildClientSchema,
  printSchema,
  parse,
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
        throw new Error(`Cannot find type ${currentTypeName} in schema`)
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
export function parseSDLToFormMeta(
  query: ASTNode,
  schemaIntrospection: IntrospectionQuery
) {
  const result: FormInputFieldMeta[] = []

  const schemaAST = parse(printSchema(buildClientSchema(schemaIntrospection)))

  // find every form in query
  let shouldVisitFieldNode = true
  const currentPath: ASTNode[] = []

  visit(query, {
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
          shouldVisitFieldNode = true
          const meta = findTypeDefinitionInfoFromSchema(schemaAST, currentPath)
          if (meta) {
            result.push(meta)
          }
          return undefined
        } else {
          shouldVisitFieldNode = false
          return false
        }
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
