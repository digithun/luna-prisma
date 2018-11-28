import gql from "graphql-tag"
import {
  parseSDLToTableColumnInfos,
  getTableHeaderColumnInfo,
  getDataFromDatasourceItem,
} from "../genarateTableMetaFromSDL"

describe("grnarateFromSDLTest", () => {
  it("should parse column SDL corretly", () => {
    expect(
      parseSDLToTableColumnInfos(
        gql`
          query {
            todoLists {
              id @column(lable: "id")
              name @column(lable: "Name")
              todoes {
                id
              }
            }
          }
        `,
        require("./luna-schema"),
        require("./mock-data-todoLits").todoLists
      )
    ).toEqual([
      [
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
      [
        {
          path: "query.todoLists.id",
          value: "todo_list_id_0",
        },
        {
          path: "query.todoLists.name",
          value: "todo_list_name_0",
        },
      ],
      [
        {
          path: "query.todoLists.id",
          value: "todo_list_id_1",
        },
        {
          path: "query.todoLists.name",
          value: "todo_list_name_1",
        },
      ],
    ])
  })
  it("should table header corretly", () => {
    expect(
      getTableHeaderColumnInfo(
        gql`
          query {
            todoLists {
              id @column(lable: "id")
              name @column(lable: "Name")
              todoes {
                id
              }
            }
          }
        `,
        require("./luna-schema")
      )
    ).toEqual([
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
    ])

    // Test Enum and Boolean Type
    expect(getTableHeaderColumnInfo(gql`
            query {
                todoes {
                    id
                    name @column(lable: "Name")
                    state @column(label: "State")
                    color @column(label: "Color")
                }

              } `, require('./luna-schema'))).toEqual(
      [
        {
          kind: "TableStringColumnInfo",
          key: "name",
          label: "Name",
          path: "query.todoes.name"
        },
        {
          kind: "TableBooleanColumnInfo",
          key: "state",
          label: "State",
          path: "query.todoes.state"
        },
        {
          kind: "TableEnumColumnInfo",
          key: "color",
          label: "Color",
          path: "query.todoes.color",
          enumValues: [
            "RED",
            "BLUE",
            "GREEN",
          ]
        }
      ])
  })
  it("should get Data corretly", () => {
    const columnInfos: any =
      [
        {
          kind: "TableStringColumnInfo",
          key: "name",
          label: "Name",
          path: "query.todos.name"
        },
        {
          kind: "TableBooleanColumnInfo",
          key: "state",
          label: "State",
          path: "query.todos.state"
        },
        {
          kind: "TableEnumColumnInfo",
          key: "color",
          label: "Color",
          path: "query.todos.color",
          enumValues: [
            "RED",
            "BLUE",
            "GREEN",
          ]
        }
      ]

    const result =
      [
        [
          {
            "path": "query.todos.name",
            "value": "todo_name_00"
          },
          {
            "path": "query.todos.state",
            "value": false
          },
          {
            "path": "query.todos.color",
            "value": "RED"
          }
        ],
        [
          {
            "path": "query.todos.name",
            "value": "todo_name_10"
          },
          {
            "path": "query.todos.state",
            "value": false
          },
          {
            "path": "query.todos.color",
            "value": "BLUE"
          }
        ]
      ]
    expect(getDataFromDatasourceItem(require('./mock-data-todos').todos, columnInfos)).toEqual(result)
  })
  it("should parse column SDL invalid", () => {
    expect(() => getTableHeaderColumnInfo(gql`
        query {
            stodoLists {
              id @column(lable: "id")
              name @column(lable: "Name")
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
      getTableHeaderColumnInfo(
        gql`
          query {
            todoLists {
              ids @column(lable: "id")
              name @column(lable: "Name")
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
})
