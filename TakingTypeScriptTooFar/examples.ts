type KeywordsToTypes = {
    string: string
    number: number
    boolean: boolean
    any: any
    // etc...
}

type TypeOfKeyword<Keyword extends keyof KeywordsToTypes> =
    KeywordsToTypes[Keyword]

// Typed as string
type Result = TypeOfKeyword<"string">

type User = {
    name: {
        first: string
        last: string
    }
    email: string
    isAdmin: boolean
    coords: [number, number]
}

type TypeOfObject<Obj extends object> = {
    [Key in keyof Obj]: Obj[Key] extends keyof KeywordsToTypes
        ? TypeOfKeyword<Obj[Key]>
        : Obj[Key] extends object
        ? TypeOfObject<Obj[Key]>
        : unknown
} & unknown

type Result2 = TypeOfObject<{
    name: {
        first: "string"
        last: "string"
    }
    email: "string"
    isAdmin: "boolean"
    coords: ["number", "number"]
}>

type TypeOfExpression<Expression extends string> =
    Expression extends `${infer Optional}?`
        ? TypeOfExpression<Optional> | undefined
        : Expression extends `${infer Right}|${infer Left}`
        ? TypeOfExpression<Right> | TypeOfExpression<Left>
        : Expression extends `${infer Item}[]`
        ? TypeOfExpression<Item>[]
        : Expression extends keyof KeywordsToTypes
        ? TypeOfKeyword<Expression>
        : unknown

type Result3 = TypeOfExpression<`string|number[]?`>

type ValidateExpression<Expression extends string> = ValidateFragment<
    Expression,
    Expression
>

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
    : Fragment extends keyof KeywordsToTypes
    ? Root
    : `Error: ${Fragment} is not a valid expression.`

export const parse = <Expression extends string>(
    expression: ValidateExpression<Expression>
): TypeOfExpression<Expression> => {
    // Allow a user to extract types from arbitrary chains of props
    const typeDefProxy: any = new Proxy({}, { get: () => typeDefProxy })
    return typeDefProxy
}

const myType = parse("string|number[]?")
