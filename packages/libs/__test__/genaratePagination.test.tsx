import gql from "graphql-tag"
import { parseSDLToTableColumnInfos } from "../genarateTableMetaFromSDL"
const objectPath = require("object-path")
describe("Genarate Pagination", () => {
    it("should parse pagination", () => {
        expect(
            parseSDLToTableColumnInfos(
                gql`
                    query {
                        data: todoes @table {
                            name @column(label: "Name")
                            state @column(label: "State")
                            color @column(label: "Color")
                        }
                        count: todoesConnection @pagination {
                            aggregate {
                                count @total
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
                        key: "name",
                        label: "Name",
                        path: "query.data.name",
                    },
                    {
                        kind: "TableBooleanColumnInfo",
                        key: "state",
                        label: "State",
                        path: "query.data.state",
                    },
                    {
                        kind: "TableEnumColumnInfo",
                        key: "color",
                        label: "Color",
                        path: "query.data.color",
                        enumValues: [
                            "RED",
                            "BLUE",
                            "GREEN",
                        ]
                    }
                ],
                totalPath: "query.count.aggregate.count"
            }
        )
    })

})
