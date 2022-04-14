import { StartingSmall } from "./StartingSmall.js"

export namespace ExpressingYourself {
    export type TypeOfExpression<Expression extends string> =
        Expression extends `${infer Optional}?`
            ? TypeOfExpression<Optional> | undefined
            : Expression extends `${infer Right}|${infer Left}`
            ? TypeOfExpression<Right> | TypeOfExpression<Left>
            : Expression extends `${infer Item}[]`
            ? TypeOfExpression<Item>[]
            : Expression extends keyof StartingSmall.KeywordsToTypes
            ? StartingSmall.TypeOfKeyword<Expression>
            : unknown

    export type ValidateExpression<Expression extends string> =
        ValidateFragment<Expression, Expression>

    type ValidateFragment<
        Fragment extends string,
        Root extends string
    > = Fragment extends `${infer Optional}?`
        ? ValidateFragment<Optional, Root>
        : Fragment extends `${infer Right}|${infer Left}`
        ? ValidateFragment<Right, Root> extends Root
            ? ValidateFragment<Left, Root>
            : ValidateFragment<Right, Root>
        : Fragment extends `${infer Item}[]`
        ? ValidateFragment<Item, Root>
        : Fragment extends keyof StartingSmall.KeywordsToTypes
        ? Root
        : `Error: ${Fragment} is not a valid expression.`

    const parseExpression = <Expression extends string>(
        expression: ValidateExpression<Expression>
    ): TypeOfExpression<Expression> => {
        // The actual return value is irrelevant since we're just using it to infer a shallow type (for now)
        return null as any
    }

    const goodType = parseExpression("string|number[]?")

    // @ts-expect-error
    const badType = parseExpression("string|numbr[]?")
}
