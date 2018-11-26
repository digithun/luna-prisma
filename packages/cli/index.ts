import * as fs from "fs"
import * as path from "path"
import { parse, visit } from "graphql"
interface CLIArgs {
  schema: string
  output: string
}

export function getUserDefineTypeListFromPrismaSchema(typeDef: string) {
  const astNode = parse(typeDef)
  const ignoreEndedPrefix = [
    "BatchPayload",
    "Mutation",
    "Query",
    "Node",
    "PageInfo",
    "Connection",
    "CreateInput",
    "CreateManyInput",
    "Edge",
    "OrderByInput",
    "PreviousValues",
    "SubscriptionPayload",
  ]
  const ignoreStartedPrefix = [
    "AggregateTodo",
    "AggregateTodoList",
    "Subscription",
  ]
  const result: string[] = []
  visit(astNode, {
    ObjectTypeDefinition: {
      enter: (node, key, parent, pathToType, ancestors) => {
        // Prisma type end prefix
        const ignoreEndedRegex = new RegExp(`(${ignoreEndedPrefix.join("|")})$`)
        const ignoreStartedRegex = new RegExp(`^(${ignoreStartedPrefix.join("|")})`)
        if (!ignoreEndedRegex.test(node.name.value) && !ignoreStartedRegex.test(node.name.value)) {
          result.push(node.name.value)
        }
      },
    },
  })

  return result
}

export function run() {
  const argv = require("minimist")(process.argv.slice(2))
  if (!argv.schema) {
    return
  }

  const args: CLIArgs = {
    schema: argv.schema,
    output: argv._[0],
  }
  const schemaFile = fs.readFileSync(args.schema).toString()
  const types = getUserDefineTypeListFromPrismaSchema(schemaFile)
}
run()
