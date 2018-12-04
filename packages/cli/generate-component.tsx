import {
  IntrospectionQuery,
  parse,
  printSchema,
  buildClientSchema,
} from "graphql"

export function generateFormComponentFromPrismaIntrospection(
  schemaIntrospection: IntrospectionQuery
) {
  const schemaAST = parse(printSchema(buildClientSchema(schemaIntrospection)))


}
