const { compose } = require("react-apollo")

let config = {}
if (process.env.NODE_ENV === "production") {
  console.log("Running in production mode")
} else {
  console.log("Running in development/builder mode")
  const withTypescript = require("@zeit/next-typescript")
  const withSass = require("@zeit/next-sass")
  config = compose(
    withTypescript,
    withSass
  )()
}

module.exports = config
