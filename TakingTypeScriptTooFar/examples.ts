type KeywordsToTypes = {
    string: string
    number: number
    boolean: boolean
    null: null
    any: any
    // etc...
}

type TypeOfKeyword<Keyword extends keyof KeywordsToTypes> =
    KeywordsToTypes[Keyword]

// Typed as string
type Result = TypeOfKeyword<"string">

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

type User = {
    name: {
        first: string
        middle?: string
        last: string
    }
    emails: string[] | null
    coords: [number, number]
}

type TypeOfObject<Obj extends object> = {
    // For each Key in Obj
    [Key in keyof Obj]: Obj[Key] extends object // If the corresponding value is a nested object...
        ? // Recurse to infer its type.
          TypeOfObject<Obj[Key]>
        : // If the corresponding value is a string...
        Obj[Key] extends string
        ? // Use our last generic to infer its type.
          TypeOfExpression<Obj[Key]>
        : // Else, the value is not something we've defined yet so infer unknown
          unknown
    // The "& unknown" is a little trick that forces TS to eagerly evaluate nested objects so you can see the full type when you mouse over it
} & unknown

type ValidateObject<Obj extends object> = {
    // For each Key in Obj
    [Key in keyof Obj]: Obj[Key] extends object // If the corresponding value is a nested object...
        ? // Recurse to validate its props
          TypeOfObject<Obj[Key]>
        : // If the corresponding value is a string...
        Obj[Key] extends string
        ? // Use our last expression
          TypeOfExpression<Obj[Key]>
        : // Else, the value is not something we've defined yet so infer unknown
          unknown
    // The "& unknown" is a little trick that forces TS to eagerly evaluate nested objects so you can see the full type when you mouse over it
}

type ObjectResult = TypeOfObject<{
    name: {
        first: "string"
        middle: "string?"
        last: "string"
    }
    emails: "string[]|null"
    coords: ["number", "number"]
}>

const parseExpression = <Expression extends string>(
    expression: ValidateExpression<Expression>
): TypeOfExpression<Expression> => {
    // The actual return value is irrelevant (for now) since we're just using it to infer a type
    return null as any
}

const goodType = parseExpression("string|number[]?")

// @ts-expect-error
const badType = parseExpression("string|numbr[]?")
