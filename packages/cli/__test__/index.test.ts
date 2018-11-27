import * as path from "path"
import { getUserDefineTypeListFromPrismaSchema } from ".."
import { typeDefs } from "./prisma-schema"

it("should get User define type name from prisma schema", () => {
  const result = getUserDefineTypeListFromPrismaSchema(typeDefs)

  expect(result).toEqual(["Todo", "TodoList"])
})
