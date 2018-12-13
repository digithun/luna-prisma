import * as React from "react"
export interface PaginationPropTypes {
    currentPage: number
    totalPage: number
    lastPage: number
    onClick?: (item: number) => void
}

export const enum PAGINATION_ITEM_TYPE {
    NEXT = "next",
    PREVIOUS = "previous",
    NUMBER = "number"
}

export interface PaginationItemPropTypes
    extends PaginationPropTypes {
    pageNumber: any
    bindClickPage: any
    type: PAGINATION_ITEM_TYPE
    className: any
}

export const PaginationItem: React.SFC<PaginationItemPropTypes> = (
    props: PaginationItemPropTypes
) => {
    const onClick: any = props.onClick
    const bindClick = (page) => () => onClick(page)
    if (props.type === PAGINATION_ITEM_TYPE.NUMBER) {
        return (
            <li className={props.className}>
                <a
                    className="page-link"
                    onClick={bindClick(props.bindClickPage)}
                >
                    {`${props.pageNumber}`}
                </a>
            </li>)
    }
    const string = props.type === PAGINATION_ITEM_TYPE.PREVIOUS ? "ก่อนหน้า" : "ถัดไป"
    return (
        <li className={props.className}>
            <a
                className="page-link"
                onClick={bindClick(props.bindClickPage)}
            >
                {string}
            </a>
        </li>
    )
}

export const Pagination: React.SFC<PaginationPropTypes> = props => {
    if (
        props.lastPage <= 1 ||
        (props.currentPage < 1 || props.currentPage > props.lastPage)
    ) {
        return <div className="Pagination--no-need-to-display" />
    }

    const pagesNumber: any[] = []
    // Previous
    pagesNumber.push(
        <PaginationItem
            {...props}
            pageNumber={props.currentPage !== 1 ? props.currentPage - 1 : props.currentPage}
            bindClickPage={1}
            className={props.currentPage !== 1 ? "page-item" : "page-item disabled"}
            type={PAGINATION_ITEM_TYPE.PREVIOUS}
            key={PAGINATION_ITEM_TYPE.PREVIOUS}
        />)

    // Page Number
    if (props.currentPage - 3 < 1) {
        for (let i = props.currentPage - 3; i < props.currentPage + 2; i++) {
            if (i < props.lastPage && i >= 1) {
                const currentPageclassName = props.currentPage === i ? "page-item active" : "page-item"
                pagesNumber.push(
                    <PaginationItem
                        key={i}
                        {...props}
                        pageNumber={i}
                        bindClickPage={i}
                        className={currentPageclassName}
                        type={PAGINATION_ITEM_TYPE.NUMBER}
                    />
                )
            }
        }
    } else {
        pagesNumber.push(
            <PaginationItem
                key={1}
                {...props}
                pageNumber={1}
                bindClickPage={1}
                className={""}
                type={PAGINATION_ITEM_TYPE.NUMBER}
            />
        )
        if (props.currentPage - 2 === 2) {
            for (let i = props.currentPage - 2; i < props.currentPage - 1; i++) {
                if (i < props.lastPage && i >= 1) {
                    const pageClassName = `${props.currentPage === i ? "page-item active" : "page-item"}`
                    pagesNumber.push(
                        <PaginationItem
                            key={i}
                            {...props}
                            pageNumber={i}
                            bindClickPage={i}
                            className={pageClassName}
                            type={PAGINATION_ITEM_TYPE.NUMBER}
                        />
                    )
                }
            }
        } else {
            pagesNumber.push(
                <li className="page-item disabled"><a className="page-link" >{"..."}</a></li>
            )
        }

        for (let i = props.currentPage - 1; i < props.currentPage + 2; i++) {
            if (i < props.lastPage && i >= 1) {
                const pageClassName = `${props.currentPage === i ? "page-item active" : "page-item"}`
                pagesNumber.push(
                    <PaginationItem
                        key={i}
                        {...props}
                        pageNumber={i}
                        bindClickPage={i}
                        className={pageClassName}
                        type={PAGINATION_ITEM_TYPE.NUMBER}
                    />
                )
            }
        }
    }

    if (props.currentPage < props.lastPage - 2) {
        if (props.lastPage - props.currentPage === 3) {
            for (let i = props.currentPage + 2; i < props.lastPage; i++) {
                if (i < props.lastPage && i >= 1) {
                    pagesNumber.push(
                        <PaginationItem
                            key={i}
                            {...props}
                            pageNumber={i}
                            bindClickPage={i}
                            className=""
                            type={PAGINATION_ITEM_TYPE.NUMBER}
                        />
                    )
                }
            }
        } else {
            pagesNumber.push(
                <li className="page-item disabled"><a className="page-link">{"..."}</a></li>
            )
        }
    }

    const className = props.currentPage === props.lastPage ? "page-item active" : "page-item"
    pagesNumber.push(
        <PaginationItem
            key={"latest"}
            {...props}
            pageNumber={props.lastPage}
            bindClickPage={props.lastPage}
            className={className}
            type={PAGINATION_ITEM_TYPE.NUMBER}
        />
    )

    // Next
    pagesNumber.push(
        <PaginationItem
            {...props}
            pageNumber={props.currentPage !== props.lastPage ? props.currentPage + 1 : props.currentPage}
            bindClickPage={props.currentPage + 1}
            className={props.currentPage !== props.lastPage ? "page-item" : "page-item disabled"}
            type={PAGINATION_ITEM_TYPE.NEXT}
            key={PAGINATION_ITEM_TYPE.NEXT}
        />)

    return (
        <nav aria-label="...">
            <ul className="pagination">
                {pagesNumber}
            </ul>
        </nav>
    )
}