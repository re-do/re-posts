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

const parseExpression = <Expression extends string>(
    expression: ValidateExpression<Expression>
): TypeOfExpression<Expression> => {
    // The actual return value is irrelevant since we're just using it to infer a shallow type (for now)
    return null as any
}

const goodType = parseExpression("string|number[]?")

// @ts-expect-error
const badType = parseExpression("string|numbr[]?")

type User = {
    name: {
        first: string
        middle?: string
        last: string
    }
    emails: string[] | null
    coords: [number, number]
}

type TypeOf<Def> = Def extends object
    ? {
          [Key in keyof Def]: TypeOf<Def[Key]>
      }
    : Def extends string
    ? TypeOfExpression<Def>
    : unknown

type Validate<Def> = Def extends object
    ? {
          [Key in keyof Def]: Validate<Def[Key]>
      }
    : Def extends string
    ? ValidateExpression<Def>
    : `Error: Definitions must be strings or objects whose leaves are strings.`

const parse = <Def>(definition: Validate<Def>): TypeOf<Def> => {
    // Now that we're
    return null as any
}

const myType = parse({
    name: {
        first: "string",
        middle: "string?",
        last: "string"
    },
    emails: "string[]|null",
    coords: ["number", "number"]
})
