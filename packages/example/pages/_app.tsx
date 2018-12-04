import * as React from "react"
import App, { NextAppContext } from "next/app"
import "bootstrap/scss/bootstrap-reboot.scss"
import "bootstrap/scss/bootstrap.scss"
import "luna-prisma-tools/main.scss"

export default class BK1CMSAppLayout extends App {
  public static async getInitialProps(c: NextAppContext) {
    const { Component, ctx } = c
    let pageProps = {}

    console.info(`Access: ${c.router.pathname}`)

    if (Component.getInitialProps) {
      pageProps = await Component.getInitialProps(ctx)
    }

    return { pageProps: { ...pageProps, query: ctx.query } }
  }

  public render() {
    const { Component, pageProps } = this.props

    // @ts-ignore
    return <Component {...pageProps} />
  }
}
