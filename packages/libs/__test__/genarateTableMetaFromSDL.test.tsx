import gql from "graphql-tag"
import {
  parseSDLToTableColumnInfos,
  getDataFromDatasourceItem,
  getDataPath
} from "../genarateTableMetaFromSDL"

describe("genarateFromSDLTest", () => {
  it("should parse column SDL corretly", () => {
    expect(
      parseSDLToTableColumnInfos(
        gql`
          query {
            todoLists {
              id @column(label: "id")
              name @column(label: "Name")
              todoes {
                id
              }
            }
          }
        `,
        require("./luna-schema")
      )
    ).toEqual(
      {
        columnInfos: [
          {
            kind: "TableStringColumnInfo",
            key: "id",
            label: "id",
            path: "query.todoLists.id",
          },
          {
            kind: "TableStringColumnInfo",
            key: "name",
            label: "Name",
            path: "query.todoLists.name",
          },
        ],
        totalPath: ""
      }
    )
  })
  it("should table header corretly", () => {
    expect(
      parseSDLToTableColumnInfos(
        gql`
          query {
            todoLists {
              id @column(label: "id")
              name @column(label: "Name")
              todoes {
                id
              }
            }
          }
        `,
        require("./luna-schema")
      )
    ).toEqual({
      columnInfos: [
        {
          kind: "TableStringColumnInfo",
          key: "id",
          label: "id",
          path: "query.todoLists.id",
        },
        {
          kind: "TableStringColumnInfo",
          key: "name",
          label: "Name",
          path: "query.todoLists.name",
        },
      ],
      totalPath: ""
    })

    // Test Enum and Boolean Type
    expect(
      parseSDLToTableColumnInfos(
        gql`
          query {
            todoes {
              id
              name @column(label: "Name")
              state @column(label: "State")
              color @column(label: "Color")
            }
          }
        `,
        require("./luna-schema")
      )
    ).toEqual({
      columnInfos: [
        {
          kind: "TableStringColumnInfo",
          key: "name",
          label: "Name",
          path: "query.todoes.name",
        },
        {
          kind: "TableBooleanColumnInfo",
          key: "state",
          label: "State",
          path: "query.todoes.state",
        },
        {
          kind: "TableEnumColumnInfo",
          key: "color",
          label: "Color",
          path: "query.todoes.color",
          enumValues: ["RED", "BLUE", "GREEN"],
        },
      ],
      totalPath: ""
    })
  })
  it("should get Data corretly", () => {
    const columnInfos: any = [
      {
        kind: "TableStringColumnInfo",
        key: "name",
        label: "Name",
        path: "query.todos.name",
      },
      {
        kind: "TableBooleanColumnInfo",
        key: "state",
        label: "State",
        path: "query.todos.state",
      },
      {
        kind: "TableEnumColumnInfo",
        key: "color",
        label: "Color",
        path: "query.todos.color",
        enumValues: ["RED", "BLUE", "GREEN"],
      },
    ]

    const result = [
      [
        {
          path: "query.todos.name",
          value: "todo_name_00",
        },
        {
          path: "query.todos.state",
          value: "false",
        },
        {
          path: "query.todos.color",
          value: "RED",
        },
      ],
      [
        {
          path: "query.todos.name",
          value: "todo_name_10",
        },
        {
          path: "query.todos.state",
          value: "false",
        },
        {
          path: "query.todos.color",
          value: "BLUE",
        },
      ],
    ]
    expect(
      getDataFromDatasourceItem(require("./mock-data-todos").todos, columnInfos)
    ).toEqual(result)
  })
  it("should parse column SDL invalid", () => {
    expect(() =>
      parseSDLToTableColumnInfos(
        gql`
          query {
            stodoLists {
              id @column(label: "id")
              name @column(label: "Name")
              todos {
                id
              }
            }
          }
        `,
        require("./luna-schema")
      )
    ).toThrow()

    expect(() =>
      parseSDLToTableColumnInfos(
        gql`
          query {
            todoLists {
              ids @column(label: "id")
              name @column(label: "Name")
              todos {
                id
              }
            }
          }
        `,
        require("./luna-schema")
      )
    ).toThrow()
  })
  it("should table header format invalid", () => {
    const columnInfos: any = [
      {
        kind: "TableStringColumnInfo",
        key: "name",
        label: "Name",
        path: "query.todoLists.todos.name",
      },
      {
        kind: "TableBooleanColumnInfo",
        key: "state",
        label: "State",
        path: "query.todoLists.todos.state",
      },
    ]

    expect(() =>
      getDataFromDatasourceItem(
        require("./mock-data-todoLits").todoLists,
        columnInfos
      )
    ).toThrow()
  })
  it("should parse table path", () => {
    expect(
      getDataPath(
        gql`
          query {
            data: todoLists @table {
              id @column(label: "id")
              name @column(label: "Name")
              todoes {
                id
              }
            }
          }
        `
      )
    ).toEqual("data")
  })
})
