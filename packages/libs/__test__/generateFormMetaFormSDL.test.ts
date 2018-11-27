import {
  parseSDLToFormMeta,
  findTypeDefinitionInfoFromSchema,
} from "../generateFormMetaFromSDL"
import gql from "graphql-tag"
import { buildClientSchema, printSchema, parse } from "graphql"

const schema = require("./luna-schema")

it("should create FormMeta correctly", () => {
  expect(
    parseSDLToFormMeta(
      gql`
        query($where: TodoWhereUniqueInput!) {
          todo(where: $where) @form {
            id @input(label: "ID")
            name @input
            color @input(label: "Colour")
          }
          t: todo(where: $where) {
            id
            name
          }
        }
      `,
      schema
    )
  ).toMatchSnapshot()
})

it("should findTypeDefinitionFromPath correctly", () => {
  const schemaAST = parse(printSchema(buildClientSchema(schema)))
  expect(
    findTypeDefinitionInfoFromSchema(schemaAST, [
      {
        kind: "OperationDefinition",
        operation: "query",
      },
      {
        kind: "Field",
        name: { value: "todo" },
      },
      {
        kind: "Field",
        name: { value: "name" },
      },
    ] as any)
  ).toEqual({
    isEditable: true,
    isNonNull: true,
    kind: "FormTextInputFieldMeta",
    path: "query.todo.name",
    key: "name",
    typeName: "String",
  })

  expect(
    findTypeDefinitionInfoFromSchema(schemaAST, [
      {
        kind: "OperationDefinition",
        operation: "query",
      },
      {
        kind: "Field",
        name: { value: "todo" },
      },
      {
        kind: "Field",
        name: { value: "color" },
      },
    ] as any)
  ).toEqual({
    isEditable: true,
    isNonNull: false,
    kind: "FormEnumInputFieldMeta",
    key: "color",
    path: "query.todo.color",
    options: ["RED", "BLUE", "GREEN"],
    typeName: "ColorEnum",
  })

  expect(
    findTypeDefinitionInfoFromSchema(schemaAST, [
      {
        kind: "OperationDefinition",
        operation: "query",
      },
      {
        kind: "Field",
        name: { value: "todo" },
      },
      {
        kind: "Field",
        name: { value: "color" },
      },
    ] as any)
  ).toEqual({
    isEditable: true,
    isNonNull: false,
    kind: "FormEnumInputFieldMeta",
    key: "color",
    path: "query.todo.color",
    options: ["RED", "BLUE", "GREEN"],
    typeName: "ColorEnum",
  })
})
