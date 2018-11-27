export const typeDefs = /* GraphQL */ `type AggregateTodo {
  count: Int!
}

type AggregateTodoList {
  count: Int!
}

type BatchPayload {
  count: Long!
}

enum ColorEnum {
  RED
  BLUE
  GREEN
}

scalar Long

type Mutation {
  createTodo(data: TodoCreateInput!): Todo!
  updateTodo(data: TodoUpdateInput!, where: TodoWhereUniqueInput!): Todo
  updateManyTodoes(data: TodoUpdateManyMutationInput!, where: TodoWhereInput): BatchPayload!
  upsertTodo(where: TodoWhereUniqueInput!, create: TodoCreateInput!, update: TodoUpdateInput!): Todo!
  deleteTodo(where: TodoWhereUniqueInput!): Todo
  deleteManyTodoes(where: TodoWhereInput): BatchPayload!
  createTodoList(data: TodoListCreateInput!): TodoList!
  updateTodoList(data: TodoListUpdateInput!, where: TodoListWhereUniqueInput!): TodoList
  updateManyTodoLists(data: TodoListUpdateManyMutationInput!, where: TodoListWhereInput): BatchPayload!
  upsertTodoList(where: TodoListWhereUniqueInput!, create: TodoListCreateInput!, update: TodoListUpdateInput!): TodoList!
  deleteTodoList(where: TodoListWhereUniqueInput!): TodoList
  deleteManyTodoLists(where: TodoListWhereInput): BatchPayload!
}

enum MutationType {
  CREATED
  UPDATED
  DELETED
}

interface Node {
  id: ID!
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}

type Query {
  todo(where: TodoWhereUniqueInput!): Todo
  todoes(where: TodoWhereInput, orderBy: TodoOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): [Todo]!
  todoesConnection(where: TodoWhereInput, orderBy: TodoOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): TodoConnection!
  todoList(where: TodoListWhereUniqueInput!): TodoList
  todoLists(where: TodoListWhereInput, orderBy: TodoListOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): [TodoList]!
  todoListsConnection(where: TodoListWhereInput, orderBy: TodoListOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): TodoListConnection!
  node(id: ID!): Node
}

type Subscription {
  todo(where: TodoSubscriptionWhereInput): TodoSubscriptionPayload
  todoList(where: TodoListSubscriptionWhereInput): TodoListSubscriptionPayload
}

type Todo {
  id: ID!
  name: String!
  description: String
  state: Boolean
  color: ColorEnum
}

type TodoConnection {
  pageInfo: PageInfo!
  edges: [TodoEdge]!
  aggregate: AggregateTodo!
}

input TodoCreateInput {
  name: String!
  description: String
  state: Boolean
  color: ColorEnum
}

input TodoCreateManyInput {
  create: [TodoCreateInput!]
  connect: [TodoWhereUniqueInput!]
}

type TodoEdge {
  node: Todo!
  cursor: String!
}

type TodoList {
  id: ID!
  name: String!
  todos(where: TodoWhereInput, orderBy: TodoOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): [Todo!]
}

type TodoListConnection {
  pageInfo: PageInfo!
  edges: [TodoListEdge]!
  aggregate: AggregateTodoList!
}

input TodoListCreateInput {
  name: String!
  todos: TodoCreateManyInput
}

type TodoListEdge {
  node: TodoList!
  cursor: String!
}

enum TodoListOrderByInput {
  id_ASC
  id_DESC
  name_ASC
  name_DESC
  createdAt_ASC
  createdAt_DESC
  updatedAt_ASC
  updatedAt_DESC
}

type TodoListPreviousValues {
  id: ID!
  name: String!
}

type TodoListSubscriptionPayload {
  mutation: MutationType!
  node: TodoList
  updatedFields: [String!]
  previousValues: TodoListPreviousValues
}

input TodoListSubscriptionWhereInput {
  mutation_in: [MutationType!]
  updatedFields_contains: String
  updatedFields_contains_every: [String!]
  updatedFields_contains_some: [String!]
  node: TodoListWhereInput
  AND: [TodoListSubscriptionWhereInput!]
  OR: [TodoListSubscriptionWhereInput!]
  NOT: [TodoListSubscriptionWhereInput!]
}

input TodoListUpdateInput {
  name: String
  todos: TodoUpdateManyInput
}

input TodoListUpdateManyMutationInput {
  name: String
}

input TodoListWhereInput {
  id: ID
  id_not: ID
  id_in: [ID!]
  id_not_in: [ID!]
  id_lt: ID
  id_lte: ID
  id_gt: ID
  id_gte: ID
  id_contains: ID
  id_not_contains: ID
  id_starts_with: ID
  id_not_starts_with: ID
  id_ends_with: ID
  id_not_ends_with: ID
  name: String
  name_not: String
  name_in: [String!]
  name_not_in: [String!]
  name_lt: String
  name_lte: String
  name_gt: String
  name_gte: String
  name_contains: String
  name_not_contains: String
  name_starts_with: String
  name_not_starts_with: String
  name_ends_with: String
  name_not_ends_with: String
  todos_every: TodoWhereInput
  todos_some: TodoWhereInput
  todos_none: TodoWhereInput
  AND: [TodoListWhereInput!]
  OR: [TodoListWhereInput!]
  NOT: [TodoListWhereInput!]
}

input TodoListWhereUniqueInput {
  id: ID
}

enum TodoOrderByInput {
  id_ASC
  id_DESC
  name_ASC
  name_DESC
  description_ASC
  description_DESC
  state_ASC
  state_DESC
  color_ASC
  color_DESC
  createdAt_ASC
  createdAt_DESC
  updatedAt_ASC
  updatedAt_DESC
}

type TodoPreviousValues {
  id: ID!
  name: String!
  description: String
  state: Boolean
  color: ColorEnum
}

type TodoSubscriptionPayload {
  mutation: MutationType!
  node: Todo
  updatedFields: [String!]
  previousValues: TodoPreviousValues
}

input TodoSubscriptionWhereInput {
  mutation_in: [MutationType!]
  updatedFields_contains: String
  updatedFields_contains_every: [String!]
  updatedFields_contains_some: [String!]
  node: TodoWhereInput
  AND: [TodoSubscriptionWhereInput!]
  OR: [TodoSubscriptionWhereInput!]
  NOT: [TodoSubscriptionWhereInput!]
}

input TodoUpdateDataInput {
  name: String
  description: String
  state: Boolean
  color: ColorEnum
}

input TodoUpdateInput {
  name: String
  description: String
  state: Boolean
  color: ColorEnum
}

input TodoUpdateManyInput {
  create: [TodoCreateInput!]
  update: [TodoUpdateWithWhereUniqueNestedInput!]
  upsert: [TodoUpsertWithWhereUniqueNestedInput!]
  delete: [TodoWhereUniqueInput!]
  connect: [TodoWhereUniqueInput!]
  disconnect: [TodoWhereUniqueInput!]
}

input TodoUpdateManyMutationInput {
  name: String
  description: String
  state: Boolean
  color: ColorEnum
}

input TodoUpdateWithWhereUniqueNestedInput {
  where: TodoWhereUniqueInput!
  data: TodoUpdateDataInput!
}

input TodoUpsertWithWhereUniqueNestedInput {
  where: TodoWhereUniqueInput!
  update: TodoUpdateDataInput!
  create: TodoCreateInput!
}

input TodoWhereInput {
  id: ID
  id_not: ID
  id_in: [ID!]
  id_not_in: [ID!]
  id_lt: ID
  id_lte: ID
  id_gt: ID
  id_gte: ID
  id_contains: ID
  id_not_contains: ID
  id_starts_with: ID
  id_not_starts_with: ID
  id_ends_with: ID
  id_not_ends_with: ID
  name: String
  name_not: String
  name_in: [String!]
  name_not_in: [String!]
  name_lt: String
  name_lte: String
  name_gt: String
  name_gte: String
  name_contains: String
  name_not_contains: String
  name_starts_with: String
  name_not_starts_with: String
  name_ends_with: String
  name_not_ends_with: String
  description: String
  description_not: String
  description_in: [String!]
  description_not_in: [String!]
  description_lt: String
  description_lte: String
  description_gt: String
  description_gte: String
  description_contains: String
  description_not_contains: String
  description_starts_with: String
  description_not_starts_with: String
  description_ends_with: String
  description_not_ends_with: String
  state: Boolean
  state_not: Boolean
  color: ColorEnum
  color_not: ColorEnum
  color_in: [ColorEnum!]
  color_not_in: [ColorEnum!]
  AND: [TodoWhereInput!]
  OR: [TodoWhereInput!]
  NOT: [TodoWhereInput!]
}

input TodoWhereUniqueInput {
  id: ID
}
`